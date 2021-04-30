import { gql } from "@apollo/client/core";
import { Content_ElementType_Enum, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import {
    CompleteConferencePrepareJobDocument,
    CreateBroadcastElementDocument,
    CreateVideoRenderJobDocument,
    CreateVonageBroadcastElementDocument,
    GetEventsDocument,
    GetEventsWithoutVonageSessionDocument,
    GetVideoBroadcastElementsDocument,
    OtherConferencePrepareJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { failConferencePrepareJob } from "../lib/conferencePrepareJob";
import { createEventVonageSession } from "../lib/event";
import { createTransitions } from "../lib/transitions";
import { ConferencePrepareJobData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";

gql`
    query OtherConferencePrepareJobs($conferenceId: uuid!, $conferencePrepareJobId: uuid!) {
        conference_PrepareJob(
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

    query GetVideoBroadcastElements($conferenceId: uuid) {
        content_Element(where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: VIDEO_BROADCAST } }) {
            id
            data
        }
    }
`;

export async function handleConferencePrepareJobInserted(payload: Payload<ConferencePrepareJobData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    const newRow = payload.event.data.new;

    console.log("Conference prepare: job triggered", newRow.id, newRow.conferenceId);

    try {
        // get list of other in-progress jobs. If any are in progress, set this new one to failed and return.
        const otherJobs = await apolloClient.query({
            query: OtherConferencePrepareJobsDocument,
            variables: {
                conferenceId: newRow.conferenceId,
                conferencePrepareJobId: newRow.id,
            },
        });

        if (otherJobs.data.conference_PrepareJob.length > 0) {
            console.log(
                "Conference prepare: another job in progress, aborting.",
                otherJobs.data.conference_PrepareJob[0].id,
                newRow.id
            );
            throw new Error(
                `Another conference prepare job (${otherJobs.data.conference_PrepareJob[0].id}) is already in progress`
            );
        }

        const createdJob = await createVideoBroadcastItems(newRow.id, newRow.conferenceId);
        // await createEventTitleSlideBroadcastItems(payload.event.data.new.id, payload.event.data.new.conferenceId);
        await createEventVonageSessionsBroadcastItems(newRow.conferenceId);

        console.log("Conference prepare: finished initialising job", newRow.id);

        if (!createdJob) {
            await callWithRetry(async () => {
                await apolloClient.mutate({
                    mutation: CompleteConferencePrepareJobDocument,
                    variables: {
                        id: newRow.id,
                    },
                });
            });
            console.log("Conference prepare: job completed without needing to render broadcast items", newRow.id);
        }
    } catch (e) {
        console.error("Conference prepare: fatal error while initialising job", e);
        await callWithRetry(async () => {
            await failConferencePrepareJob(newRow.id, e.message ?? "Unknown error while initialising job");
        });
    }
}

async function createVideoBroadcastItems(conferencePrepareJobId: string, conferenceId: string): Promise<boolean> {
    const videoBroadcastItems = await apolloClient.query({
        query: GetVideoBroadcastElementsDocument,
        variables: {
            conferenceId,
        },
    });
    console.log(
        `Conference prepare: found ${videoBroadcastItems.data.content_Element.length} video broadcast items`,
        conferencePrepareJobId
    );

    let createdJob = false;

    // For each video broadcast, add a broadcast content item if the item
    // has already been transcoded for broadcast. Else fire off a transcoding job.
    for (const videoBroadcastItem of videoBroadcastItems.data.content_Element) {
        console.log("Conference prepare: prepare broadcast item", videoBroadcastItem.id, conferencePrepareJobId);
        const content: ElementDataBlob = videoBroadcastItem.data;

        if (content.length < 1) {
            console.warn("Conference prepare: no content item versions", videoBroadcastItem.id, conferencePrepareJobId);
            continue;
        }

        const latestVersion = content[content.length - 1];

        if (latestVersion.data.type !== Content_ElementType_Enum.VideoBroadcast) {
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
                mutation: CreateBroadcastElementDocument,
                variables: {
                    conferenceId,
                    elementId: videoBroadcastItem.id,
                    input: broadcastItemInput,
                },
            });
        } else {
            console.log(
                "Conference prepare: item needs broadcast transcode",
                videoBroadcastItem.id,
                conferencePrepareJobId
            );

            if (
                !latestVersion.data ||
                !latestVersion.data.s3Url ||
                latestVersion.data.s3Url === "" ||
                !latestVersion.data.subtitles ||
                !latestVersion.data.subtitles["en_US"] ||
                !latestVersion.data.subtitles["en_US"].s3Url
            ) {
                console.log(
                    "Conference prepare: Skipping item because it is missing one or more pieces of information needed to prepare it",
                    videoBroadcastItem.id,
                    conferencePrepareJobId
                );
            } else {
                let broadcastElementId;
                try {
                    broadcastElementId = await callWithRetry(
                        async () =>
                            await upsertPendingMP4BroadcastElement(
                                conferencePrepareJobId,
                                conferenceId,
                                videoBroadcastItem.id
                            )
                    );
                } catch (e) {
                    console.error(
                        "Failed to upsert pending MP4 broadcast content item",
                        conferencePrepareJobId,
                        videoBroadcastItem.id
                    );
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
                        broadcastElementId,
                    },
                });
                createdJob = true;
            }
        }
    }

    return createdJob;
}

async function upsertPendingMP4BroadcastElement(
    conferencePrepareJobId: string,
    conferenceId: string,
    elementId: string
): Promise<string> {
    gql`
        mutation CreateBroadcastElement($conferenceId: uuid!, $elementId: uuid!, $input: jsonb!) {
            insert_video_BroadcastElement_one(
                object: { conferenceId: $conferenceId, elementId: $elementId, inputTypeName: MP4, input: $input }
                on_conflict: {
                    constraint: BroadcastElement_elementId_key
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

    const broadcastElementResult = await apolloClient.mutate({
        mutation: CreateBroadcastElementDocument,
        variables: {
            conferenceId: conferenceId,
            elementId: elementId,
            input: broadcastItemInput,
        },
    });

    if (!broadcastElementResult.data?.insert_video_BroadcastElement_one?.id) {
        console.error(
            "Conference prepare: failed to create broadcast content item",
            broadcastElementResult.errors,
            elementId,
            conferencePrepareJobId
        );
        throw new Error("Failed to create pending broadcast content item");
    }

    return broadcastElementResult.data.insert_video_BroadcastElement_one.id;
}

gql`
    mutation CreateVideoRenderJob(
        $conferenceId: uuid!
        $conferencePrepareJobId: uuid!
        $broadcastElementId: uuid!
        $data: jsonb!
    ) {
        insert_video_VideoRenderJob_one(
            object: {
                conferenceId: $conferenceId
                conferencePrepareJobId: $conferencePrepareJobId
                broadcastElementId: $broadcastElementId
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
//                     item: { elements: { typeName: { _in: [VIDEO_BROADCAST] } } }
//                     intendedRoomModeName: { _eq: PRERECORDED }
//                 }
//             ) {
//                 id
//                 item {
//                     id
//                     title
//                     people(distinct_on: id) {
//                         person {
//                             name
//                             id
//                         }
//                         id
//                     }
//                     elements(
//                         distinct_on: typeName
//                         where: { typeName: { _eq: VIDEO_BROADCAST } }
//                         order_by: { typeName: asc }
//                         limit: 1
//                     ) {
//                         typeName
//                         id
//                         itemId
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
//         if (!event.item || event.item.elements.length < 1) {
//             console.warn(
//                 "Conference prepare: event does not contain a video broadcast",
//                 conferencePrepareJobId,
//                 event.id
//             );
//             continue;
//         }

//         const element = event.item?.elements[0];

//         const names = event.item.people.map((person) => person.person.name);
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
//             mutation CreateVideoTitlesElement($conferenceId: uuid!, $itemId: uuid!, $title: String!) {
//                 insert_Element_one(
//                     object: {
//                         conferenceId: $conferenceId
//                         itemId: $itemId
//                         typeName: VIDEO_TITLES
//                         data: []
//                         name: $title
//                     }
//                 ) {
//                     id
//                 }
//             }

//             query GetVideoTitlesElement($itemId: uuid!, $title: String!) {
//                 Element(
//                     where: {
//                         itemId: { _eq: $itemId }
//                         typeName: { _eq: VIDEO_TITLES }
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
//         const existingTitlesElementResult = await apolloClient.query({
//             query: GetVideoTitlesElementDocument,
//             variables: {
//                 itemId: element.itemId,
//                 title: event.name,
//             },
//         });

//         let titleElementId;
//         if (existingTitlesElementResult.data.Element.length > 0) {
//             titleElementId = existingTitlesElementResult.data.Element[0].id;
//         } else {
//             const createTitlesElementResult = await apolloClient.mutate({
//                 mutation: CreateVideoTitlesElementDocument,
//                 variables: {
//                     conferenceId: conferenceId,
//                     itemId: element.itemId,
//                     title: event.name,
//                 },
//             });

//             if (!createTitlesElementResult.data?.insert_Element_one?.id) {
//                 console.error(
//                     "Conference prepare: could not create new content item for titles",
//                     createTitlesElementResult.errors,
//                     conferencePrepareJobId,
//                     event.id
//                 );
//                 throw new Error(`Could not create new titles content item for event (${event.id})`);
//             }
//             titleElementId = createTitlesElementResult.data.insert_Element_one.id;
//         }

//         let broadcastElementId;
//         try {
//             broadcastElementId = await upsertPendingMP4BroadcastElement(
//                 conferencePrepareJobId,
//                 conferenceId,
//                 titleElementId
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
//                 broadcastElementId,
//             },
//         });
//     }
// }

async function createEventVonageSessionsBroadcastItems(conferenceId: string): Promise<void> {
    console.log("Creating broadcast content items for presenter Vonage rooms", conferenceId);
    gql`
        query GetEventsWithoutVonageSession($conferenceId: uuid!) {
            schedule_Event(
                where: { conferenceId: { _eq: $conferenceId }, _and: { _not: { eventVonageSession: {} } } }
            ) {
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

    for (const event of eventsWithoutSessionResult.data.Event) {
        console.log("Creating Vonage session for event", { eventId: event.id });
        try {
            await createEventVonageSession(event.id, conferenceId);
        } catch (e) {
            console.error("Failed to create Vonage session", event.id, e);
            throw new Error(`Failed to create Vonage session: ${e.message}`);
        }
    }

    gql`
        query GetEvents($conferenceId: uuid!) {
            schedule_Event(where: { conferenceId: { _eq: $conferenceId } }) {
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
        mutation CreateVonageBroadcastElement($conferenceId: uuid!, $eventId: uuid!, $input: jsonb!) {
            insert_video_BroadcastElement_one(
                object: { conferenceId: $conferenceId, eventId: $eventId, inputTypeName: VONAGE_SESSION, input: $input }
                on_conflict: {
                    constraint: BroadcastElement_eventId_key
                    update_columns: [conferenceId, input, inputTypeName]
                }
            ) {
                id
            }
        }
    `;

    for (const event of eventsResult.data.schedule_Event) {
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
            mutation: CreateVonageBroadcastElementDocument,
            variables: {
                conferenceId,
                input,
                eventId: event.id,
            },
        });
    }

    console.log("Creating transitions for conference", conferenceId);
    await createTransitions(conferenceId);
}
