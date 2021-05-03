import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import {
    handleEventEndNotification,
    handleEventStartNotification,
    handleEventUpdated,
    handleStopEventBroadcasts,
} from "../handlers/event";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { EventData, Payload, ScheduledEventPayload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<EventData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleEventUpdated(req.body);
    } catch (e) {
        console.error("Failure while handling event updated", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/notifyStart", bodyParser.json(), async (req: Request, res: Response) => {
    console.log(req.originalUrl);
    try {
        assertType<ScheduledEventPayload<{ eventId: string; startTime: string }>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleEventStartNotification(
            req.body.payload.eventId,
            req.body.payload.startTime,
            req.body.payload.updatedAt ?? null
        );
    } catch (e) {
        console.error("Failure while handling event/notifyStart", e);
        res.status(500).json("Failure while handling scheduled trigger");
        return;
    }
    res.status(200).json("OK");
});

router.post("/notifyEnd", bodyParser.json(), async (req: Request, res: Response) => {
    console.log(req.originalUrl);
    try {
        assertType<ScheduledEventPayload<{ eventId: string; endTime: string }>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleEventEndNotification(
            req.body.payload.eventId,
            req.body.payload.endTime,
            req.body.payload.updatedAt ?? null
        );
    } catch (e) {
        console.error("Failure while handling event/notifyEnd", e);
        res.status(500).json("Failure while handling scheduled trigger");
        return;
    }
    res.status(200).json("OK");
});

router.post("/stopBroadcasts", bodyParser.json(), async (req: Request, res: Response<StopEventBroadcastOutput>) => {
    console.log(req.originalUrl);
    const params = req.body.input;
    try {
        assertType<stopEventBroadcastArgs>(params);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request`, req.body, e);
        return res.status(500).json({ broadcastsStopped: 0 });
    }

    try {
        const result = await handleStopEventBroadcasts(params);
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: failed to stop event broadcasts`, params, e);
        return res.status(500).json({ broadcastsStopped: 0 });
    }
});
