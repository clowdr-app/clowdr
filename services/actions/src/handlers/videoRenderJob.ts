import { gql } from "@apollo/client/core";
import assert from "assert";
import { assertType } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import {
    GetContentItemIdForVideoRenderJobDocument,
    JobStatus_Enum,
    MarkAndSelectNewVideoRenderJobsDocument,
    SelectNewVideoRenderJobsDocument,
    UnmarkVideoRenderJobsDocument,
    VideoRenderJobDataFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as BroadcastContentItem from "../lib/broadcastContentItem";
import * as ConferencePrepareJob from "../lib/conferencePrepareJob";
import { OpenShotClient } from "../lib/openshot/openshot";
import { ExportParameters } from "../lib/openshot/openshotExports";
import * as Transcode from "../lib/transcode";
import * as VideoRenderJob from "../lib/videoRenderJob";
import { updateVideoRenderJob } from "../lib/videoRenderJob";
import { Payload, VideoRenderJobData } from "../types/hasura/event";
import { callWithRetry } from "../utils";

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
                case JobStatus_Enum.New:
                    break;
                case JobStatus_Enum.Completed: {
                    console.log("Completed broadcast render job", payload.event.data.new.id);
                    try {
                        if (!payload.event.data.new.data.broadcastContentItemData) {
                            console.error(
                                "Did not find any broadcast content item data in completed video render job",
                                payload.event.data.new.id
                            );
                            throw new Error(
                                "Did not find any broadcast content item data in completed video render job"
                            );
                        } else {
                            await BroadcastContentItem.updateMP4BroadcastContentItem(
                                payload.event.data.new.broadcastContentItemId,
                                payload.event.data.new.data.broadcastContentItemData
                            );
                            await ConferencePrepareJob.updateStatusOfConferencePrepareJob(
                                payload.event.data.new.conferencePrepareJobId
                            );
                        }
                    } catch (e) {
                        console.error("Failure while processing completed render job", payload.event.data.new.id, e);
                        await VideoRenderJob.failVideoRenderJob(
                            payload.event.data.new.id,
                            e?.message ?? "Unknown failure when processing completed render job"
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
                case JobStatus_Enum.New:
                    break;
                case JobStatus_Enum.Completed: {
                    console.log(`Completed title render job ${payload.event.data.new.id}`);
                    try {
                        await cleanupOpenShotProject(payload.event.data.new.data.openShotProjectId);

                        if (!payload.event.data.new.data.broadcastContentItemData) {
                            console.error(
                                "Did not find any broadcast content item data in completed video render job",
                                payload.event.data.new.id
                            );
                            throw new Error(
                                "Did not find any broadcast content item data in completed video render job"
                            );
                        } else {
                            console.log(
                                "Updating broadcast content item with results of job",
                                payload.event.data.new.id,
                                payload.event.data.new.broadcastContentItemId
                            );
                            await BroadcastContentItem.updateMP4BroadcastContentItem(
                                payload.event.data.new.broadcastContentItemId,
                                payload.event.data.new.data.broadcastContentItemData
                            );
                            console.log(
                                "Updating status of conference prepare job",
                                payload.event.data.new.id,
                                payload.event.data.new.conferencePrepareJobId
                            );
                            await ConferencePrepareJob.updateStatusOfConferencePrepareJob(
                                payload.event.data.new.conferencePrepareJobId
                            );
                        }
                    } catch (e) {
                        console.error("Failure while processing completed render job", payload.event.data.new.id, e);
                        await VideoRenderJob.failVideoRenderJob(
                            payload.event.data.new.id,
                            e?.message ?? "Unknown failure while processing completed render job"
                        );
                    }
                    break;
                }
                case JobStatus_Enum.Failed: {
                    console.log(`Failed title render job ${payload.event.data.new.id}`);
                    try {
                        await cleanupOpenShotProject(payload.event.data.new.data.openShotProjectId);
                    } catch (e) {
                        console.error("Failed to clean up OpenShot project", payload.event.data.new.id, e);
                    }
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

async function startVideoRenderJob(job: VideoRenderJobDataFragment): Promise<VideoRenderJobDataBlob> {
    const data: VideoRenderJobDataBlob = job.data;
    assertType<VideoRenderJobDataBlob>(data);

    switch (data.type) {
        case "BroadcastRenderJob": {
            console.log(`New broadcast render job ${job.id}`);
            const result = await apolloClient.query({
                query: GetContentItemIdForVideoRenderJobDocument,
                variables: {
                    videoRenderJobId: job.id,
                },
            });
            if (!result.data.VideoRenderJob_by_pk?.broadcastContentItem.contentItemId) {
                throw new Error(
                    `Could not determine associated content item for broadcast video render job (${job.id})`
                );
            }
            const broadcastTranscodeOutput = await Transcode.startElasticBroadcastTranscode(
                data.videoS3Url,
                data.subtitlesS3Url ?? null,
                job.id
            );

            data["elasticTranscoderJobId"] = broadcastTranscodeOutput.jobId;
            return data;
        }

        case "TitleRenderJob": {
            console.log(`New title render job ${job.id}`);
            const exportKey = `${uuidv4()}.mp4`;
            const webhookKey = uuidv4();
            assert(process.env.AWS_CONTENT_BUCKET_ID, "AWS_CONTENT_BUCKET_ID environment variable must be defined");

            const exportParams: ExportParameters = {
                ...defaultExportParameters,
                export_type: "video",
                json: {
                    bucket: process.env.AWS_CONTENT_BUCKET_ID,
                    url: exportKey,
                    acl: "private",
                    webhookKey,
                },
                project: OpenShotClient.projects.toUrl(data.openShotProjectId),
                webhook: `${process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http"}://${
                    process.env.HOST_DOMAIN
                }/openshot/notifyExport/${job.id}`,
            };

            const exportResult = await OpenShotClient.exports.createExport(exportParams);

            data["openShotExportId"] = exportResult.id;
            data["webhookKey"] = webhookKey;

            return data;
        }
    }
}

gql`
    query SelectNewVideoRenderJobs {
        VideoRenderJob(limit: 10, where: { jobStatusName: { _eq: NEW } }, order_by: { created_at: asc }) {
            id
        }
    }

    mutation MarkAndSelectNewVideoRenderJobs($ids: [uuid!]!) {
        update_VideoRenderJob(
            where: { id: { _in: $ids }, jobStatusName: { _eq: NEW } }
            _set: { jobStatusName: IN_PROGRESS }
            _inc: { retriesCount: 1 }
        ) {
            returning {
                ...VideoRenderJobData
            }
        }
    }

    fragment VideoRenderJobData on VideoRenderJob {
        id
        jobStatusName
        data
        retriesCount
    }

    mutation UnmarkVideoRenderJobs($ids: [uuid!]!) {
        update_VideoRenderJob(where: { id: { _in: $ids } }, _set: { jobStatusName: FAILED }) {
            affected_rows
        }
    }
`;

export async function handleProcessVideoRenderJobQueue(): Promise<void> {
    console.log("Processing VideoRenderJob queue");

    const newVideoRenderJobIds = await apolloClient.query({
        query: SelectNewVideoRenderJobsDocument,
    });
    const videoRenderJobs = await apolloClient.mutate({
        mutation: MarkAndSelectNewVideoRenderJobsDocument,
        variables: {
            ids: newVideoRenderJobIds.data.VideoRenderJob.map((x) => x.id),
        },
    });
    assert(videoRenderJobs.data?.update_VideoRenderJob, "Failed to fetch new VideoRenderJobs");

    const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const unsuccessfulVideoRenderJobs: (string | undefined)[] = await Promise.all(
        videoRenderJobs.data.update_VideoRenderJob.returning.map(async (job) => {
            try {
                if (job.retriesCount < 3) {
                    await snooze(Math.floor(Math.random() * 5 * 1000));
                    await callWithRetry(async () => {
                        const data = await startVideoRenderJob(job);
                        updateVideoRenderJob(job.id, data);
                    });
                }
            } catch (e) {
                console.error("Could not start VideoRenderJob", job.id, e);
                return job.id;
            }
            return undefined;
        })
    );

    try {
        await callWithRetry(async () => {
            await apolloClient.mutate({
                mutation: UnmarkVideoRenderJobsDocument,
                variables: {
                    ids: unsuccessfulVideoRenderJobs.filter((x) => !!x),
                },
            });
        });
    } catch (e) {
        console.error("Could not record failed VideoRenderJobs", e);
    }
}
