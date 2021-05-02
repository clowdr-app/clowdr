import { gql } from "@apollo/client/core";
import { ExportWebhookData } from "../lib/openshot/openshotTypes";
import { completeVideoRenderJob, failVideoRenderJob } from "../lib/videoRenderJob";

gql`
    query GetVideoRenderJob($videoRenderJobId: uuid!) {
        video_VideoRenderJob_by_pk(id: $videoRenderJobId) {
            id
            data
        }
    }
`;

export async function handleOpenShotExportNotification(
    data: ExportWebhookData,
    videoRenderJobId: string
): Promise<void> {
    console.log("Webhook call from OpenShot", videoRenderJobId);
    try {
        const s3Url = `s3://${data.json.bucket}/${data.json.url}`;

        // If the export succeeded, update the broadcast content item with its details
        if (data.json.status === "success" && "bucket" in data.json && "url" in data.json) {
            console.log("OpenShot export succeeded", data.json.status, data.json.detail, videoRenderJobId);
            console.log("Attempting to mark title video rendering job complete", videoRenderJobId);
            await completeVideoRenderJob(videoRenderJobId, s3Url, data.end_frame / 30);
        }
        // If the export failed, mark the video render job as failed
        else {
            console.log("OpenShot export did not succeed", data.json.status, data.json.detail, videoRenderJobId);
            throw new Error(data.json.detail);
        }
    } catch (e) {
        console.error("Failed to record completion of title video rendering job", videoRenderJobId, e);
        await failVideoRenderJob(videoRenderJobId, e.message ?? "Failed for unknown reason");
    }
}
