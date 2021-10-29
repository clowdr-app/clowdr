import type { TranscribeEvent } from "@midspace/shared-types/sns/transcribe";
import { text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";
import { completeTranscriptionJob, failTranscriptionJob } from "../lib/transcribe";

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

        if (message.TopicArn !== process.env.AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN) {
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

            let event: TranscribeEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<TranscribeEvent>(event);
            } catch (err) {
                console.error(`${req.originalUrl}: Unrecognised notification message`, err);
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event["detail-type"] === "Transcribe Job State Change") {
                if (event.detail.TranscriptionJobStatus === "COMPLETED") {
                    console.log("Transcription job completed");
                    await completeTranscriptionJob(event.detail.TranscriptionJobName);
                } else if (event.detail.TranscriptionJobStatus === "FAILED") {
                    console.log("Transcription job failed");
                    await failTranscriptionJob(event.detail.TranscriptionJobName);
                }
            }
        }

        res.status(200).json("OK");
    } catch (e: any) {
        console.error(`${req.originalUrl}: failed to handle request`, e);
        res.status(500).json("Failure");
    }
});
