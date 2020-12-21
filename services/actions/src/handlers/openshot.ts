import { gql } from "@apollo/client/core";
import { CompleteVideoRenderJobDocument, UpdateMp4BroadcastContentItemDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
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
    // If the export succeeded, update the broadcast content item with its details
    if (data.json.status === "success" && "bucket" in data.json && "url" in data.json) {
        console.log("OpenShot export succeeded", data.json.status, data.json.detail, videoRenderJobId);

        console.log("Marking title video rendering job complete", videoRenderJobId);
        const videoRenderJobResult = await apolloClient.mutate({
            mutation: CompleteVideoRenderJobDocument,
            variables: {
                videoRenderJobId,
            },
        });

        // Update broadcast content item
        if (videoRenderJobResult.data?.update_VideoRenderJob_by_pk?.broadcastContentItemId) {
            console.log("Updating broadcast content item with result of title export", videoRenderJobId);
            const input: MP4Input = {
                s3Url: `s3://${data.json.bucket}/${data.json.url}`,
                type: "MP4Input",
            };

            await apolloClient.mutate({
                mutation: UpdateMp4BroadcastContentItemDocument,
                variables: {
                    broadcastContentItemId:
                        videoRenderJobResult.data?.update_VideoRenderJob_by_pk.broadcastContentItemId,
                    input,
                },
            });
        } else {
            console.log("No corresponding broadcast content item found for video render job", videoRenderJobId);
        }
    }
    // If the export failed, mark the video render job as failed
    else {
        console.log("OpenShot export did not succeed", data.json.status, data.json.detail, videoRenderJobId);
        await failVideoRenderJob(videoRenderJobId, data.json.detail);

        // todo: fail the conference prepare job
    }

    // todo: if all video render jobs for the conference prepare job are completed, mark it completed

    // todo: write the output back to the content item
}
