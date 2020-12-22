import { gql } from "@apollo/client/core";
import {
    CompleteVideoRenderJobDocument,
    CountUnfinishedVideoRenderJobsDocument,
    FailVideoRenderJobDocument,
    GetBroadcastVideoRenderJobDetailsDocument,
    JobStatus_Enum,
    StartVideoRenderJobDocument,
    UpdateMp4BroadcastContentItemDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

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
    mediaConvertJobId: string
): Promise<void> {
    broadcastRenderJobData["mediaConvertJobId"] = mediaConvertJobId;
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
                _and: { jobStatusName: { _nin: [COMPLETED, FAILED] } }
            }
        ) {
            aggregate {
                count
            }
        }
    }
`;

export async function allVideoRenderJobsEnded(conferencePrepareJobId: string): Promise<boolean> {
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
        }
    }
`;

export async function completeBroadcastTranscode(videoRenderJobId: string, transcodeS3Url: string): Promise<void> {
    console.log("Broadcast transcode succeeded", videoRenderJobId);

    try {
        const broadcastRenderJobResult = await apolloClient.query({
            query: GetBroadcastVideoRenderJobDetailsDocument,
            variables: {
                videoRenderJobId,
            },
        });

        if (
            broadcastRenderJobResult.data.VideoRenderJob_by_pk?.conferencePrepareJob.jobStatusName &&
            broadcastRenderJobResult.data.VideoRenderJob_by_pk.conferencePrepareJob.jobStatusName in
                [JobStatus_Enum.InProgress, JobStatus_Enum.New]
        ) {
            if (broadcastRenderJobResult.data.VideoRenderJob_by_pk.broadcastContentItem) {
                console.log("Updating broadcast content item with result of transcode", videoRenderJobId);
                const input: MP4Input = {
                    s3Url: transcodeS3Url,
                    type: "MP4Input",
                };

                await apolloClient.mutate({
                    mutation: UpdateMp4BroadcastContentItemDocument,
                    variables: {
                        broadcastContentItemId:
                            broadcastRenderJobResult.data.VideoRenderJob_by_pk.broadcastContentItem.id,
                        input,
                    },
                });
            } else {
                console.log("No corresponding broadcast content item found for video render job", videoRenderJobId);
            }
        } else {
            console.log("Received broadcast transcode result for expired job", videoRenderJobId);
        }

        console.log("Marking broadcast video rendering job complete", videoRenderJobId);
        await apolloClient.mutate({
            mutation: CompleteVideoRenderJobDocument,
            variables: {
                videoRenderJobId,
            },
        });
    } catch (e) {
        console.error("Failed to record completion of broadcast transcode", videoRenderJobId);
        await failBroadcastTranscode(videoRenderJobId, e.message ?? "Failed for unknown reason");
    }
}

export async function failBroadcastTranscode(videoRenderJobId: string, errorMessage: string): Promise<void> {
    console.log("Broadcast transcode did not succeed", videoRenderJobId);
    await failVideoRenderJob(videoRenderJobId, errorMessage);
}
