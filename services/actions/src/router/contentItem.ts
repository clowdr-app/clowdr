import { SNSNotification } from "@clowdr-app/shared-types/types/sns";
import { MediaConvertEvent } from "@clowdr-app/shared-types/types/sns/mediaconvert";
import { TranscribeEvent } from "@clowdr-app/shared-types/types/sns/transcribe";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import fetch from "node-fetch";
import MessageValidator from "sns-validator";
import { assertType, is } from "typescript-is";
import { promisify } from "util";
import {
    handleContentItemUpdated,
    handleGetByRequiredItem,
} from "../handlers/content";
import {
    handleContentItemSubmitted,
    handleUpdateSubtitles,
} from "../handlers/upload";
import { completeTranscode, failTranscode } from "../lib/transcode";
import { completeTranscriptionJob } from "../lib/transcribe";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { ContentItemData, Payload } from "../types/event";

export const router = express.Router();

// Unprotected routes

async function validateSNSNotification(
    body: any
): Promise<Maybe<SNSNotification<any>>> {
    const validator = new MessageValidator();
    const validate = promisify(validator.validate.bind(validator));

    let message;
    try {
        message = JSON.parse(body);
        await validate(message);
        assertType<SNSNotification<any>>(message);
    } catch (e) {
        console.log("Received invalid SNS notification", e, body);
        return null;
    }

    return message;
}

async function confirmSubscription(url: string): Promise<boolean> {
    try {
        await fetch(url, {
            method: "get",
        });
        console.log("Confirmed subscription");
        return true;
    } catch (e) {
        console.error("Failed to confirm subscription", e);
        return false;
    }
}

router.post(
    "/notifyTranscode",
    bodyParser.text(),
    async (req: Request, res: Response) => {
        console.log(req.originalUrl);

        const message = await validateSNSNotification(req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (
            message.TopicArn !==
            process.env.AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN
        ) {
            console.log(
                `${req.originalUrl}: received SNS notification for the wrong topic`,
                message.TopicArn
            );
            res.status(403).json("Access denied");
            return;
        }

        if (message.Type === "SubscriptionConfirmation") {
            if (!(await confirmSubscription(message.SubscribeURL))) {
                res.status(500).json("Failure");
                return;
            }
        } else if (message.Type === "Notification") {
            console.log(
                `${req.originalUrl}: received message`,
                message.MessageId,
                message.Message
            );

            let event: MediaConvertEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<MediaConvertEvent>(event);
            } catch (err) {
                console.error(
                    `${req.originalUrl}: Unrecognised notification message`,
                    err
                );
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event.detail.status === "COMPLETE") {
                try {
                    const transcodeS3Url =
                        event.detail.outputGroupDetails[0].outputDetails[0]
                            .outputFilePaths[0];

                    await completeTranscode(
                        event.detail.userMetadata.contentItemId,
                        transcodeS3Url,
                        event.detail.jobId,
                        new Date(event.detail.timestamp)
                    );
                } catch (e) {
                    console.error("Failed to complete transcode", e);
                    res.status(500).json("Failed to complete transcode");
                    return;
                }
            } else if (event.detail.status === "ERROR") {
                try {
                    await failTranscode(
                        event.detail.userMetadata.contentItemId,
                        event.detail.jobId,
                        new Date(event.detail.timestamp),
                        event.detail.errorMessage
                    );
                } catch (e) {
                    console.error("Failed to record failed transcode", e);
                    res.status(500).json("Failed to record failed transcode");
                    return;
                }
            }
        }

        res.status(200).json("OK");
    }
);

router.post(
    "/notifyTranscribe",
    bodyParser.text(),
    async (req: Request, res: Response) => {
        console.log(req.originalUrl);

        const message = await validateSNSNotification(req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (
            message.TopicArn !==
            process.env.AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN
        ) {
            console.log(
                `${req.originalUrl}: received SNS notification for the wrong topic`,
                message.TopicArn
            );
            res.status(403).json("Access denied");
            return;
        }

        if (message.Type === "SubscriptionConfirmation") {
            if (!(await confirmSubscription(message.SubscribeURL))) {
                res.status(500).json("Failure");
                return;
            }
        } else if (message.Type === "Notification") {
            console.log(
                `${req.originalUrl}: received message`,
                message.MessageId,
                message.Message
            );

            let event: TranscribeEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<TranscribeEvent>(event);
            } catch (err) {
                console.error(
                    `${req.originalUrl}: Unrecognised notification message`,
                    err
                );
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event["detail-type"] === "Transcribe Job State Change") {
                if (event.detail.TranscriptionJobStatus === "COMPLETED") {
                    console.log("Transcription job completed");
                    await completeTranscriptionJob(
                        event.detail.TranscriptionJobName
                    );
                } else if (event.detail.TranscriptionJobStatus === "FAILED") {
                    console.log("Transcription job failed");
                    //todo
                }
            }
        }

        res.status(200).json("OK");
    }
);

// Protected routes

router.use(checkEventSecret);

router.post(
    "/updated",
    bodyParser.json(),
    async (req: Request, res: Response) => {
        try {
            assertType<Payload<ContentItemData>>(req.body);
        } catch (e) {
            console.error("Received incorrect payload", e);
            res.status(500).json("Unexpected payload");
            return;
        }
        try {
            await handleContentItemUpdated(req.body);
        } catch (e) {
            console.error("Failure while handling contentItem updated", e);
            res.status(500).json("Failure while handling event");
            return;
        }
        res.status(200).json("OK");
    }
);

router.post(
    "/submit",
    bodyParser.json(),
    async (req: Request, res: Response) => {
        const params = req.body.input;
        if (is<submitContentItemArgs>(params)) {
            console.log(`${req.path}: Item upload requested`);
            const result = await handleContentItemSubmitted(params);
            return res.status(200).json(result);
        } else {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(200).json({
                success: false,
                message: "Invalid request",
            });
        }
    }
);

router.post(
    "/updateSubtitles",
    bodyParser.json(),
    async (req: Request, res: Response) => {
        try {
            const params = req.body.input;
            assertType<updateSubtitlesArgs>(params);
            const result = await handleUpdateSubtitles(params);
            return res.status(200).json(result);
        } catch (e) {
            console.error(`${req.originalUrl}: invalid request:`, req.body);
            return res.status(200).json({
                success: false,
                message: "Invalid request",
            });
        }
    }
);

router.post(
    "/getByRequiredItem",
    bodyParser.json(),
    async (
        req: Request,
        res: Response<Array<GetContentItemOutput> | string>
    ) => {
        const params = req.body.input;
        try {
            assertType<getContentItemArgs>(params);
        } catch (e) {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(500).json("Invalid request");
        }

        try {
            const result = await handleGetByRequiredItem(params);
            return res.status(200).json(result);
        } catch (e) {
            console.error(`${req.path}: Failed to retrieve item`, e);
            return res.status(500).json("Failed to retrieve item");
        }
    }
);
