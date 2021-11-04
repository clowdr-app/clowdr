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
    req.log.info(req.originalUrl);

    try {
        const message = await validateSNSNotification(req.log, req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== process.env.AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN) {
            req.log.info(`${req.originalUrl}: received SNS notification for the wrong topic`, message.TopicArn);
            res.status(403).json("Access denied");
            return;
        }

        const subscribed = await tryConfirmSubscription(req.log, message);
        if (subscribed) {
            res.status(200).json("OK");
            return;
        }

        if (message.Type === "Notification") {
            req.log.info(`${req.originalUrl}: received message`, message.MessageId, message.Message);

            let event: ElasticTranscoderEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<ElasticTranscoderEvent>(event);
            } catch (err) {
                req.log.error(`${req.originalUrl}: Unrecognised notification message`, err);
                res.status(500).json("Unrecognised notification message");
                return;
            }

            switch (event.state) {
                case "ERROR": {
                    req.log.info("Elastic Transcoder job errored", { jobId: event.jobId });
                    try {
                        await VideoRenderJob.failVideoRenderJob(
                            event.userMetadata.videoRenderJobId,
                            event.messageDetails ?? event.errorCode?.toString() ?? "Unknown reason for failure"
                        );
                    } catch (e: any) {
                        req.log.error("Failed to record report of broadcast transcode failure", e, event.jobId);
                    }
                    break;
                }
                case "COMPLETED": {
                    try {
                        if (event.outputs.length === 1) {
                            req.log.info("Elastic Transcoder job completed", event.jobId);
                            const s3Url = `s3://${event.userMetadata.bucket}/${event.outputs[0].key}`;
                            await VideoRenderJob.completeVideoRenderJob(
                                req.log,
                                event.userMetadata.videoRenderJobId,
                                s3Url,
                                event.outputs[0].duration
                            );
                        } else {
                            req.log.info("Elastic Transcoder job finished without outputs", event.jobId);
                            throw new Error("Elastic Transcoder job finished without outputs");
                        }
                    } catch (e: any) {
                        req.log.error(
                            "Failed to record completion of broadcast transcode",
                            event.userMetadata.videoRenderJobId,
                            e
                        );
                        await VideoRenderJob.failVideoRenderJob(
                            event.userMetadata.videoRenderJobId,
                            e.message ?? "Failed for unknown reason"
                        );
                    }
                    break;
                }
                case "WARNING": {
                    req.log.info("Elastic Transcoder job produced warning", event.jobId);
                    const warningText = event.outputs
                        .map((output) => `Output ${output.id}: ${output.statusDetail}`)
                        .join("; ");
                    req.log.warn("Received warning from Elastic Transcoder", warningText, event.jobId);
                    break;
                }
            }
        }

        res.status(200).json("OK");
    } catch (e: any) {
        req.log.error(`${req.originalUrl}: failed to handle request`, e);
        res.status(500).json("Failure");
    }
});
