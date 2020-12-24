import { gql } from "@apollo/client/core";
import assert from "assert";
import { v4 as uuidv4 } from "uuid";
import { GetContentItemIdForVideoRenderJobDocument, JobStatus_Enum } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as BroadcastContentItem from "../lib/broadcastContentItem";
import * as ConferencePrepareJob from "../lib/conferencePrepareJob";
import { OpenShotClient } from "../lib/openshot/openshot";
import { ExportParameters } from "../lib/openshot/openshotExports";
import * as Transcode from "../lib/transcode";
import * as VideoRenderJob from "../lib/videoRenderJob";
import { Payload, VideoRenderJobData } from "../types/event";

gql`
    query GetContentItemIdForVideoRenderJob($videoRenderJobId: uuid!) {
        VideoRenderJob_by_pk(id: $videoRenderJobId) {
            broadcastContentItem {
                contentItemId
                id
            }
            id
        }
    }
`;

async function cleanupOpenShotProject(openShotProjectId: number) {
    try {
        console.log("Deleting completed OpenShot project", openShotProjectId);
        await OpenShotClient.projects.deleteProject(openShotProjectId);
    } catch (e) {
        console.error("Failed to clean up OpenShot project", openShotProjectId);
    }
}

const defaultExportParameters = {
    video_format: "mp4",
    video_codec: "libx264",
    video_bitrate: 8000000,
    audio_codec: "ac3",
    audio_bitrate: 1920000,
    start_frame: 1,
    end_frame: 0,
};

export async function handleVideoRenderJobUpdated(payload: Payload<VideoRenderJobData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    switch (payload.event.data.new.data.type) {
        case "BroadcastRenderJob": {
            switch (payload.event.data.new.jobStatusName) {
                case JobStatus_Enum.New: {
                    console.log(`New broadcast render job ${payload.event.data.new.id}`);
                    const result = await apolloClient.query({
                        query: GetContentItemIdForVideoRenderJobDocument,
                        variables: {
                            videoRenderJobId: payload.event.data.new.id,
                        },
                    });
                    if (!result.data.VideoRenderJob_by_pk?.broadcastContentItem.contentItemId) {
                        throw new Error(
                            `Could not determine associated content item for broadcast video render job (${payload.event.data.new.id})`
                        );
                    }
                    try {
                        const broadcastTranscodeOutput = await Transcode.startElasticBroadcastTranscode(
                            payload.event.data.new.data.videoS3Url,
                            payload.event.data.new.data.subtitlesS3Url ?? null,
                            payload.event.data.new.id
                        );

                        await VideoRenderJob.startBroadcastVideoRenderJob(
                            payload.event.data.new.id,
                            payload.event.data.new.data,
                            broadcastTranscodeOutput.jobId
                        );
                    } catch (e) {
                        console.error("Failed to start broadcast transcode", e);
                        await VideoRenderJob.failVideoRenderJob(payload.event.data.new.id, e.toString());
                    }
                    break;
                }
                case JobStatus_Enum.Completed: {
                    console.log("Completed broadcast render job", payload.event.data.new.id);
                    if (!payload.event.data.new.data.broadcastContentItemData) {
                        console.error(
                            "Did not find any broadcast content item data in completed video render job",
                            payload.event.data.new.id
                        );
                        await VideoRenderJob.failVideoRenderJob(
                            payload.event.data.new.id,
                            "Completed job did not contain any broadcast content item data."
                        );
                    } else {
                        await BroadcastContentItem.updateMP4BroadcastContentItem(
                            payload.event.data.new.id,
                            payload.event.data.new.data.broadcastContentItemData
                        );
                        await ConferencePrepareJob.updateStatusOfConferencePrepareJob(
                            payload.event.data.new.conferencePrepareJobId
                        );
                    }
                    break;
                }
                case JobStatus_Enum.Failed: {
                    console.log(`Failed broadcast render job ${payload.event.data.new.id}`);
                    await ConferencePrepareJob.failConferencePrepareJob(
                        payload.event.data.new.conferencePrepareJobId,
                        `Render job ${payload.event.data.new.id} failed: ${payload.event.data.new.message}`
                    );
                    break;
                }
                case JobStatus_Enum.InProgress: {
                    console.log(`In progress broadcast render job ${payload.event.data.new.id}`);
                    break;
                }
            }
            return;
        }
        case "TitleRenderJob": {
            switch (payload.event.data.new.jobStatusName) {
                case JobStatus_Enum.New: {
                    console.log(`New title render job ${payload.event.data.new.id}`);
                    try {
                        const exportKey = `${uuidv4()}.mp4`;
                        const webhookKey = uuidv4();
                        assert(
                            process.env.AWS_CONTENT_BUCKET_ID,
                            "AWS_CONTENT_BUCKET_ID environment variable must be defined"
                        );

                        const exportParams: ExportParameters = {
                            ...defaultExportParameters,
                            export_type: "video",
                            json: {
                                bucket: process.env.AWS_CONTENT_BUCKET_ID,
                                url: exportKey,
                                acl: "private",
                                webhookKey,
                            },
                            project: OpenShotClient.projects.toUrl(payload.event.data.new.data.openShotProjectId),
                            webhook: `${process.env.HOST_SECURE_PROTOCOLS ? "https" : "http"}://${
                                process.env.HOST_DOMAIN
                            }/openshot/notifyExport/${payload.event.data.new.id}`,
                        };

                        const exportResult = await OpenShotClient.exports.createExport(exportParams);

                        await VideoRenderJob.startTitlesVideoRenderJob(
                            payload.event.data.new.id,
                            payload.event.data.new.data,
                            exportResult.id,
                            webhookKey
                        );
                    } catch (e) {
                        await VideoRenderJob.failVideoRenderJob(payload.event.data.new.id, e.toString());
                    }
                    break;
                }
                case JobStatus_Enum.Completed: {
                    console.log(`Completed title render job ${payload.event.data.new.id}`);
                    await cleanupOpenShotProject(payload.event.data.new.data.openShotProjectId);

                    if (!payload.event.data.new.data.broadcastContentItemData) {
                        console.error(
                            "Did not find any broadcast content item data in completed video render job",
                            payload.event.data.new.id
                        );
                        await VideoRenderJob.failVideoRenderJob(
                            payload.event.data.new.id,
                            "Completed job did not contain any broadcast content item data."
                        );
                    } else {
                        await BroadcastContentItem.updateMP4BroadcastContentItem(
                            payload.event.data.new.id,
                            payload.event.data.new.data.broadcastContentItemData
                        );
                        await ConferencePrepareJob.updateStatusOfConferencePrepareJob(
                            payload.event.data.new.conferencePrepareJobId
                        );
                    }
                    break;
                }
                case JobStatus_Enum.Failed: {
                    console.log(`Failed title render job ${payload.event.data.new.id}`);
                    await cleanupOpenShotProject(payload.event.data.new.data.openShotProjectId);
                    await ConferencePrepareJob.failConferencePrepareJob(
                        payload.event.data.new.conferencePrepareJobId,
                        `Render job ${payload.event.data.new.id} failed: ${payload.event.data.new.message}`
                    );
                    break;
                }
                case JobStatus_Enum.InProgress: {
                    console.log(`In progress title render job ${payload.event.data.new.id}`);
                    break;
                }
            }
            return;
        }
    }
}
