import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json, text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import {
    handleChimeMeetingEndedNotification,
    handleChimeRegistrantJoinedNotification,
    handleChimeRegistrantLeftNotification,
    handleJoinRoom,
} from "../handlers/chime";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";
import type {
    ChimeEventBase,
    ChimeMeetingEndedDetail,
    ChimeRegistrantJoinedDetail,
    ChimeRegistrantLeftDetail,
} from "../types/chime";
import type { ActionPayload } from "../types/hasura/action";

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

        if (message.TopicArn !== process.env.AWS_CHIME_NOTIFICATIONS_TOPIC_ARN) {
            console.log("Received SNS notification for the wrong topic", {
                originalUrl: req.originalUrl,
                topicArn: message.TopicArn,
            });
            res.status(403).json("Access denied");
            return;
        }

        const subscribed = await tryConfirmSubscription(message);
        if (subscribed) {
            res.status(200).json("OK");
            return;
        }

        if (message.Type === "Notification") {
            console.log("Received SNS notification", {
                originalUrl: req.originalUrl,
                messageId: message.MessageId,
                message: message.Message,
            });

            let event: ChimeEventBase;
            try {
                event = JSON.parse(message.Message);
                assertType<ChimeEventBase>(event);
            } catch (err) {
                console.error("Unrecognised notification message", { originalUrl: req.originalUrl, err });
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event.detail.eventType === "chime:RegistrantLeft") {
                const detail: ChimeRegistrantLeftDetail = event.detail;
                try {
                    assertType<ChimeRegistrantLeftDetail>(event.detail);
                } catch (err) {
                    console.error("Invalid SNS event detail", {
                        eventType: "chime:RegistrantLeft",
                        eventDetail: event.detail,
                    });
                    res.status(500).json("Invalid event detail");
                    return;
                }

                try {
                    console.log("Received chime:RegistrantLeft notification", detail);
                    await handleChimeRegistrantLeftNotification(detail);
                } catch (err) {
                    console.error("Failure while handling chime:RegistrantLeft event", { err });
                }
                res.status(200).json("OK");
                return;
            }

            if (event.detail.eventType === "chime:RegistrantJoined") {
                const detail: ChimeRegistrantJoinedDetail = event.detail;
                try {
                    assertType<ChimeRegistrantJoinedDetail>(event.detail);
                } catch (err) {
                    console.error("Invalid SNS event detail", {
                        eventType: "chime:RegistrantJoined",
                        eventDetail: event.detail,
                    });
                    res.status(500).json("Invalid event detail");
                    return;
                }

                try {
                    console.log("Received chime:RegistrantJoined notification", detail);
                    await handleChimeRegistrantJoinedNotification(detail);
                } catch (err) {
                    console.error("Failure while handling chime:RegistrantJoined event", { err });
                }
                res.status(200).json("OK");
                return;
            }

            if (event.detail.eventType === "chime:MeetingEnded") {
                const detail: ChimeMeetingEndedDetail = event.detail;
                try {
                    assertType<ChimeMeetingEndedDetail>(event.detail);
                } catch (err) {
                    console.error("Invalid SNS event detail", {
                        eventType: "chime:MeetingEnded",
                        eventDetail: event.detail,
                    });
                    res.status(500).json("Invalid event detail");
                    return;
                }

                try {
                    console.log("Received chime:MeetingEnded notification", detail);
                    await handleChimeMeetingEndedNotification(detail);
                } catch (err) {
                    console.error("Failure while handling chime:MeetingEnded event", { err });
                }
                res.status(200).json("OK");
                return;
            }

            res.status(200).json("OK");
        }
    } catch (err) {
        console.error("Failed to handle request", { originalUrl: req.originalUrl, err });
        res.status(500).json("Failure");
    }
});

// Protected routes
router.use(checkEventSecret);

router.post("/joinRoom", json(), async (req: Request, res: Response<JoinRoomChimeSessionOutput>) => {
    let body: ActionPayload<joinRoomChimeSessionArgs>;
    try {
        body = req.body;
        assertType<ActionPayload<joinRoomChimeSessionArgs>>(body);
    } catch (e: any) {
        console.error("Invalid request", { url: req.originalUrl, input: req.body.input, err: e });
        return res.status(200).json({
            message: "Invalid request",
        });
    }

    try {
        const result = await handleJoinRoom(body.input, body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e: any) {
        console.error("Failure while handling request", { url: req.originalUrl, input: req.body.input, err: e });
        return res.status(200).json({
            message: "Failure while handling request",
        });
    }
});
