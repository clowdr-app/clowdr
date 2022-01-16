import { gql } from "@apollo/client/core";
import type { MP4Input } from "@midspace/hasura/broadcastContentItem";
import type { BroadcastRenderJobDataBlob, VideoRenderJobDataBlob } from "@midspace/hasura/videoRenderJob";
import type { P } from "pino";
import {
    CompleteVideoRenderJobDocument,
    CountUnfinishedVideoRenderJobsDocument,
    ExpireVideoRenderJobDocument,
    FailVideoRenderJobDocument,
    GetBroadcastVideoRenderJobDetailsDocument,
    Job_Queues_JobStatus_Enum,
    UpdateVideoRenderJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    mutation CompleteVideoRenderJob($videoRenderJobId: uuid!, $data: jsonb!) {
        update_video_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: COMPLETED }
            _append: { data: $data }
        ) {
            id
            elementId
        }
    }
`;

interface CompleteVideoRenderJobResult {
    status:
        | "Success"
        | "CouldNotFindVideoRenderJob"
        | "VideoRenderJobNotInProgress"
        | "ConferencePrepareJobNotInProgress";
    message?: string;
}

export async function completeVideoRenderJob(
    logger: P.Logger,
    videoRenderJobId: string,
    s3Url: string,
    durationSeconds: number | undefined
): Promise<CompleteVideoRenderJobResult> {
    // Check whether the job is currently in progress
    const broadcastRenderJobResult = await (
        await apolloClient
    ).query({
        query: GetBroadcastVideoRenderJobDetailsDocument,
        variables: {
            videoRenderJobId,
        },
    });

    if (!broadcastRenderJobResult.data.video_VideoRenderJob_by_pk) {
        logger.warn({ videoRenderJobId }, "Could not complete video render job: video render job not found");
        return {
            status: "CouldNotFindVideoRenderJob",
        };
    }

    const videoRenderJob = broadcastRenderJobResult.data.video_VideoRenderJob_by_pk;

    if (videoRenderJob.conferencePrepareJob.jobStatusName !== Job_Queues_JobStatus_Enum.InProgress) {
        logger.warn(
            { videoRenderJobId, jobStatusName: videoRenderJob.conferencePrepareJob.jobStatusName },
            "Could not complete video render job: conference prepare job not in progress"
        );
        await expireVideoRenderJob(
            videoRenderJobId,
            "Tried to complete job while conference prepare job was in an invalid state."
        );
        return {
            status: "ConferencePrepareJobNotInProgress",
        };
    }

    if (videoRenderJob.jobStatusName !== Job_Queues_JobStatus_Enum.InProgress) {
        logger.warn(
            { videoRenderJobId, jobStatusName: videoRenderJob.jobStatusName },
            "Could not complete video render job: video render job not in progress"
        );
        if (videoRenderJob.jobStatusName === Job_Queues_JobStatus_Enum.New) {
            await failVideoRenderJob(videoRenderJobId, "Tried to complete job before it started.");
        }
        return {
            status: "VideoRenderJobNotInProgress",
        };
    }

    const mp4BroadcastElementData: MP4Input = {
        s3Url,
        type: "MP4Input",
        durationSeconds,
    };

    const updatedData: Partial<BroadcastRenderJobDataBlob> = {
        broadcastContentItemData: mp4BroadcastElementData,
    };

    await (
        await apolloClient
    ).mutate({
        mutation: CompleteVideoRenderJobDocument,
        variables: {
            videoRenderJobId,
            data: updatedData,
        },
    });

    return {
        status: "Success",
    };
}

gql`
    mutation FailVideoRenderJob($videoRenderJobId: uuid!, $message: String!) {
        update_video_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: FAILED, message: $message }
        ) {
            id
            conferencePrepareJobId
        }
    }
`;

export async function failVideoRenderJob(videoRenderJobId: string, message: string): Promise<void> {
    await (
        await apolloClient
    ).mutate({
        mutation: FailVideoRenderJobDocument,
        variables: {
            message: message,
            videoRenderJobId,
        },
    });
}

gql`
    mutation ExpireVideoRenderJob($videoRenderJobId: uuid!, $message: String!) {
        update_video_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: EXPIRED, message: $message }
        ) {
            id
        }
    }
`;

export async function expireVideoRenderJob(videoRenderJobId: string, message: string): Promise<void> {
    await (
        await apolloClient
    ).mutate({
        mutation: ExpireVideoRenderJobDocument,
        variables: {
            message,
            videoRenderJobId,
        },
    });
}

gql`
    mutation UpdateVideoRenderJob($videoRenderJobId: uuid!, $data: jsonb!) {
        update_video_VideoRenderJob_by_pk(pk_columns: { id: $videoRenderJobId }, _append: { data: $data }) {
            id
        }
    }
`;

export async function updateVideoRenderJob(videoRenderJobId: string, data: VideoRenderJobDataBlob): Promise<void> {
    await (
        await apolloClient
    ).mutate({
        mutation: UpdateVideoRenderJobDocument,
        variables: {
            videoRenderJobId,
            data,
        },
    });
}

gql`
    query CountUnfinishedVideoRenderJobs($conferencePrepareJobId: uuid!) {
        video_VideoRenderJob_aggregate(
            where: {
                conferencePrepareJobId: { _eq: $conferencePrepareJobId }
                _and: { jobStatusName: { _nin: [COMPLETED] } }
            }
        ) {
            aggregate {
                count
            }
        }
    }
`;

export async function allVideoRenderJobsCompleted(logger: P.Logger, conferencePrepareJobId: string): Promise<boolean> {
    const result = await (
        await apolloClient
    ).query({
        query: CountUnfinishedVideoRenderJobsDocument,
        variables: {
            conferencePrepareJobId,
        },
    });

    if (result.data.video_VideoRenderJob_aggregate.aggregate?.count) {
        logger.info(
            { conferencePrepareJobId, jobsRemaining: result.data.video_VideoRenderJob_aggregate.aggregate.count },
            "Some conference prepare jobs remaining"
        );
    }

    return !result.data.video_VideoRenderJob_aggregate.aggregate?.count;
}

gql`
    query GetBroadcastVideoRenderJobDetails($videoRenderJobId: uuid!) {
        video_VideoRenderJob_by_pk(id: $videoRenderJobId) {
            id
            elementId
            conferencePrepareJob {
                id
                jobStatusName
            }
            jobStatusName
        }
    }
`;
