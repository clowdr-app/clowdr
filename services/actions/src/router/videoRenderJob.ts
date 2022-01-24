import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { EventPayload } from "@midspace/hasura/event";
import type { VideoRenderJobData } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleProcessVideoRenderJobQueue, handleVideoRenderJobUpdated } from "../handlers/videoRenderJob";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", json(), async (req: Request, res: Response) => {
    try {
        assertType<EventPayload<VideoRenderJobData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleVideoRenderJobUpdated(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling ConferencePrepareJob inserted");
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});

router.post("/processQueue", json(), async (req: Request, res: Response) => {
    try {
        await handleProcessVideoRenderJobQueue(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing VideoRenderJob queue");
        res.status(500).json("Failure while processing VideoRenderJob queue");
        return;
    }

    res.status(200).json("OK");
});
