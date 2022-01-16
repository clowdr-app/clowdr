import { tryConfirmSubscription, validateSNSNotification } from "@midspace/component-clients/aws/sns";
import type { MediaConvertEvent } from "@midspace/shared-types/sns/mediaconvert";
import { TranscodeMode } from "@midspace/shared-types/sns/mediaconvert";
import { text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { completeCombineVideosJob, failCombineVideosJob } from "../handlers/combineVideosJob";
import { awsClient, getAWSParameter } from "../lib/aws/awsClient";
import { completePreviewTranscode, failPreviewTranscode } from "../lib/transcode";

export const router = express.Router();

// Unprotected routes
router.post("/notify", text(), async (req: Request, res: Response) => {
    req.log.info("Received MediaConvert notification");

    try {
        const message = await validateSNSNotification(req.log, req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== (await getAWSParameter("TRANSCODE_NOTIFICATIONS_TOPIC_ARN"))) {
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

            let event: MediaConvertEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<MediaConvertEvent>(event);
            } catch (err) {
                req.log.error({ err }, "Unrecognised notification message");
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event.detail.userMetadata.environment && event.detail.userMetadata.environment !== awsClient.prefix) {
                req.log.warn(
                    { environment: event.detail.userMetadata.environment, AWS_PREFIX: awsClient.prefix },
                    "Received MediaConvert event for AWS environment that does not match this one"
                );
                res.status(200).json("Environment mismatch");
            }

            if (event.detail.status === "COMPLETE") {
                try {
                    const transcodeS3Url = event.detail.outputGroupDetails[0].outputDetails[0].outputFilePaths[0];

                    switch (event.detail.userMetadata.mode) {
                        case TranscodeMode.BROADCAST:
                            req.log.error(
                                "Received unexpected broadcast transcode result from MediaConvert. These are currently handled by Elastic Transcoder."
                            );
                            break;
                        case TranscodeMode.PREVIEW:
                            await completePreviewTranscode(
                                req.log,
                                event.detail.userMetadata.elementId,
                                transcodeS3Url,
                                event.detail.jobId,
                                new Date(event.detail.timestamp)
                            );
                            break;
                        case TranscodeMode.COMBINE: {
                            const subtitleS3Url = `${event.detail.outputGroupDetails[0].outputDetails[1].outputFilePaths[0]}.srt`;
                            await completeCombineVideosJob(
                                req.log,
                                event.detail.userMetadata.combineVideosJobId,
                                transcodeS3Url,
                                subtitleS3Url,
                                event.detail.userMetadata.itemId
                            );
                        }
                    }
                } catch (e: any) {
                    req.log.error({ err: e }, "Failed to complete transcode");
                    res.status(500).json("Failed to complete transcode");
                    return;
                }
            } else if (event.detail.status === "ERROR") {
                try {
                    switch (event.detail.userMetadata.mode) {
                        case TranscodeMode.BROADCAST:
                            req.log.error(
                                "Received unexpected broadcast transcode result from MediaConvert. These are currently handled by Elastic Transcoder."
                            );
                            break;
                        case TranscodeMode.PREVIEW:
                            await failPreviewTranscode(
                                req.log,
                                event.detail.userMetadata.elementId,
                                event.detail.jobId,
                                new Date(event.detail.timestamp),
                                event.detail.errorMessage
                            );
                            break;
                        case TranscodeMode.COMBINE:
                            req.log.info(
                                {
                                    jobId: event.detail.jobId,
                                    combineVideosJobId: event.detail.userMetadata.combineVideosJobId,
                                },
                                "Received MediaConvert notification of failed CombineVideosJob"
                            );
                            await failCombineVideosJob(
                                req.log,
                                event.detail.userMetadata.combineVideosJobId,
                                event.detail.errorMessage
                            );
                    }
                } catch (e: any) {
                    req.log.error({ err: e }, "Failed to record failed transcode");
                    res.status(500).json("Failed to record failed transcode");
                    return;
                }
            }
        }

        res.status(200).json("OK");
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to handle request");
        res.status(500).json("Failure");
    }
});
