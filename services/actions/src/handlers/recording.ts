import { gql } from "@apollo/client/core";
import { ContentBaseType, ContentItemDataBlob, ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import {
    CreateMediaPackageHarvestJobDocument,
    FailMediaPackageHarvestJobDocument,
    JobStatus_Enum,
    Recording_CompleteMediaPackageHarvestJobDocument,
    Recording_GetEventDocument,
    Recording_GetMediaPackageHarvestJobDocument,
    Recording_IgnoreMediaPackageHarvestJobDocument,
    StartMediaPackageHarvestJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createHarvestJob } from "../lib/aws/mediaPackage";
import { MediaPackageHarvestJob, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";

gql`
    query Recording_GetEvent($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            startTime
            endTime
            room {
                id
                mediaLiveChannel {
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

export async function handleMediaPackageHarvestJobUpdated(payload: Payload<MediaPackageHarvestJob>): Promise<void> {
    assert(payload.event.data.new, "Expected new MediaPackageHarvestJob data");

    const newRow = payload.event.data.new;

    if (newRow.jobStatusName === JobStatus_Enum.New) {
        if (
            !payload.event.data.old ||
            (payload.event.data.old && payload.event.data.old.jobStatusName !== JobStatus_Enum.New)
        ) {
            console.log("Creating new MediaPackage harvest job", newRow.id, newRow.eventId);
            const eventResult = await apolloClient.query({
                query: Recording_GetEventDocument,
                variables: {
                    eventId: newRow.eventId,
                },
            });

            if (!eventResult.data.Event_by_pk) {
                throw new Error("Could not retrieve event associated with MediaPackageHarvestJob");
            }

            if (!eventResult.data.Event_by_pk.room.mediaLiveChannel) {
                throw new Error("Could not retrieve broadcast channel details for the event room");
            }

            const harvestJobId = await createHarvestJob(
                eventResult.data.Event_by_pk.room.mediaLiveChannel.mediaPackageChannelId,
                eventResult.data.Event_by_pk.startTime,
                eventResult.data.Event_by_pk.endTime
            );

            await apolloClient.mutate({
                mutation: StartMediaPackageHarvestJobDocument,
                variables: {
                    id: newRow.id,
                    awsJobId: harvestJobId,
                },
            });
            console.log("Started MediaPackage harvest job", harvestJobId, newRow.eventId);
        }
    }
}

gql`
    mutation CreateMediaPackageHarvestJob($conferenceId: uuid!, $eventId: uuid!) {
        insert_job_queues_MediaPackageHarvestJob_one(
            object: { conferenceId: $conferenceId, eventId: $eventId, jobStatusName: NEW }
        ) {
            id
        }
    }
`;

export async function createMediaPackageHarvestJob(eventId: string, conferenceId: string): Promise<void> {
    console.log("Creating MediaPackage harvest job", eventId);

    await apolloClient.mutate({
        mutation: CreateMediaPackageHarvestJobDocument,
        variables: {
            conferenceId,
            eventId,
        },
    });
}

gql`
    query Recording_GetMediaPackageHarvestJob($mediaPackageHarvestJobId: String!) {
        job_queues_MediaPackageHarvestJob(where: { mediaPackageHarvestJobId: { _eq: $mediaPackageHarvestJobId } }) {
            conferenceId
            event {
                contentGroup {
                    id
                    title
                }
                id
                name
                startTime
            }
            id
        }
    }

    mutation Recording_CompleteMediaPackageHarvestJob(
        $id: uuid!
        $message: String!
        $data: jsonb = ""
        $contentGroupId: uuid = ""
        $conferenceId: uuid = ""
        $name: String = ""
    ) {
        update_job_queues_MediaPackageHarvestJob_by_pk(
            pk_columns: { id: $id }
            _set: { jobStatusName: COMPLETED, message: $message }
        ) {
            id
        }
        insert_ContentItem_one(
            object: {
                data: $data
                contentGroupId: $contentGroupId
                conferenceId: $conferenceId
                contentTypeName: VIDEO_FILE
                name: $name
            }
        ) {
            id
        }
    }
`;

export async function completeMediaPackageHarvestJob(
    awsHarvestJobId: string,
    bucketName: string,
    manifestKey: string
): Promise<void> {
    console.log("AWS harvest job completed", awsHarvestJobId);

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
        console.error(
            "Could not find MediaPackageHarvestJob entry associated with this MediaPackage Harvest Job",
            awsHarvestJobId
        );
        return;
    }

    const job = result.data.job_queues_MediaPackageHarvestJob[0];

    if (!job.event.contentGroup) {
        console.warn("No ContentGroup associated with harvested event, skipping.", awsHarvestJobId, job.event.id);
        await ignoreMediaPackageHarvestJob(job.id, bucketName, manifestKey);
        return;
    }

    const data: ContentItemDataBlob = [
        {
            createdAt: Date.now(),
            createdBy: "system",
            data: {
                baseType: ContentBaseType.Video,
                type: ContentType_Enum.VideoFile,
                s3Url: `s3://${bucketName}/${manifestKey}`,
                subtitles: {},
            },
        },
    ];

    console.log("Completing MediaPackage harvest job", job.event.id, job.id);
    callWithRetry(
        async () =>
            await apolloClient.mutate({
                mutation: Recording_CompleteMediaPackageHarvestJobDocument,
                variables: {
                    id: job.id,
                    message: `Completed successfully. Bucket name: ${bucketName}; manifest key: ${manifestKey}`,
                    conferenceId: job.conferenceId,
                    contentGroupId: job.event.contentGroup?.id,
                    data,
                    name: `Recording: ${job.event.contentGroup?.title} (${job.event.name} ${job.event.startTime})`,
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

export async function ignoreMediaPackageHarvestJob(id: string, bucketName: string, manifestKey: string): Promise<void> {
    console.log("Ignoring result of MediaPackage harvest job", id);
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

export async function failMediaPackageHarvestJob(awsHarvestJobId: string, message: string): Promise<void> {
    console.log("Recording failure of MediaPackage harvest job", awsHarvestJobId, message);
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
