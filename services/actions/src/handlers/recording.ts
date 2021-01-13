import { gql } from "@apollo/client/core";
import assert from "assert";
import {
    CreateMediaPackageHarvestJobDocument,
    FailMediaPackageHarvestJobDocument,
    JobStatus_Enum,
    Recording_GetEventDocument,
    StartMediaPackageHarvestJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createHarvestJob } from "../lib/aws/mediaPackage";
import { MediaPackageHarvestJob, Payload } from "../types/hasura/event";

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

export async function completeMediaPackageHarvestJob(awsHarvestJobId: string): Promise<void> {
    console.log("AWS harvest job completed", awsHarvestJobId);

    // todo: save output to table
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
    await apolloClient.mutate({
        mutation: FailMediaPackageHarvestJobDocument,
        variables: {
            awsJobId: awsHarvestJobId,
            message,
        },
    });
}
