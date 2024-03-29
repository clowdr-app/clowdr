import { gql } from "@apollo/client/core";
import type { EventPayload } from "@midspace/hasura/event";
import type { MediaPackageHarvestJob } from "@midspace/hasura/event-data";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum, ElementBaseType } from "@midspace/shared-types/content";
import type { SourceBlob } from "@midspace/shared-types/content/element";
import { SourceType } from "@midspace/shared-types/content/element";
import assert from "assert";
import { formatRFC7231 } from "date-fns";
import type { P } from "pino";
import {
    CreateMediaPackageHarvestJobDocument,
    FailMediaPackageHarvestJobDocument,
    Job_Queues_JobStatus_Enum,
    Recording_CompleteMediaPackageHarvestJobDocument,
    Recording_GetEventDocument,
    Recording_GetMediaPackageHarvestJobDocument,
    Recording_IgnoreMediaPackageHarvestJobDocument,
    StartMediaPackageHarvestJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createHarvestJob } from "../lib/aws/mediaPackage";
import { callWithRetry } from "../utils";

gql`
    query Recording_GetEvent($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            scheduledStartTime
            scheduledEndTime
            room {
                id
                channelStack {
                    id
                    mediaPackageChannelId
                }
            }
        }
    }

    mutation StartMediaPackageHarvestJob($awsJobId: String!, $id: uuid!) {
        update_job_queues_MediaPackageHarvestJob_by_pk(
            pk_columns: { id: $id }
            _set: { mediaPackageHarvestJobId: $awsJobId, jobStatusName: IN_PROGRESS }
        ) {
            id
        }
    }
`;

export async function handleMediaPackageHarvestJobUpdated(
    logger: P.Logger,
    payload: EventPayload<MediaPackageHarvestJob>
): Promise<void> {
    assert(payload.event.data.new, "Expected new MediaPackageHarvestJob data");

    const newRow = payload.event.data.new;

    if (newRow.jobStatusName === Job_Queues_JobStatus_Enum.New) {
        if (
            !payload.event.data.old ||
            (payload.event.data.old && payload.event.data.old.jobStatusName !== Job_Queues_JobStatus_Enum.New)
        ) {
            logger.info({ jobId: newRow.id, eventId: newRow.eventId }, "Creating new MediaPackage harvest job");
            const eventResult = await apolloClient.query({
                query: Recording_GetEventDocument,
                variables: {
                    eventId: newRow.eventId,
                },
            });

            if (!eventResult.data.schedule_Event_by_pk) {
                throw new Error("Could not retrieve event associated with MediaPackageHarvestJob");
            }

            if (!eventResult.data.schedule_Event_by_pk.room.channelStack) {
                throw new Error("Could not retrieve broadcast channel details for the event room");
            }

            const harvestJobId = await createHarvestJob(
                eventResult.data.schedule_Event_by_pk.room.channelStack.mediaPackageChannelId,
                eventResult.data.schedule_Event_by_pk.scheduledStartTime,
                eventResult.data.schedule_Event_by_pk.scheduledEndTime
            );

            await apolloClient.mutate({
                mutation: StartMediaPackageHarvestJobDocument,
                variables: {
                    id: newRow.id,
                    awsJobId: harvestJobId,
                },
            });
            logger.info(
                { harvestJobId, eventId: newRow.eventId },
                "Started MediaPackage harvest job",
                harvestJobId,
                newRow.eventId
            );
        }
    }
}

gql`
    mutation CreateMediaPackageHarvestJob($conferenceId: uuid!, $subconferenceId: uuid, $eventId: uuid!) {
        insert_job_queues_MediaPackageHarvestJob_one(
            object: {
                conferenceId: $conferenceId
                subconferenceId: $subconferenceId
                eventId: $eventId
                jobStatusName: NEW
            }
        ) {
            id
        }
    }
`;

export async function createMediaPackageHarvestJob(
    logger: P.Logger,
    eventId: string,
    conferenceId: string,
    subconferenceId: string | null | undefined
): Promise<void> {
    logger.info({ eventId }, "Creating MediaPackage harvest job");

    await apolloClient.mutate({
        mutation: CreateMediaPackageHarvestJobDocument,
        variables: {
            conferenceId,
            subconferenceId,
            eventId,
        },
    });
}

gql`
    query Recording_GetMediaPackageHarvestJob($mediaPackageHarvestJobId: String!) {
        job_queues_MediaPackageHarvestJob(where: { mediaPackageHarvestJobId: { _eq: $mediaPackageHarvestJobId } }) {
            conferenceId
            event {
                item {
                    id
                    title
                    subconferenceId
                }
                id
                name
                scheduledStartTime
                scheduledEndTime
            }
            id
        }
    }

    mutation Recording_CompleteMediaPackageHarvestJob(
        $id: uuid!
        $message: String!
        $data: jsonb!
        $source: jsonb = null
        $itemId: uuid!
        $conferenceId: uuid!
        $subconferenceId: uuid = null
        $name: String!
    ) {
        update_job_queues_MediaPackageHarvestJob_by_pk(
            pk_columns: { id: $id }
            _set: { jobStatusName: COMPLETED, message: $message }
        ) {
            id
        }
        insert_content_Element_one(
            object: {
                data: $data
                itemId: $itemId
                conferenceId: $conferenceId
                subconferenceId: $subconferenceId
                typeName: VIDEO_FILE
                name: $name
                source: $source
            }
        ) {
            id
        }
    }
`;

export async function completeMediaPackageHarvestJob(
    logger: P.Logger,
    awsHarvestJobId: string,
    bucketName: string,
    manifestKey: string
): Promise<void> {
    logger.info({ awsHarvestJobId }, "AWS harvest job completed");

    const result = await callWithRetry(
        async () =>
            await apolloClient.query({
                query: Recording_GetMediaPackageHarvestJobDocument,
                variables: {
                    mediaPackageHarvestJobId: awsHarvestJobId,
                },
            })
    );

    if (!result.data.job_queues_MediaPackageHarvestJob.length) {
        logger.error(
            {
                awsHarvestJobId,
            },
            "Could not find MediaPackageHarvestJob entry associated with this MediaPackage Harvest Job"
        );
        return;
    }

    const job = result.data.job_queues_MediaPackageHarvestJob[0];

    if (!job.event.item) {
        logger.warn(
            { awsHarvestJobId, eventId: job.event.id },
            "No ContentGroup associated with harvested event, skipping."
        );
        await ignoreMediaPackageHarvestJob(logger, job.id, bucketName, manifestKey);
        return;
    }

    const data: ElementDataBlob = [
        {
            createdAt: Date.now(),
            createdBy: "system",
            data: {
                baseType: ElementBaseType.Video,
                type: Content_ElementType_Enum.VideoFile,
                s3Url: `s3://${bucketName}/${manifestKey}`,
                subtitles: {},
            },
        },
    ];

    const source: SourceBlob = {
        source: SourceType.EventRecording,
        eventId: job.event.id,
        startTimeMillis: Date.parse(job.event.scheduledStartTime),
        durationSeconds: Math.round(
            (Date.parse(job.event.scheduledEndTime) - Date.parse(job.event.scheduledStartTime)) / 1000
        ),
    };

    logger.info({ eventId: job.event.id, jobId: job.id }, "Completing MediaPackage harvest job");
    const scheduledStartTime = formatRFC7231(Date.parse(job.event.scheduledStartTime));
    await callWithRetry(
        async () =>
            await apolloClient.mutate({
                mutation: Recording_CompleteMediaPackageHarvestJobDocument,
                variables: {
                    id: job.id,
                    message: `Completed successfully. Bucket name: ${bucketName}; manifest key: ${manifestKey}`,
                    conferenceId: job.conferenceId,
                    subconferenceId: job.event.item?.subconferenceId ?? null,
                    itemId: job.event.item?.id,
                    data,
                    source,
                    name: `Recording of ${job.event.name} from ${scheduledStartTime}`,
                },
            })
    );
}

gql`
    mutation Recording_IgnoreMediaPackageHarvestJob($id: uuid!, $message: String!) {
        update_job_queues_MediaPackageHarvestJob_by_pk(
            pk_columns: { id: $id }
            _set: { jobStatusName: COMPLETED, message: $message }
        ) {
            id
        }
    }
`;

export async function ignoreMediaPackageHarvestJob(
    logger: P.Logger,
    id: string,
    bucketName: string,
    manifestKey: string
): Promise<void> {
    logger.info({ jobId: id }, "Ignoring result of MediaPackage harvest job");
    await callWithRetry(
        async () =>
            await apolloClient.mutate({
                mutation: Recording_IgnoreMediaPackageHarvestJobDocument,
                variables: {
                    id,
                    message: `No content group associated with event. Manifest bucket: ${bucketName}; manifest key: ${manifestKey}`,
                },
            })
    );
}

gql`
    mutation FailMediaPackageHarvestJob($awsJobId: String!, $message: String!) {
        update_job_queues_MediaPackageHarvestJob(
            _set: { message: $message, jobStatusName: FAILED }
            where: { mediaPackageHarvestJobId: { _eq: $awsJobId } }
        ) {
            affected_rows
        }
    }
`;

export async function failMediaPackageHarvestJob(
    logger: P.Logger,
    awsHarvestJobId: string,
    message: string
): Promise<void> {
    logger.info({ awsHarvestJobId, message }, "Recording failure of MediaPackage harvest job");
    await callWithRetry(
        async () =>
            await apolloClient.mutate({
                mutation: FailMediaPackageHarvestJobDocument,
                variables: {
                    awsJobId: awsHarvestJobId,
                    message,
                },
            })
    );
}
