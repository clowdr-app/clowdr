import { gql } from "@apollo/client/core";
import type { Payload, VideoRenderJobData } from "@midspace/hasura/event";
import type { VideoRenderJobDataBlob } from "@midspace/hasura/videoRenderJob";
import { notEmpty } from "@midspace/shared-types/utils";
import assert from "assert";
import type { P } from "pino";
import { assertType } from "typescript-is";
import type { VideoRenderJobDataFragment } from "../generated/graphql";
import {
    GetElementIdForVideoRenderJobDocument,
    Job_Queues_JobStatus_Enum,
    MarkAndSelectNewVideoRenderJobsDocument,
    SelectNewVideoRenderJobsDocument,
    UnmarkVideoRenderJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as ConferencePrepareJob from "../lib/conferencePrepareJob";
import * as Element from "../lib/element";
import * as Transcode from "../lib/transcode";
import * as VideoRenderJob from "../lib/videoRenderJob";
import { updateVideoRenderJob } from "../lib/videoRenderJob";
import { callWithRetry } from "../utils";

gql`
    query GetElementIdForVideoRenderJob($videoRenderJobId: uuid!) {
        video_VideoRenderJob_by_pk(id: $videoRenderJobId) {
            elementId
            id
        }
    }
`;

export async function handleVideoRenderJobUpdated(
    logger: P.Logger,
    payload: Payload<VideoRenderJobData>
): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");

    switch (payload.event.data.new.data.type) {
        case "BroadcastRenderJob": {
            switch (payload.event.data.new.jobStatusName) {
                case Job_Queues_JobStatus_Enum.New:
                    break;
                case Job_Queues_JobStatus_Enum.Completed: {
                    logger.info({ jobId: payload.event.data.new.id }, "Completed broadcast render job");
                    try {
                        if (!payload.event.data.new.data.broadcastContentItemData) {
                            logger.error(
                                { jobId: payload.event.data.new.id },
                                "Did not find any broadcast content item data in completed video render job"
                            );
                            throw new Error(
                                "Did not find any broadcast content item data in completed video render job"
                            );
                        } else {
                            await Element.addNewBroadcastTranscode(
                                logger,
                                payload.event.data.new.elementId,
                                payload.event.data.new.data.broadcastContentItemData.s3Url,
                                payload.event.data.new.data.broadcastContentItemData.durationSeconds ?? null
                            );
                            await ConferencePrepareJob.updateStatusOfConferencePrepareJob(
                                logger,
                                payload.event.data.new.conferencePrepareJobId
                            );
                        }
                    } catch (e: any) {
                        logger.error(
                            { err: e, jobId: payload.event.data.new.id },
                            "Failure while processing completed render job"
                        );
                        await VideoRenderJob.failVideoRenderJob(
                            payload.event.data.new.id,
                            e?.message ?? "Unknown failure when processing completed render job"
                        );
                    }
                    break;
                }
                case Job_Queues_JobStatus_Enum.Failed: {
                    logger.info({ jobId: payload.event.data.new.id }, "Failed broadcast render job");
                    await ConferencePrepareJob.failConferencePrepareJob(
                        payload.event.data.new.conferencePrepareJobId,
                        `Render job ${payload.event.data.new.id} failed: ${payload.event.data.new.message}`
                    );
                    break;
                }
                case Job_Queues_JobStatus_Enum.InProgress: {
                    logger.info({ jobId: payload.event.data.new.id }, "In progress broadcast render job");
                    break;
                }
            }
            return;
        }
        default:
            logger.warn(
                { type: payload.event.data.new.data.type, jobId: payload.event.data.new.id },
                "Unsupported render job completed"
            );
            return;
    }
}

async function startVideoRenderJob(logger: P.Logger, job: VideoRenderJobDataFragment): Promise<VideoRenderJobDataBlob> {
    const data: VideoRenderJobDataBlob = job.data;
    assertType<VideoRenderJobDataBlob>(data);

    switch (data.type) {
        case "BroadcastRenderJob": {
            logger.info({ jobId: job.id }, "Starting new broadcast render job");
            const result = await (
                await apolloClient
            ).query({
                query: GetElementIdForVideoRenderJobDocument,
                variables: {
                    videoRenderJobId: job.id,
                },
            });
            if (!result.data.video_VideoRenderJob_by_pk?.elementId) {
                throw new Error(`Could not determine associated element for broadcast video render job (${job.id})`);
            }
            const broadcastTranscodeOutput = await Transcode.startElasticBroadcastTranscode(
                logger,
                data.videoS3Url,
                data.subtitlesS3Url ?? null,
                job.id
            );

            data["elasticTranscoderJobId"] = broadcastTranscodeOutput.jobId;
            return data;
        }
        default:
            logger.error({ type: data.type, jobId: job.id }, "Could not start unsupported video render job type");
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

export async function handleProcessVideoRenderJobQueue(logger: P.Logger): Promise<void> {
    logger.info("Processing VideoRenderJob queue");

    const newVideoRenderJobIds = await (
        await apolloClient
    ).query({
        query: SelectNewVideoRenderJobsDocument,
    });

    const jobIdsToMark = newVideoRenderJobIds.data.video_VideoRenderJob.map((x) => x.id);

    if (!jobIdsToMark.length) {
        return;
    }
    const videoRenderJobs = await (
        await apolloClient
    ).mutate({
        mutation: MarkAndSelectNewVideoRenderJobsDocument,
        variables: {
            ids: jobIdsToMark,
        },
    });
    assert(videoRenderJobs.data?.update_video_VideoRenderJob, "Failed to fetch new VideoRenderJobs");

    const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const unsuccessfulVideoRenderJobIds: (string | undefined)[] = await Promise.all(
        videoRenderJobs.data.update_video_VideoRenderJob.returning.map(async (job) => {
            try {
                if (job.retriesCount < 3) {
                    await snooze(Math.floor(Math.random() * 5 * 1000));
                    await callWithRetry(async () => {
                        const data = await startVideoRenderJob(logger, job);
                        await updateVideoRenderJob(job.id, data);
                    });
                }
            } catch (e: any) {
                logger.error({ jobId: job.id, err: e }, "Could not start VideoRenderJob");
                return job.id;
            }
            return undefined;
        })
    );

    const jobIdsToUnmark = unsuccessfulVideoRenderJobIds.filter(notEmpty);

    if (jobIdsToUnmark.length) {
        try {
            logger.info({ jobIdsToUnmark, count: jobIdsToUnmark.length }, "Unmarking unsuccessful video render jobs");
            await callWithRetry(async () => {
                await (
                    await apolloClient
                ).mutate({
                    mutation: UnmarkVideoRenderJobsDocument,
                    variables: {
                        ids: jobIdsToUnmark,
                    },
                });
            });
        } catch (e: any) {
            logger.error({ err: e }, "Could not record failed VideoRenderJobs");
        }
    }
}
