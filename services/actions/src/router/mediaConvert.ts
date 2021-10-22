import type { MediaConvertEvent} from "@clowdr-app/shared-types/build/sns/mediaconvert";
import { TranscodeMode } from "@clowdr-app/shared-types/build/sns/mediaconvert";
import { text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { completeCombineVideosJob, failCombineVideosJob } from "../handlers/combineVideosJob";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";
import { completePreviewTranscode, failPreviewTranscode } from "../lib/transcode";

export const router = express.Router();

// Unprotected routes
router.post("/notify", text(), async (req: Request, res: Response) => {
    console.log(req.originalUrl);

    try {
        const message = await validateSNSNotification(req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== process.env.AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN) {
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

            let event: MediaConvertEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<MediaConvertEvent>(event);
            } catch (err) {
                console.error(`${req.originalUrl}: Unrecognised notification message`, err);
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (
                event.detail.userMetadata.environment &&
                event.detail.userMetadata.environment !== process.env.AWS_PREFIX
            ) {
                console.warn(
                    "Received MediaConvert event for AWS environment that does not match this one",
                    event.detail.userMetadata.environment,
                    process.env.AWS_PREFIX
                );
                res.status(200).json("Environment mismatch");
            }

            if (event.detail.status === "COMPLETE") {
                try {
                    const transcodeS3Url = event.detail.outputGroupDetails[0].outputDetails[0].outputFilePaths[0];

                    switch (event.detail.userMetadata.mode) {
                        case TranscodeMode.BROADCAST:
                            console.error(
                                "Received unexpected broadcast transcode result from MediaConvert. These are currently handled by Elastic Transcoder."
                            );
                            break;
                        case TranscodeMode.PREVIEW:
                            await completePreviewTranscode(
                                event.detail.userMetadata.elementId,
                                transcodeS3Url,
                                event.detail.jobId,
                                new Date(event.detail.timestamp)
                            );
                            break;
                        case TranscodeMode.COMBINE: {
                            const subtitleS3Url = `${event.detail.outputGroupDetails[0].outputDetails[1].outputFilePaths[0]}.srt`;
                            await completeCombineVideosJob(
                                event.detail.userMetadata.combineVideosJobId,
                                transcodeS3Url,
                                subtitleS3Url,
                                event.detail.userMetadata.itemId
                            );
                        }
                    }
                } catch (e) {
                    console.error("Failed to complete transcode", e);
                    res.status(500).json("Failed to complete transcode");
                    return;
                }
            } else if (event.detail.status === "ERROR") {
                try {
                    switch (event.detail.userMetadata.mode) {
                        case TranscodeMode.BROADCAST:
                            console.error(
                                "Received unexpected broadcast transcode result from MediaConvert. These are currently handled by Elastic Transcoder."
                            );
                            break;
                        case TranscodeMode.PREVIEW:
                            await failPreviewTranscode(
                                event.detail.userMetadata.elementId,
                                event.detail.jobId,
                                new Date(event.detail.timestamp),
                                event.detail.errorMessage
                            );
                            break;
                        case TranscodeMode.COMBINE:
                            console.log(
                                "Received MediaConvert notification of failed CombineVideosJob",
                                event.detail.jobId,
                                event.detail.userMetadata.combineVideosJobId
                            );
                            await failCombineVideosJob(
                                event.detail.userMetadata.combineVideosJobId,
                                event.detail.errorMessage
                            );
                    }
                } catch (e) {
                    console.error("Failed to record failed transcode", e);
                    res.status(500).json("Failed to record failed transcode");
                    return;
                }
            }
        }

        res.status(200).json("OK");
    } catch (e) {
        console.error(`${req.originalUrl}: failed to handle request`, e);
        res.status(500).json("Failure");
    }
});
