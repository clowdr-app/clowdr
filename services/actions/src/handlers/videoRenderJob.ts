import { gql } from "@apollo/client/core";
import assert from "assert";
import { assertType } from "typescript-is";
import {
    GetElementIdForVideoRenderJobDocument,
    MarkAndSelectNewVideoRenderJobsDocument,
    SelectNewVideoRenderJobsDocument,
    UnmarkVideoRenderJobsDocument,
    VideoRenderJobDataFragment,
    Video_JobStatus_Enum,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as ConferencePrepareJob from "../lib/conferencePrepareJob";
import * as Element from "../lib/element";
import * as Transcode from "../lib/transcode";
import * as VideoRenderJob from "../lib/videoRenderJob";
import { updateVideoRenderJob } from "../lib/videoRenderJob";
import { Payload, VideoRenderJobData } from "../types/hasura/event";
import { callWithRetry } from "../utils";

gql`
    query GetElementIdForVideoRenderJob($videoRenderJobId: uuid!) {
        video_VideoRenderJob_by_pk(id: $videoRenderJobId) {
            elementId
            id
        }
    }
`;

export async function handleVideoRenderJobUpdated(payload: Payload<VideoRenderJobData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    switch (payload.event.data.new.data.type) {
        case "BroadcastRenderJob": {
            switch (payload.event.data.new.jobStatusName) {
                case Video_JobStatus_Enum.New:
                    break;
                case Video_JobStatus_Enum.Completed: {
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
                            await Element.addNewBroadcastTranscode(
                                payload.event.data.new.elementId,
                                payload.event.data.new.data.broadcastContentItemData.s3Url,
                                payload.event.data.new.data.broadcastContentItemData.durationSeconds ?? null
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
                case Video_JobStatus_Enum.Failed: {
                    console.log(`Failed broadcast render job ${payload.event.data.new.id}`);
                    await ConferencePrepareJob.failConferencePrepareJob(
                        payload.event.data.new.conferencePrepareJobId,
                        `Render job ${payload.event.data.new.id} failed: ${payload.event.data.new.message}`
                    );
                    break;
                }
                case Video_JobStatus_Enum.InProgress: {
                    console.log(`In progress broadcast render job ${payload.event.data.new.id}`);
                    break;
                }
            }
            return;
        }
        default:
            console.warn("Unsupported render job completed", { type: payload.event.data.new.data.type });
            return;
    }
}

async function startVideoRenderJob(job: VideoRenderJobDataFragment): Promise<VideoRenderJobDataBlob> {
    const data: VideoRenderJobDataBlob = job.data;
    assertType<VideoRenderJobDataBlob>(data);

    switch (data.type) {
        case "BroadcastRenderJob": {
            console.log("Starting new broadcast render job", { jobId: job.id });
            const result = await apolloClient.query({
                query: GetElementIdForVideoRenderJobDocument,
                variables: {
                    videoRenderJobId: job.id,
                },
            });
            if (!result.data.video_VideoRenderJob_by_pk?.elementId) {
                throw new Error(`Could not determine associated element for broadcast video render job (${job.id})`);
            }
            const broadcastTranscodeOutput = await Transcode.startElasticBroadcastTranscode(
                data.videoS3Url,
                data.subtitlesS3Url ?? null,
                job.id
            );

            data["elasticTranscoderJobId"] = broadcastTranscodeOutput.jobId;
            return data;
        }
        default:
            console.error("Could not start unsupported video render job type", { type: data.type });
            throw new Error("Could not start unsupported video render job type");
    }
}

gql`
    query SelectNewVideoRenderJobs {
        video_VideoRenderJob(limit: 10, where: { jobStatusName: { _eq: NEW } }, order_by: { created_at: asc }) {
            id
        }
    }

    mutation MarkAndSelectNewVideoRenderJobs($ids: [uuid!]!) {
        update_video_VideoRenderJob(
            where: { id: { _in: $ids }, jobStatusName: { _eq: NEW } }
            _set: { jobStatusName: IN_PROGRESS }
            _inc: { retriesCount: 1 }
        ) {
            returning {
                ...VideoRenderJobData
            }
        }
    }

    fragment VideoRenderJobData on video_VideoRenderJob {
        id
        jobStatusName
        data
        retriesCount
    }

    mutation UnmarkVideoRenderJobs($ids: [uuid!]!) {
        update_video_VideoRenderJob(where: { id: { _in: $ids } }, _set: { jobStatusName: FAILED }) {
            affected_rows
            returning {
                id
            }
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
            ids: newVideoRenderJobIds.data.video_VideoRenderJob.map((x) => x.id),
        },
    });
    assert(videoRenderJobs.data?.update_video_VideoRenderJob, "Failed to fetch new VideoRenderJobs");

    const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const unsuccessfulVideoRenderJobs: (string | undefined)[] = await Promise.all(
        videoRenderJobs.data.update_video_VideoRenderJob.returning.map(async (job) => {
            try {
                if (job.retriesCount < 3) {
                    await snooze(Math.floor(Math.random() * 5 * 1000));
                    await callWithRetry(async () => {
                        const data = await startVideoRenderJob(job);
                        await updateVideoRenderJob(job.id, data);
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
