import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { stopEventBroadcastArgs, StopEventBroadcastOutput } from "@midspace/hasura/action-types";
import type { EventPayload, ScheduledEventPayload } from "@midspace/hasura/event";
import type { EventData } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import {
    handleEventEndNotification,
    handleEventStartNotification,
    handleEventUpdated,
    handleStopEventBroadcasts,
} from "../handlers/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", json(), async (req: Request, res: Response) => {
    try {
        assertType<EventPayload<EventData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleEventUpdated(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling event updated");
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/notifyStart", json(), async (req: Request, res: Response) => {
    req.log.info("Event started");
    try {
        assertType<ScheduledEventPayload<{ eventId: string; startTime: string }>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleEventStartNotification(
            req.log,
            req.body.payload.eventId,
            req.body.payload.startTime,
            req.body.payload.updatedAt ?? null
        );
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling event/notifyStart");
        res.status(500).json("Failure while handling scheduled trigger");
        return;
    }
    res.status(200).json("OK");
});

router.post("/notifyEnd", json(), async (req: Request, res: Response) => {
    req.log.info("Event ended");
    try {
        assertType<ScheduledEventPayload<{ eventId: string; endTime: string }>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleEventEndNotification(
            req.log,
            req.body.payload.eventId,
            req.body.payload.endTime,
            req.body.payload.updatedAt ?? null
        );
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling event/notifyEnd");
        res.status(500).json("Failure while handling scheduled trigger");
        return;
    }
    res.status(200).json("OK");
});

router.post("/stopBroadcasts", json(), async (req: Request, res: Response<StopEventBroadcastOutput>) => {
    req.log.info("Stop broadcasts");
    const params = req.body.input;
    try {
        assertType<stopEventBroadcastArgs>(params);
    } catch (e: any) {
        req.log.error({ body: req.body, err: e }, "Invalid request");
        return res.status(500).json({ broadcastsStopped: 0 });
    }

    try {
        const result = await handleStopEventBroadcasts(req.log, params);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ params, err: e }, "Failed to stop event broadcasts");
        return res.status(500).json({ broadcastsStopped: 0 });
    }
});
