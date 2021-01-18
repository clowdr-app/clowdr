import { gql } from "@apollo/client/core";
import { ContentItemDataBlob, ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import {
    CreateBroadcastContentItemDocument,
    CreateVideoRenderJobDocument,
    CreateVonageBroadcastContentItemDocument,
    GetEventsDocument,
    GetEventsWithoutVonageSessionDocument,
    GetVideoBroadcastContentItemsDocument,
    OtherConferencePrepareJobsDocument,
    SetEventVonageSessionIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { failConferencePrepareJob } from "../lib/conferencePrepareJob";
import { createTransitions } from "../lib/transitions";
import Vonage from "../lib/vonage/vonageClient";
import { ConferencePrepareJobData, Payload } from "../types/hasura/event";

gql`
    query OtherConferencePrepareJobs($conferenceId: uuid!, $conferencePrepareJobId: uuid!) {
        ConferencePrepareJob(
            where: {
                jobStatusName: { _eq: IN_PROGRESS }
                conferenceId: { _eq: $conferenceId }
                id: { _neq: $conferencePrepareJobId }
            }
        ) {
            id
            updatedAt
        }
    }

    query GetVideoBroadcastContentItems($conferenceId: uuid) {
        ContentItem(where: { conferenceId: { _eq: $conferenceId }, contentTypeName: { _eq: VIDEO_BROADCAST } }) {
            id
            data
        }
    }
`;

export async function handleConferencePrepareJobInserted(payload: Payload<ConferencePrepareJobData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    console.log("Conference prepare: job triggered", payload.event.data.new.id, payload.event.data.new.conferenceId);

    try {
        // get list of other in-progress jobs. If any are in progress, set this new one to failed and return.
        const otherJobs = await apolloClient.query({
            query: OtherConferencePrepareJobsDocument,
            variables: {
                conferenceId: payload.event.data.new.conferenceId,
                conferencePrepareJobId: payload.event.data.new.id,
            },
        });

        if (otherJobs.data.ConferencePrepareJob.length > 0) {
            console.log(
                "Conference prepare: another job in progress, aborting.",
                otherJobs.data.ConferencePrepareJob[0].id,
                payload.event.data.new.id
            );
            throw new Error(
                `Another conference prepare job (${otherJobs.data.ConferencePrepareJob[0].id}) is already in progress`
            );
        }

        await createVideoBroadcastItems(payload.event.data.new.id, payload.event.data.new.conferenceId);
        // await createEventTitleSlideBroadcastItems(payload.event.data.new.id, payload.event.data.new.conferenceId);
        await createEventVonageSessionsBroadcastItems(payload.event.data.new.conferenceId);

        console.log("Conference prepare: finished initialising job", payload.event.data.new.id);
    } catch (e) {
        console.error("Conference prepare: fatal error while initialising job", e);
        await failConferencePrepareJob(payload.event.data.new.id, e.message ?? "Unknown error while initialising job");
    }
}

async function createVideoBroadcastItems(conferencePrepareJobId: string, conferenceId: string): Promise<void> {
    const videoBroadcastItems = await apolloClient.query({
        query: GetVideoBroadcastContentItemsDocument,
        variables: {
            conferenceId,
        },
    });
    console.log(
        `Conference prepare: found ${videoBroadcastItems.data.ContentItem.length} video broadcast items`,
        conferencePrepareJobId
    );

    // For each video broadcast, add a broadcast content item if the item
    // has already been transcoded for broadcast. Else fire off a transcoding job.
    for (const videoBroadcastItem of videoBroadcastItems.data.ContentItem) {
        console.log("Conference prepare: prepare broadcast item", videoBroadcastItem.id, conferencePrepareJobId);
        const content: ContentItemDataBlob = videoBroadcastItem.data;

        if (content.length < 1) {
            console.warn("Conference prepare: no content item versions", videoBroadcastItem.id, conferencePrepareJobId);
            continue;
        }

        const latestVersion = content[content.length - 1];

        if (latestVersion.data.type !== ContentType_Enum.VideoBroadcast) {
            console.warn(
                "Conference prepare: invalid content item data (not a video broadcast)",
                videoBroadcastItem.id,
                conferencePrepareJobId
            );
            continue;
        }

        if (latestVersion.data.broadcastTranscode && latestVersion.data.broadcastTranscode.s3Url) {
            console.log(
                "Conference prepare: item already has up-to-date broadcast transcode",
                videoBroadcastItem.id,
                conferencePrepareJobId
            );
            const broadcastItemInput: MP4Input = {
                s3Url: latestVersion.data.broadcastTranscode.s3Url,
                type: "MP4Input",
            };

            await apolloClient.mutate({
                mutation: CreateBroadcastContentItemDocument,
                variables: {
                    conferenceId,
                    contentItemId: videoBroadcastItem.id,
                    input: broadcastItemInput,
                },
            });
        } else {
            console.log(
                "Conference prepare: item needs broadcast transcode",
                videoBroadcastItem.id,
                conferencePrepareJobId
            );

            let broadcastContentItemId;
            try {
                broadcastContentItemId = await upsertPendingMP4BroadcastContentItem(
                    conferencePrepareJobId,
                    conferenceId,
                    videoBroadcastItem.id
                );
            } catch (e) {
                continue;
            }

            const broadcastRenderJobData: BroadcastRenderJobDataBlob = {
                type: "BroadcastRenderJob",
                subtitlesS3Url: latestVersion.data.subtitles["en_US"].s3Url,
                videoS3Url: latestVersion.data.s3Url,
            };

            // Create a video render job to populate the broadcast content item
            await apolloClient.mutate({
                mutation: CreateVideoRenderJobDocument,
                variables: {
                    conferenceId,
                    conferencePrepareJobId,
                    data: broadcastRenderJobData,
                    broadcastContentItemId,
                },
            });
        }
    }
}

async function upsertPendingMP4BroadcastContentItem(
    conferencePrepareJobId: string,
    conferenceId: string,
    contentItemId: string
): Promise<string> {
    gql`
        mutation CreateBroadcastContentItem($conferenceId: uuid!, $contentItemId: uuid!, $input: jsonb!) {
            insert_BroadcastContentItem_one(
                object: {
                    conferenceId: $conferenceId
                    contentItemId: $contentItemId
                    inputTypeName: MP4
                    input: $input
                }
                on_conflict: {
                    constraint: BroadcastContentItem_contentItemId_key
                    update_columns: [conferenceId, input, inputTypeName]
                }
            ) {
                id
            }
        }
    `;

    // Create an empty broadcast content item
    const broadcastItemInput: PendingCreation = {
        type: "PendingCreation",
    };

    const broadcastContentItemResult = await apolloClient.mutate({
        mutation: CreateBroadcastContentItemDocument,
        variables: {
            conferenceId: conferenceId,
            contentItemId: contentItemId,
            input: broadcastItemInput,
        },
    });

    if (!broadcastContentItemResult.data?.insert_BroadcastContentItem_one?.id) {
        console.error(
            "Conference prepare: failed to create broadcast content item",
            broadcastContentItemResult.errors,
            contentItemId,
            conferencePrepareJobId
        );
        throw new Error("Failed to create pending broadcast content item");
    }

    return broadcastContentItemResult.data.insert_BroadcastContentItem_one.id;
}

gql`
    mutation CreateVideoRenderJob(
        $conferenceId: uuid!
        $conferencePrepareJobId: uuid!
        $broadcastContentItemId: uuid!
        $data: jsonb!
    ) {
        insert_VideoRenderJob_one(
            object: {
                conferenceId: $conferenceId
                conferencePrepareJobId: $conferencePrepareJobId
                broadcastContentItemId: $broadcastContentItemId
                data: $data
                jobStatusName: NEW
            }
        ) {
            id
        }
    }
`;

// async function createEventTitleSlideBroadcastItems(
//     conferencePrepareJobId: string,
//     conferenceId: string
// ): Promise<void> {
//     // Render event title slides
//     console.log("Conference prepare: rendering title slides", conferencePrepareJobId);

//     let backgroundVideo, bucket, key;
//     try {
//         const backgroundVideos = await getConferenceConfiguration<string[]>(conferenceId, "BACKGROUND_VIDEOS");
//         if (!backgroundVideos) {
//             throw new Error("No BACKGROUND_VIDEOS configuration found");
//         }
//         backgroundVideo = backgroundVideos[0];
//         const parsedUri = AmazonS3URI(backgroundVideo);
//         bucket = parsedUri.bucket;
//         key = parsedUri.key;
//     } catch (e) {
//         console.error("Conference prepare: could not load video filler", conferencePrepareJobId, e);
//     }

//     gql`
//         query GetEventTitleDetails($conferenceId: uuid!) {
//             Event(
//                 where: {
//                     conferenceId: { _eq: $conferenceId }
//                     contentGroup: { contentItems: { contentTypeName: { _in: [VIDEO_BROADCAST] } } }
//                     intendedRoomModeName: { _eq: PRERECORDED }
//                 }
//             ) {
//                 id
//                 contentGroup {
//                     id
//                     title
//                     people(distinct_on: id) {
//                         person {
//                             name
//                             id
//                         }
//                         id
//                     }
//                     contentItems(
//                         distinct_on: contentTypeName
//                         where: { contentTypeName: { _eq: VIDEO_BROADCAST } }
//                         order_by: { contentTypeName: asc }
//                         limit: 1
//                     ) {
//                         contentTypeName
//                         id
//                         contentGroupId
//                     }
//                 }
//                 intendedRoomModeName
//                 name
//             }
//         }
//     `;

//     const eventsResult = await apolloClient.query({
//         query: GetEventTitleDetailsDocument,
//         variables: {
//             conferenceId: conferenceId,
//         },
//     });

//     console.log(
//         `Conference prepare: rendering title slides for ${eventsResult.data.Event.length} events`,
//         conferencePrepareJobId
//     );
//     for (const event of eventsResult.data.Event) {
//         console.log("Conference prepare: rendering title slides for event", conferencePrepareJobId, event.id);
//         if (!event.contentGroup || event.contentGroup.contentItems.length < 1) {
//             console.warn(
//                 "Conference prepare: event does not contain a video broadcast",
//                 conferencePrepareJobId,
//                 event.id
//             );
//             continue;
//         }

//         const contentItem = event.contentGroup?.contentItems[0];

//         const names = event.contentGroup.people.map((person) => person.person.name);
//         const eventTitle = event.name;
//         const name = uuidv4();

//         const project = await OpenShotClient.projects.createProject({
//             channel_layout: ChannelLayout.STEREO,
//             channels: 2,
//             fps_den: 1,
//             fps_num: 30,
//             height: 1080,
//             width: 1920,
//             name,
//             sample_rate: 44100,
//             json: {},
//         });

//         let duration = 10.0;

//         if (bucket && key) {
//             const videoFile = await OpenShotClient.files.uploadS3Url(project.id, bucket, key, key);

//             duration = videoFile.json.duration;

//             await OpenShotClient.clips.createClip({
//                 project: OpenShotClient.projects.toUrl(project.id),
//                 file: OpenShotClient.files.toUrl(videoFile.id),
//                 start: 0.0,
//                 end: duration,
//                 layer: 0,
//                 json: {},
//                 position: 0.0,
//             });
//         }

//         const titleFile = await OpenShotClient.projects.createTitle(project.id, {
//             template: "Center-Text.svg",
//             text: wrap(eventTitle, { width: 30 })
//                 .split("\n")
//                 .map((line) => `<tspan x="960" dy="1em">${line.trim()}</tspan>`)
//                 .join(""),
//             font_size: 100.0,
//             font_name: "Bitstream Vera Sans",
//             fill_color: "#ffcc00",
//             fill_opacity: 1.0,
//             stroke_color: "#000000",
//             stroke_size: 3.0,
//             stroke_opacity: 1.0,
//             drop_shadow: true,
//             background_color: "#000000",
//             background_opacity: 0.4,
//         });

//         await OpenShotClient.clips.createClip({
//             project: OpenShotClient.projects.toUrl(project.id),
//             file: OpenShotClient.files.toUrl(titleFile.id),
//             start: 0.0,
//             end: duration,
//             layer: 1,
//             json: {},
//             position: 0.0,
//         });

//         const titleRenderJobData: TitleRenderJobDataBlob = {
//             type: "TitleRenderJob",
//             authors: names,
//             openShotProjectId: project.id,
//             name,
//         };

//         gql`
//             mutation CreateVideoTitlesContentItem($conferenceId: uuid!, $contentGroupId: uuid!, $title: String!) {
//                 insert_ContentItem_one(
//                     object: {
//                         conferenceId: $conferenceId
//                         contentGroupId: $contentGroupId
//                         contentTypeName: VIDEO_TITLES
//                         data: []
//                         name: $title
//                     }
//                 ) {
//                     id
//                 }
//             }

//             query GetVideoTitlesContentItem($contentGroupId: uuid!, $title: String!) {
//                 ContentItem(
//                     where: {
//                         contentGroupId: { _eq: $contentGroupId }
//                         contentTypeName: { _eq: VIDEO_TITLES }
//                         name: { _eq: $title }
//                     }
//                     limit: 1
//                     order_by: { createdAt: desc }
//                 ) {
//                     id
//                 }
//             }
//         `;

//         // Check whether there is an existing title slide content item for this event name.
//         // If not, create it.
//         const existingTitlesContentItemResult = await apolloClient.query({
//             query: GetVideoTitlesContentItemDocument,
//             variables: {
//                 contentGroupId: contentItem.contentGroupId,
//                 title: event.name,
//             },
//         });

//         let titleContentItemId;
//         if (existingTitlesContentItemResult.data.ContentItem.length > 0) {
//             titleContentItemId = existingTitlesContentItemResult.data.ContentItem[0].id;
//         } else {
//             const createTitlesContentItemResult = await apolloClient.mutate({
//                 mutation: CreateVideoTitlesContentItemDocument,
//                 variables: {
//                     conferenceId: conferenceId,
//                     contentGroupId: contentItem.contentGroupId,
//                     title: event.name,
//                 },
//             });

//             if (!createTitlesContentItemResult.data?.insert_ContentItem_one?.id) {
//                 console.error(
//                     "Conference prepare: could not create new content item for titles",
//                     createTitlesContentItemResult.errors,
//                     conferencePrepareJobId,
//                     event.id
//                 );
//                 throw new Error(`Could not create new titles content item for event (${event.id})`);
//             }
//             titleContentItemId = createTitlesContentItemResult.data.insert_ContentItem_one.id;
//         }

//         let broadcastContentItemId;
//         try {
//             broadcastContentItemId = await upsertPendingMP4BroadcastContentItem(
//                 conferencePrepareJobId,
//                 conferenceId,
//                 titleContentItemId
//             );
//         } catch (e) {
//             console.error(
//                 "Conference prepare: failed to create broadcast content item",
//                 e,
//                 event.id,
//                 conferencePrepareJobId
//             );
//             throw new Error(`Failed to create broadcast content item for event (${event.id})`);
//         }

//         await apolloClient.mutate({
//             mutation: CreateVideoRenderJobDocument,
//             variables: {
//                 conferenceId,
//                 conferencePrepareJobId,
//                 data: titleRenderJobData,
//                 broadcastContentItemId,
//             },
//         });
//     }
// }

async function createEventVonageSessionsBroadcastItems(conferenceId: string): Promise<void> {
    console.log("Creating broadcast content items for presenter Vonage rooms", conferenceId);
    gql`
        query GetEventsWithoutVonageSession($conferenceId: uuid!) {
            Event(where: { conferenceId: { _eq: $conferenceId }, _and: { _not: { eventVonageSession: {} } } }) {
                id
            }
        }
    `;

    const eventsWithoutSessionResult = await apolloClient.query({
        query: GetEventsWithoutVonageSessionDocument,
        variables: {
            conferenceId,
        },
    });

    if (eventsWithoutSessionResult.error || eventsWithoutSessionResult.errors) {
        console.error(
            "Failed to retrieve list of events without presenter Vonage sessions",
            eventsWithoutSessionResult.error ?? eventsWithoutSessionResult.errors
        );
        throw new Error("Failed to retrieve list of events without presenter Vonage sessions");
    }

    for (const room of eventsWithoutSessionResult.data.Event) {
        console.log("Creating Vonage session for event", room.id);
        try {
            const sessionResult = await Vonage.createSession({ mediaMode: "routed" });

            if (!sessionResult) {
                throw new Error("No session ID returned from Vonage");
            }

            gql`
                mutation SetEventVonageSessionId($eventId: uuid!, $conferenceId: uuid!, $sessionId: String!) {
                    insert_EventVonageSession_one(
                        object: { eventId: $eventId, conferenceId: $conferenceId, sessionId: $sessionId }
                        on_conflict: { constraint: EventVonageSession_eventId_key, update_columns: sessionId }
                    ) {
                        id
                    }
                }
            `;

            await apolloClient.mutate({
                mutation: SetEventVonageSessionIdDocument,
                variables: {
                    eventId: room.id,
                    conferenceId,
                    sessionId: sessionResult.sessionId,
                },
            });
        } catch (e) {
            console.error("Failed to create Vonage session", room.id, e);
            throw new Error(`Failed to create Vonage session: ${e.message}`);
        }
    }

    gql`
        query GetEvents($conferenceId: uuid!) {
            Event(where: { conferenceId: { _eq: $conferenceId } }) {
                id
                eventVonageSession {
                    sessionId
                    id
                }
            }
        }
    `;

    console.log("Creating broadcast content items for each event's Vonage session", conferenceId);
    const eventsResult = await apolloClient.query({
        query: GetEventsDocument,
        variables: {
            conferenceId,
        },
        fetchPolicy: "network-only",
    });

    if (eventsResult.error || eventsResult.errors) {
        console.error("Failed to retrieve event Vonage sessions", eventsResult.error ?? eventsResult.errors);
        throw new Error("Failed to retrieve event Vonage sessions");
    }

    gql`
        mutation CreateVonageBroadcastContentItem($conferenceId: uuid!, $eventId: uuid!, $input: jsonb!) {
            insert_BroadcastContentItem_one(
                object: { conferenceId: $conferenceId, eventId: $eventId, inputTypeName: VONAGE_SESSION, input: $input }
                on_conflict: {
                    constraint: BroadcastContentItem_eventId_key
                    update_columns: [conferenceId, input, inputTypeName]
                }
            ) {
                id
            }
        }
    `;

    for (const event of eventsResult.data.Event) {
        console.log("Creating Vonage broadcast content item for event", event.id);
        if (!event.eventVonageSession?.sessionId) {
            console.warn("Missing Vonage session id for event, skipping.", event.id);
            continue;
        }

        const input: VonageInput = {
            type: "VonageInput",
            sessionId: event.eventVonageSession.sessionId,
        };

        await apolloClient.mutate({
            mutation: CreateVonageBroadcastContentItemDocument,
            variables: {
                conferenceId,
                input,
                eventId: event.id,
            },
        });
    }

    console.log("Creating transitions for conference", conferenceId);
    createTransitions(conferenceId);
}
