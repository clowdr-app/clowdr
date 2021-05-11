import { gql } from "@apollo/client/core";
import { Content_ElementType_Enum, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import {
    CompleteConferencePrepareJobDocument,
    CreateVideoRenderJobDocument,
    GetEventsWithoutVonageSessionDocument,
    GetVideoBroadcastElementsDocument,
    OtherConferencePrepareJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { failConferencePrepareJob } from "../lib/conferencePrepareJob";
import { createEventVonageSession } from "../lib/event";
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

    console.log("Conference prepare: job triggered", {
        conferencePrepareJobId: newRow.id,
        conferenceId: newRow.conferenceId,
    });

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

        const createdJob = await createBroadcastTranscodes(newRow.id, newRow.conferenceId);
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

async function createBroadcastTranscodes(conferencePrepareJobId: string, conferenceId: string): Promise<boolean> {
    const videoBroadcastItems = await apolloClient.query({
        query: GetVideoBroadcastElementsDocument,
        variables: {
            conferenceId,
        },
    });
    console.log("Conference prepare: found video broadcast items", {
        count: videoBroadcastItems.data.content_Element.length,
        conferencePrepareJobId,
    });

    let createdJob = false;

    // Create broadcast transcodes for elements that need one
    for (const element of videoBroadcastItems.data.content_Element) {
        console.log("Conference prepare: preparing video broadcast element", {
            elementId: element.id,
            conferencePrepareJobId,
        });
        const content: ElementDataBlob = element.data;

        if (content.length < 1) {
            console.warn("Conference prepare: no content item versions", {
                elementId: element.id,
                conferencePrepareJobId,
            });
            continue;
        }

        const latestVersion = content[content.length - 1];

        if (latestVersion.data.type !== Content_ElementType_Enum.VideoBroadcast) {
            console.warn("Conference prepare: invalid content item data (not a video broadcast)", {
                elementId: element.id,
                conferencePrepareJobId,
            });
            continue;
        }

        if (latestVersion.data.broadcastTranscode && latestVersion.data.broadcastTranscode.s3Url) {
            console.log("Conference prepare: item already has up-to-date broadcast transcode", {
                elementId: element.id,
                conferencePrepareJobId,
            });
        } else {
            console.log("Conference prepare: item needs broadcast transcode", {
                elementId: element.id,
                conferencePrepareJobId,
            });

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
                    { elementId: element.id, conferencePrepareJobId }
                );
            } else {
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
                        elementId: element.id,
                    },
                });
                createdJob = true;
            }
        }
    }

    return createdJob;
}

gql`
    mutation CreateVideoRenderJob(
        $conferenceId: uuid!
        $conferencePrepareJobId: uuid!
        $elementId: uuid!
        $data: jsonb!
    ) {
        insert_video_VideoRenderJob_one(
            object: {
                conferenceId: $conferenceId
                conferencePrepareJobId: $conferencePrepareJobId
                elementId: $elementId
                data: $data
                jobStatusName: NEW
            }
        ) {
            id
        }
    }
`;

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

    for (const event of eventsWithoutSessionResult.data.schedule_Event) {
        console.log("Creating Vonage session for event", { eventId: event.id });
        try {
            await createEventVonageSession(event.id, conferenceId);
        } catch (e) {
            console.error("Failed to create Vonage session", event.id, e);
            throw new Error(`Failed to create Vonage session: ${e.message}`);
        }
    }
}
