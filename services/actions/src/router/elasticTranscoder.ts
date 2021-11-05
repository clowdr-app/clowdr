import type { ElasticTranscoderEvent } from "@midspace/shared-types/sns/elasticTranscoder";
import { text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";
import * as VideoRenderJob from "../lib/videoRenderJob";

export const router = express.Router();

// Unprotected routes
router.post("/notify", text(), async (req: Request, res: Response) => {
    req.log.info("Received Elastic Transcoder notification");

    try {
        const message = await validateSNSNotification(req.log, req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== process.env.AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN) {
            req.log.info({ TopicArn: message.TopicArn }, "Received SNS notification for the wrong topic");
            res.status(403).json("Access denied");
            return;
        }

        const subscribed = await tryConfirmSubscription(req.log, message);
        if (subscribed) {
            res.status(200).json("OK");
            return;
        }

        if (message.Type === "Notification") {
            req.log.info({ MessageId: message.MessageId, Message: message.Message }, "Received message");

            let event: ElasticTranscoderEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<ElasticTranscoderEvent>(event);
            } catch (err) {
                req.log.error({ err }, "Unrecognised notification message");
                res.status(500).json("Unrecognised notification message");
                return;
            }

            switch (event.state) {
                case "ERROR": {
                    req.log.info({ jobId: event.jobId }, "Elastic Transcoder job errored");
                    try {
                        await VideoRenderJob.failVideoRenderJob(
                            event.userMetadata.videoRenderJobId,
                            event.messageDetails ?? event.errorCode?.toString() ?? "Unknown reason for failure"
                        );
                    } catch (e: any) {
                        req.log.error(
                            { err: e, jobId: event.jobId },
                            "Failed to record report of broadcast transcode failure"
                        );
                    }
                    break;
                }
                case "COMPLETED": {
                    try {
                        if (event.outputs.length === 1) {
                            req.log.info({ jobId: event.jobId }, "Elastic Transcoder job completed");
                            const s3Url = `s3://${event.userMetadata.bucket}/${event.outputs[0].key}`;
                            await VideoRenderJob.completeVideoRenderJob(
                                req.log,
                                event.userMetadata.videoRenderJobId,
                                s3Url,
                                event.outputs[0].duration
                            );
                        } else {
                            req.log.info({ jobId: event.jobId }, "Elastic Transcoder job finished without outputs");
                            throw new Error("Elastic Transcoder job finished without outputs");
                        }
                    } catch (e: any) {
                        req.log.error(
                            { VideoRenderJobId: event.userMetadata.videoRenderJobId, err: e },
                            "Failed to record completion of broadcast transcode"
                        );
                        await VideoRenderJob.failVideoRenderJob(
                            event.userMetadata.videoRenderJobId,
                            e.message ?? "Failed for unknown reason"
                        );
                    }
                    break;
                }
                case "WARNING": {
                    req.log.info({ jobId: event.jobId }, "Elastic Transcoder job produced warning");
                    const warningText = event.outputs
                        .map((output) => `Output ${output.id}: ${output.statusDetail}`)
                        .join("; ");
                    req.log.warn({ warningText, jobId: event.jobId }, "Received warning from Elastic Transcoder");
                    break;
                }
            }
        }

        res.status(200).json("OK");
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to handle request");
        res.status(500).json("Failure");
    }
});
