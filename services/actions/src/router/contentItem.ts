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
import { submitContentHandler } from "../handlers/upload";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { ContentItemData, Payload } from "../types/event";

export const router = express.Router();

// Unprotected routes

router.post(
    "/notifyTranscode",
    bodyParser.text(),
    async (req: Request, res: Response) => {
        console.log("notifyTranscode");

        const validator = new MessageValidator();
        const validate = promisify(validator.validate.bind(validator));

        let message;
        try {
            message = JSON.parse(req.body);
            await validate(message);
        } catch (e) {
            console.log(
                "notifyTranscode: Received invalid SNS notification",
                e,
                req
            );
            res.status(403).json("Access denied");
            return;
        }

        if (
            message["TopicArn"] !==
            process.env.AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN
        ) {
            console.log(
                "notifyTranscode: Received SNS notification for the wrong topic",
                message["TopicArn"]
            );
            res.status(403).json("Access denied");
            return;
        }

        if (message["Type"] === "SubscriptionConfirmation") {
            try {
                await fetch(message["SubscribeURL"], {
                    method: "get",
                });
                console.log("notifyTranscode: confirmed subscription");
            } catch (e) {
                console.error(
                    "notifyTranscode: failed to confirm subscription",
                    e
                );
                res.status(500).json("Failure");
                return;
            }
        } else if (message["Type"] === "Notification") {
            console.log(
                "notifyTranscode Received message",
                message["MessageId"],
                message["Message"]
            );
        }

        res.status(200).json("OK");
    }
);

router.post(
    "/notifyTranscribe",
    bodyParser.json(),
    (req: Request, res: Response) => {
        console.log("notifyTranscribe", req);
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
            const result = await submitContentHandler(params);
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
