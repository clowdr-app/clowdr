import { gql } from "@apollo/client/core";
import type { ConferencePrepareJobData, Payload } from "@midspace/hasura/event";
import type { BroadcastRenderJobDataBlob } from "@midspace/hasura/videoRenderJob";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum } from "@midspace/shared-types/content";
import assert from "assert";
import type { P } from "pino";
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
import { callWithRetry } from "../utils";

gql`
    query OtherConferencePrepareJobs($conferenceId: uuid!, $conferencePrepareJobId: uuid!) {
        job_queues_PrepareJob(
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

export async function handleConferencePrepareJobInserted(
    logger: P.Logger,
    payload: Payload<ConferencePrepareJobData>
): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    const newRow = payload.event.data.new;

    logger.info(
        {
            conferencePrepareJobId: newRow.id,
            conferenceId: newRow.conferenceId,
        },
        "Conference prepare: job triggered"
    );

    try {
        // get list of other in-progress jobs. If any are in progress, set this new one to failed and return.
        const otherJobs = await apolloClient.query({
            query: OtherConferencePrepareJobsDocument,
            variables: {
                conferenceId: newRow.conferenceId,
                conferencePrepareJobId: newRow.id,
            },
        });

        if (otherJobs.data.job_queues_PrepareJob.length > 0) {
            logger.info(
                { otherJobId: otherJobs.data.job_queues_PrepareJob[0].id, jobId: newRow.id },
                "Conference prepare: another job in progress, aborting."
            );
            throw new Error(
                `Another conference prepare job (${otherJobs.data.job_queues_PrepareJob[0].id}) is already in progress`
            );
        }

        const createdJob = await createBroadcastTranscodes(logger, newRow.id, newRow.conferenceId);
        await createEventVonageSessionsBroadcastItems(logger, newRow.conferenceId);

        logger.info({ jobId: newRow.id }, "Conference prepare: finished initialising job");

        if (!createdJob) {
            await callWithRetry(async () => {
                await apolloClient.mutate({
                    mutation: CompleteConferencePrepareJobDocument,
                    variables: {
                        id: newRow.id,
                    },
                });
            });
            logger.info(
                { jobId: newRow.id },
                "Conference prepare: job completed without needing to render broadcast items"
            );
        }
    } catch (e: any) {
        logger.error({ err: e }, "Conference prepare: fatal error while initialising job");
        await callWithRetry(async () => {
            await failConferencePrepareJob(newRow.id, e.message ?? "Unknown error while initialising job");
        });
    }
}

async function createBroadcastTranscodes(
    logger: P.Logger,
    conferencePrepareJobId: string,
    conferenceId: string
): Promise<boolean> {
    const videoBroadcastItems = await apolloClient.query({
        query: GetVideoBroadcastElementsDocument,
        variables: {
            conferenceId,
        },
    });
    logger.info(
        {
            count: videoBroadcastItems.data.content_Element.length,
            conferencePrepareJobId,
        },
        "Conference prepare: found video broadcast items"
    );

    let createdJob = false;

    // Create broadcast transcodes for elements that need one
    for (const element of videoBroadcastItems.data.content_Element) {
        logger.info(
            {
                elementId: element.id,
                conferencePrepareJobId,
            },
            "Conference prepare: preparing video broadcast element"
        );
        const content: ElementDataBlob = element.data;

        if (content.length < 1) {
            logger.warn(
                {
                    elementId: element.id,
                    conferencePrepareJobId,
                },
                "Conference prepare: no content item versions"
            );
            continue;
        }

        const latestVersion = content[content.length - 1];

        if (latestVersion.data.type !== Content_ElementType_Enum.VideoBroadcast) {
            logger.warn(
                {
                    elementId: element.id,
                    conferencePrepareJobId,
                },
                "Conference prepare: invalid content item data (not a video broadcast)"
            );
            continue;
        }

        if (
            latestVersion.data.broadcastTranscode &&
            latestVersion.data.broadcastTranscode.s3Url &&
            latestVersion.data.broadcastTranscode.durationSeconds
        ) {
            logger.info(
                {
                    elementId: element.id,
                    conferencePrepareJobId,
                },
                "Conference prepare: item already has up-to-date broadcast transcode"
            );
        } else {
            logger.info(
                {
                    elementId: element.id,
                    conferencePrepareJobId,
                },
                "Conference prepare: item needs broadcast transcode"
            );

            if (
                !latestVersion.data ||
                !latestVersion.data.s3Url ||
                latestVersion.data.s3Url === "" ||
                !latestVersion.data.subtitles ||
                !latestVersion.data.subtitles["en_US"] ||
                !latestVersion.data.subtitles["en_US"].s3Url
            ) {
                logger.info(
                    { elementId: element.id, conferencePrepareJobId },
                    "Conference prepare: Skipping item because it is missing one or more pieces of information needed to prepare it"
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

async function createEventVonageSessionsBroadcastItems(logger: P.Logger, conferenceId: string): Promise<void> {
    logger.info({ conferenceId }, "Creating broadcast content items for presenter Vonage rooms");
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
        logger.info({ eventId: event.id }, "Creating Vonage session for event");
        try {
            await createEventVonageSession(logger, event.id, conferenceId);
        } catch (e: any) {
            logger.error({ eventId: event.id, err: e }, "Failed to create Vonage session");
            throw new Error(`Failed to create Vonage session: ${e.message}`);
        }
    }
}
