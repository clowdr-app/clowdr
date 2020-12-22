import { gql } from "@apollo/client/core";
import { AWSJobStatus, TranscodeDetails } from "@clowdr-app/shared-types/build/content";
import {
    CompleteVideoRenderJobDocument,
    GetBroadcastVideoRenderJobDetailsDocument,
    JobStatus_Enum,
    UpdateMp4BroadcastContentItemDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { addNewContentItemVersion, createNewVersionFromBroadcastTranscode } from "../lib/contentItem";
import { ExportWebhookData } from "../lib/openshot/openshotTypes";
import { failVideoRenderJob } from "../lib/videoRenderJob";

gql`
    mutation CompleteVideoRenderJob($videoRenderJobId: uuid!) {
        update_VideoRenderJob_by_pk(pk_columns: { id: $videoRenderJobId }, _set: { jobStatusName: COMPLETED }) {
            id
            broadcastContentItemId
        }
    }

    query GetVideoRenderJob($videoRenderJobId: uuid!) {
        VideoRenderJob_by_pk(id: $videoRenderJobId) {
            id
            data
        }
    }

    mutation UpdateMP4BroadcastContentItem($broadcastContentItemId: uuid!, $input: jsonb!) {
        update_BroadcastContentItem_by_pk(
            pk_columns: { id: $broadcastContentItemId }
            _set: { input: $input, inputTypeName: MP4 }
        ) {
            id
        }
    }
`;

export async function handleOpenShotExportNotification(
    data: ExportWebhookData,
    videoRenderJobId: string
): Promise<void> {
    console.log("Webhook call from OpenShot", videoRenderJobId);
    try {
        const broadcastRenderJobResult = await apolloClient.query({
            query: GetBroadcastVideoRenderJobDetailsDocument,
            variables: {
                videoRenderJobId,
            },
        });

        // If the export succeeded, update the broadcast content item with its details
        if (data.json.status === "success" && "bucket" in data.json && "url" in data.json) {
            console.log("OpenShot export succeeded", data.json.status, data.json.detail, videoRenderJobId);
            if (
                broadcastRenderJobResult.data.VideoRenderJob_by_pk?.conferencePrepareJob.jobStatusName &&
                broadcastRenderJobResult.data.VideoRenderJob_by_pk.conferencePrepareJob.jobStatusName in
                    [JobStatus_Enum.InProgress, JobStatus_Enum.New]
            ) {
                const s3Url = `s3://${data.json.bucket}/${data.json.url}`;

                // Update broadcast content item
                if (broadcastRenderJobResult.data.VideoRenderJob_by_pk.broadcastContentItem.id) {
                    console.log("Updating broadcast content item with result of title export", videoRenderJobId);
                    const input: MP4Input = {
                        s3Url,
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
                    console.warn(
                        "No corresponding broadcast content item found for video render job",
                        videoRenderJobId
                    );
                }

                // Update content item
                if (broadcastRenderJobResult.data.VideoRenderJob_by_pk.broadcastContentItem.contentItemId) {
                    console.log("Updating content item with result of title export", videoRenderJobId);
                    const contentItemId =
                        broadcastRenderJobResult.data.VideoRenderJob_by_pk.broadcastContentItem.contentItemId;
                    const transcodeDetails: TranscodeDetails = {
                        jobId: videoRenderJobId,
                        status: AWSJobStatus.Completed,
                        updatedTimestamp: new Date().getTime(),
                        s3Url,
                    };
                    const newVersion = await createNewVersionFromBroadcastTranscode(contentItemId, transcodeDetails);
                    await addNewContentItemVersion(contentItemId, newVersion);
                } else {
                    console.warn("No corresponding content item found for video render job", videoRenderJobId);
                }
            } else {
                console.log("Received broadcast transcode result for expired job", videoRenderJobId);
            }

            console.log("Marking title video rendering job complete", videoRenderJobId);
            await apolloClient.mutate({
                mutation: CompleteVideoRenderJobDocument,
                variables: {
                    videoRenderJobId,
                },
            });
        }
        // If the export failed, mark the video render job as failed
        else {
            console.log("OpenShot export did not succeed", data.json.status, data.json.detail, videoRenderJobId);
            await failVideoRenderJob(videoRenderJobId, data.json.detail);
        }
    } catch (e) {
        console.error("Failed to record completion of title video rendering job", videoRenderJobId);
        await failVideoRenderJob(videoRenderJobId, e.message ?? "Failed for unknown reason");
    }
    // todo: write the output back to the content item
}
