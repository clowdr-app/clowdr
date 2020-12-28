import { MediaLiveEvent } from "@clowdr-app/shared-types/build/sns/mediaLive";
import parseArn from "@unbounce/parse-aws-arn";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { switchToFillerVideo } from "../lib/channels";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";

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

        if (message.TopicArn !== process.env.AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN) {
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
            //console.log("Received MediaLive message", message.Message);

            /*if ("alert_type" in message.Message && message.Message.alert_type === "Video Not Detected") {
                console.log("Video not detected ");
            }*/

            let event: MediaLiveEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<MediaLiveEvent>(event);
            } catch (err) {
                console.error(`${req.originalUrl}: Unrecognised notification message`, err);
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event["detail-type"] === "MediaLive Channel State Change" && event.detail.state === "RUNNING") {
                const { resourceId } = parseArn(event.detail.channel_arn);

                if (!resourceId) {
                    console.error("Could not parse MediaLive channel resource ID from ARN", event.detail.channel_arn);
                    throw new Error("Could not parse MediaLive channel resource ID from ARN");
                }

                console.log("Switching channel to filler video loop", resourceId);
                await switchToFillerVideo(resourceId);
            }

            // if (event["detail-type"] === "Transcribe Job State Change") {
            //     if (event.detail.TranscriptionJobStatus === "COMPLETED") {
            //         console.log("Transcription job completed");
            //         await completeTranscriptionJob(event.detail.TranscriptionJobName);
            //     } else if (event.detail.TranscriptionJobStatus === "FAILED") {
            //         console.log("Transcription job failed");
            //         await failTranscriptionJob(event.detail.TranscriptionJobName);
            //     }
            // }
        }

        res.status(200).json("OK");
    } catch (e) {
        console.error(`${req.originalUrl}: failed to handle request`, e);
        res.status(500).json("Failure");
    }
});
