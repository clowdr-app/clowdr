import { gql } from "@apollo/client/core";
import {
    CompleteVideoRenderJobDocument,
    CountUnfinishedVideoRenderJobsDocument,
    ExpireVideoRenderJobDocument,
    FailVideoRenderJobDocument,
    GetBroadcastVideoRenderJobDetailsDocument,
    JobStatus_Enum,
    StartVideoRenderJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    mutation CompleteVideoRenderJob($videoRenderJobId: uuid!, $data: jsonb!) {
        update_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: COMPLETED }
            _append: { data: $data }
        ) {
            id
            broadcastContentItemId
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

    if (!broadcastRenderJobResult.data.VideoRenderJob_by_pk) {
        console.warn("Could not complete video render job: video render job not found", videoRenderJobId);
        return {
            status: "CouldNotFindVideoRenderJob",
        };
    }

    const videoRenderJob = broadcastRenderJobResult.data.VideoRenderJob_by_pk;

    if (videoRenderJob.conferencePrepareJob.jobStatusName !== JobStatus_Enum.InProgress) {
        console.warn(
            "Could not complete video render job: conference prepare job not in progress",
            videoRenderJobId,
            videoRenderJob.conferencePrepareJob.jobStatusName
        );
        return {
            status: "ConferencePrepareJobNotInProgress",
        };
    }

    if (videoRenderJob.jobStatusName !== JobStatus_Enum.InProgress) {
        console.warn(
            "Could not complete video render job: video render job not in progress",
            videoRenderJobId,
            videoRenderJob.jobStatusName
        );
        return {
            status: "VideoRenderJobNotInProgress",
        };
    }

    const mp4BroadcastContentItemData: MP4Input = {
        s3Url,
        type: "MP4Input",
        durationSeconds,
    };

    await apolloClient.mutate({
        mutation: CompleteVideoRenderJobDocument,
        variables: {
            videoRenderJobId,
            data: { broadcastContentItemData: mp4BroadcastContentItemData },
        },
    });

    return {
        status: "Success",
    };
}

gql`
    mutation FailVideoRenderJob($videoRenderJobId: uuid!, $message: String!) {
        update_VideoRenderJob_by_pk(
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
        update_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: EXPIRED, message: $message }
        ) {
            id
        }
    }
`;

export async function ExpireVideoRenderJob(videoRenderJobId: string, message: string): Promise<void> {
    await apolloClient.mutate({
        mutation: ExpireVideoRenderJobDocument,
        variables: {
            message,
            videoRenderJobId,
        },
    });
}

gql`
    mutation StartVideoRenderJob($videoRenderJobId: uuid!, $data: jsonb!) {
        update_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: IN_PROGRESS }
            _append: { data: $data }
        ) {
            id
        }
    }
`;

export async function startTitlesVideoRenderJob(
    videoRenderJobId: string,
    titleRenderJobData: TitleRenderJobDataBlob,
    openShotExportId: number,
    webhookKey: string
): Promise<void> {
    titleRenderJobData["openShotExportId"] = openShotExportId;
    titleRenderJobData["webhookKey"] = webhookKey;

    await apolloClient.mutate({
        mutation: StartVideoRenderJobDocument,
        variables: {
            data: titleRenderJobData,
            videoRenderJobId,
        },
    });
}

export async function startBroadcastVideoRenderJob(
    videoRenderJobId: string,
    broadcastRenderJobData: BroadcastRenderJobDataBlob,
    elasticTranscoderJobId: string
): Promise<void> {
    broadcastRenderJobData["elasticTranscoderJobId"] = elasticTranscoderJobId;
    await apolloClient.mutate({
        mutation: StartVideoRenderJobDocument,
        variables: {
            data: broadcastRenderJobData,
            videoRenderJobId,
        },
    });
}

gql`
    query CountUnfinishedVideoRenderJobs($conferencePrepareJobId: uuid!) {
        VideoRenderJob_aggregate(
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

    return !result.data.VideoRenderJob_aggregate.aggregate?.count;
}

gql`
    query GetBroadcastVideoRenderJobDetails($videoRenderJobId: uuid!) {
        VideoRenderJob_by_pk(id: $videoRenderJobId) {
            broadcastContentItem {
                id
                contentItemId
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
