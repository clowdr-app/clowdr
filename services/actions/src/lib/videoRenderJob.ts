import { gql } from "@apollo/client/core";
import {
    CompleteVideoRenderJobDocument,
    CountUnfinishedVideoRenderJobsDocument,
    ExpireVideoRenderJobDocument,
    FailVideoRenderJobDocument,
    GetBroadcastVideoRenderJobDetailsDocument,
    UpdateVideoRenderJobDocument,
    Video_JobStatus_Enum,
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
            broadcastElementId
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
    videoRenderJobId: string,
    s3Url: string,
    durationSeconds: number | undefined
): Promise<CompleteVideoRenderJobResult> {
    // Check whether the job is currently in progress
    const broadcastRenderJobResult = await apolloClient.query({
        query: GetBroadcastVideoRenderJobDetailsDocument,
        variables: {
            videoRenderJobId,
        },
    });

    if (!broadcastRenderJobResult.data.video_VideoRenderJob_by_pk) {
        console.warn("Could not complete video render job: video render job not found", videoRenderJobId);
        return {
            status: "CouldNotFindVideoRenderJob",
        };
    }

    const videoRenderJob = broadcastRenderJobResult.data.video_VideoRenderJob_by_pk;

    if (videoRenderJob.conferencePrepareJob.jobStatusName !== Video_JobStatus_Enum.InProgress) {
        console.warn(
            "Could not complete video render job: conference prepare job not in progress",
            videoRenderJobId,
            videoRenderJob.conferencePrepareJob.jobStatusName
        );
        await expireVideoRenderJob(
            videoRenderJobId,
            "Tried to complete job while conference prepare job was in an invalid state."
        );
        return {
            status: "ConferencePrepareJobNotInProgress",
        };
    }

    if (videoRenderJob.jobStatusName !== Video_JobStatus_Enum.InProgress) {
        console.warn(
            "Could not complete video render job: video render job not in progress",
            videoRenderJobId,
            videoRenderJob.jobStatusName
        );
        if (videoRenderJob.jobStatusName === Video_JobStatus_Enum.New) {
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

    await apolloClient.mutate({
        mutation: CompleteVideoRenderJobDocument,
        variables: {
            videoRenderJobId,
            data: { broadcastElementData: mp4BroadcastElementData },
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
    await apolloClient.mutate({
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
    await apolloClient.mutate({
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
    await apolloClient.mutate({
        mutation: UpdateVideoRenderJobDocument,
        variables: {
            videoRenderJobId,
            data,
        },
    });
}

// export async function startTitlesVideoRenderJob(
//     videoRenderJobId: string,
//     titleRenderJobData: TitleRenderJobDataBlob,
//     openShotExportId: number,
//     webhookKey: string
// ): Promise<void> {
//     titleRenderJobData["openShotExportId"] = openShotExportId;
//     titleRenderJobData["webhookKey"] = webhookKey;

//     await apolloClient.mutate({
//         mutation: StartVideoRenderJobDocument,
//         variables: {
//             data: titleRenderJobData,
//             videoRenderJobId,
//         },
//     });
// }

// export async function startBroadcastVideoRenderJob(
//     videoRenderJobId: string,
//     broadcastRenderJobData: BroadcastRenderJobDataBlob,
//     elasticTranscoderJobId: string
// ): Promise<void> {
//     broadcastRenderJobData["elasticTranscoderJobId"] = elasticTranscoderJobId;
//     await apolloClient.mutate({
//         mutation: StartVideoRenderJobDocument,
//         variables: {
//             data: broadcastRenderJobData,
//             videoRenderJobId,
//         },
//     });
// }

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

export async function allVideoRenderJobsCompleted(conferencePrepareJobId: string): Promise<boolean> {
    const result = await apolloClient.query({
        query: CountUnfinishedVideoRenderJobsDocument,
        variables: {
            conferencePrepareJobId,
        },
    });

    if (result.data.video_VideoRenderJob_aggregate.aggregate?.count) {
        console.log(
            `Conference prepare job ${conferencePrepareJobId}: ${result.data.video_VideoRenderJob_aggregate.aggregate.count} jobs remaining`
        );
    }

    return !result.data.video_VideoRenderJob_aggregate.aggregate?.count;
}

gql`
    query GetBroadcastVideoRenderJobDetails($videoRenderJobId: uuid!) {
        video_VideoRenderJob_by_pk(id: $videoRenderJobId) {
            broadcastElement {
                id
                elementId
            }
            id
            conferencePrepareJob {
                id
                jobStatusName
            }
            jobStatusName
        }
    }
`;
