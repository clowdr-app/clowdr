import { ElasticTranscoderEvent } from "@clowdr-app/shared-types/build/sns/elasticTranscoder";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";
import * as VideoRenderJob from "../lib/videoRenderJob";

export const router = express.Router();

// Unprotected routes
router.post("/notify", bodyParser.text(), async (req: Request, res: Response) => {
    console.log(req.originalUrl);

    try {
        const message = await validateSNSNotification(req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== process.env.AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN) {
            console.log(`${req.originalUrl}: received SNS notification for the wrong topic`, message.TopicArn);
            res.status(403).json("Access denied");
            return;
        }

        const subscribed = await tryConfirmSubscription(message);
        if (subscribed) {
            res.status(200).json("OK");
            return;
        }

        if (message.Type === "Notification") {
            console.log(`${req.originalUrl}: received message`, message.MessageId, message.Message);

            let event: ElasticTranscoderEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<ElasticTranscoderEvent>(event);
            } catch (err) {
                console.error(`${req.originalUrl}: Unrecognised notification message`, err);
                res.status(500).json("Unrecognised notification message");
                return;
            }

            switch (event.state) {
                case "ERROR": {
                    console.log("Elastic Transcoder job errored", event.jobId);
                    try {
                        await VideoRenderJob.failVideoRenderJob(
                            event.userMetadata.videoRenderJobId,
                            event.messageDetails ?? event.errorCode?.toString() ?? "Unknown reason for failure"
                        );
                    } catch (e) {
                        console.error("Failed to record report of broadcast transcode failure", e, event.jobId);
                    }
                    break;
                }
                case "COMPLETED": {
                    try {
                        if (event.outputs.length === 1) {
                            console.log("Elastic Transcoder job completed", event.jobId);
                            const s3Url = `s3://${event.userMetadata.bucket}/${event.outputs[0].key}`;
                            await VideoRenderJob.completeVideoRenderJob(
                                event.userMetadata.videoRenderJobId,
                                s3Url,
                                undefined
                            );
                        } else {
                            console.log("Elastic Transcoder job finished without outputs", event.jobId);
                            throw new Error("Elastic Transcoder job finished without outputs");
                        }
                    } catch (e) {
                        console.error(
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
                    console.log("Elastic Transcoder job produced warning", event.jobId);
                    const warningText = event.outputs
                        .map((output) => `Output ${output.id}: ${output.statusDetail}`)
                        .join("; ");
                    console.warn("Received warning from Elastic Transcoder", warningText, event.jobId);
                    break;
                }
            }
        }

        res.status(200).json("OK");
    } catch (e) {
        console.error(`${req.originalUrl}: failed to handle request`, e);
        res.status(500).json("Failure");
    }
});
