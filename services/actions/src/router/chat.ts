import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { AuthenticatedRequest } from "../checkScopes";
import {
    generateRemoteServiceId,
    generateRemoteServiceIds,
    generateRemoteServiceToken,
    generateRemoteUserId,
    generateRemoteUserIds,
    handleMessageDeleted,
    handleMessageInserted,
    handleMessageUpdated,
    handleReactionDeleted,
    handleReactionInserted,
    handleReactionUpdated,
    sendEmailUnnotifiedMessageNotifications,
} from "../lib/chat";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { checkJwt } from "../middlewares/checkJwt";
import { checkUserScopes } from "../middlewares/checkScopes";
import { ChatData, MessageData, Payload, ReactionData, UserData } from "../types/hasura/event";

export const router = express.Router();

router.use(checkEventSecret);

router.post("/sendEmailUnnotifiedMessageNotifications", async (_req: Request, res: Response) => {
    try {
        await sendEmailUnnotifiedMessageNotifications();
    } catch (e) {
        console.error("Failure while processing unnotified message notifications", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/generateRemoteServiceIds", async (_req: Request, res: Response) => {
    try {
        await generateRemoteServiceIds();
    } catch (e) {
        console.error("Failure while processing chat generate remote service ids", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json({});
});

router.post("/chatInserted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ChatData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const newData = (req.body as Payload<ChatData>).event.data.new as ChatData;
        await generateRemoteServiceId(newData.id);
    } catch (e) {
        console.error("Failure while handling chat inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/generateRemoteUserIds", async (_req: Request, res: Response) => {
    try {
        await generateRemoteUserIds();
    } catch (e) {
        console.error("Failure while processing chat generate remote user ids", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json({});
});

router.post("/generateRemoteUserId", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<UserData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const newData = (req.body as Payload<UserData>).event.data.new as UserData;
        await generateRemoteUserId(newData.id);
    } catch (e) {
        console.error("Failure while handling generate chat remote user id", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post(
    "/generateRemoteToken",
    bodyParser.json(),
    checkJwt,
    checkUserScopes,
    async (_req: Request, res: Response) => {
        const req = _req as AuthenticatedRequest;
        try {
            if (req.body?.input?.attendeeId) {
                const result = await generateRemoteServiceToken(req.userId, req.body.input.attendeeId);
                return res.status(200).json(result);
            } else {
                throw new Error("No attendeeId!");
            }
        } catch (e) {
            console.error("Failure while handling generate chat remote token", e);
            res.status(500).json("Failure while handling event");
            return;
        }
    }
);

router.post("/messageInserted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<MessageData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const newData = (req.body as Payload<MessageData>).event.data.new as MessageData;
        await handleMessageInserted(newData);
    } catch (e) {
        console.error("Failure while handling message inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/messageUpdated", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<MessageData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const newData = (req.body as Payload<MessageData>).event.data.new as MessageData;
        await handleMessageUpdated(newData);
    } catch (e) {
        console.error("Failure while handling message updated", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/messageDeleted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<MessageData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const oldData = (req.body as Payload<MessageData>).event.data.old as MessageData;
        await handleMessageDeleted(oldData);
    } catch (e) {
        console.error("Failure while handling message deleted", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/reactionInserted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ReactionData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const newData = (req.body as Payload<ReactionData>).event.data.new as ReactionData;
        await handleReactionInserted(newData);
    } catch (e) {
        console.error("Failure while handling reaction inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/reactionUpdated", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ReactionData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const newData = (req.body as Payload<ReactionData>).event.data.new as ReactionData;
        await handleReactionUpdated(newData);
    } catch (e) {
        console.error("Failure while handling reaction updated", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/reactionDeleted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ReactionData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const oldData = (req.body as Payload<ReactionData>).event.data.old as ReactionData;
        await handleReactionDeleted(oldData);
    } catch (e) {
        console.error("Failure while handling reaction deleted", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});
