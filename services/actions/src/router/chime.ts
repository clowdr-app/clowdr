import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { ActionPayload } from "@midspace/hasura/action";
import type { joinRoomChimeSessionArgs, JoinRoomChimeSessionOutput } from "@midspace/hasura/actionTypes";
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

export const router = express.Router();

// Unprotected routes
router.post("/notify", text(), async (req: Request, res: Response) => {
    req.log.info("Received Chime notification");

    try {
        const message = await validateSNSNotification(req.log, req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== process.env.AWS_CHIME_NOTIFICATIONS_TOPIC_ARN) {
            req.log.info(
                {
                    topicArn: message.TopicArn,
                },
                "Received SNS notification for the wrong topic"
            );
            res.status(403).json("Access denied");
            return;
        }

        const subscribed = await tryConfirmSubscription(req.log, message);
        if (subscribed) {
            res.status(200).json("OK");
            return;
        }

        if (message.Type === "Notification") {
            req.log.info(
                {
                    messageId: message.MessageId,
                    message: message.Message,
                },
                "Received SNS notification"
            );

            let event: ChimeEventBase;
            try {
                event = JSON.parse(message.Message);
                assertType<ChimeEventBase>(event);
            } catch (err) {
                req.log.error({ err }, "Unrecognised notification message");
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event.detail.eventType === "chime:RegistrantLeft") {
                const detail: ChimeRegistrantLeftDetail = event.detail;
                try {
                    assertType<ChimeRegistrantLeftDetail>(event.detail);
                } catch (err) {
                    req.log.error(
                        {
                            eventType: "chime:RegistrantLeft",
                            eventDetail: event.detail,
                        },
                        "Invalid SNS event detail"
                    );
                    res.status(500).json("Invalid event detail");
                    return;
                }

                try {
                    req.log.info({ detail }, "Received chime:RegistrantLeft notification");
                    await handleChimeRegistrantLeftNotification(req.log, detail);
                } catch (err) {
                    req.log.error({ err }, "Failure while handling chime:RegistrantLeft event");
                }
                res.status(200).json("OK");
                return;
            }

            if (event.detail.eventType === "chime:RegistrantJoined") {
                const detail: ChimeRegistrantJoinedDetail = event.detail;
                try {
                    assertType<ChimeRegistrantJoinedDetail>(event.detail);
                } catch (err) {
                    req.log.error(
                        {
                            eventType: "chime:RegistrantJoined",
                            eventDetail: event.detail,
                        },
                        "Invalid SNS event detail"
                    );
                    res.status(500).json("Invalid event detail");
                    return;
                }

                try {
                    req.log.info({ detail }, "Received chime:RegistrantJoined notification");
                    await handleChimeRegistrantJoinedNotification(req.log, detail);
                } catch (err) {
                    req.log.error({ err }, "Failure while handling chime:RegistrantJoined event");
                }
                res.status(200).json("OK");
                return;
            }

            if (event.detail.eventType === "chime:MeetingEnded") {
                const detail: ChimeMeetingEndedDetail = event.detail;
                try {
                    assertType<ChimeMeetingEndedDetail>(event.detail);
                } catch (err) {
                    req.log.error(
                        {
                            eventType: "chime:MeetingEnded",
                            eventDetail: event.detail,
                        },
                        "Invalid SNS event detail"
                    );
                    res.status(500).json("Invalid event detail");
                    return;
                }

                try {
                    req.log.info({ detail }, "Received chime:MeetingEnded notification");
                    await handleChimeMeetingEndedNotification(req.log, detail);
                } catch (err) {
                    req.log.error({ err }, "Failure while handling chime:MeetingEnded event");
                }
                res.status(200).json("OK");
                return;
            }

            res.status(200).json("OK");
        }
    } catch (err) {
        req.log.error({ err }, "Failed to handle request");
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
        req.log.error({ input: req.body.input, err: e }, "Invalid request");
        return res.status(200).json({
            message: "Invalid request",
        });
    }

    try {
        const result = await handleJoinRoom(req.log, body.input, body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ input: req.body.input, err: e }, "Failure while handling request");
        return res.status(200).json({
            message: "Failure while handling request",
        });
    }
});
