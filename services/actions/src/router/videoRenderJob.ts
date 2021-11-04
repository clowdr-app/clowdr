import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { Payload, VideoRenderJobData } from "@midspace/hasura/event";
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
        assertType<Payload<VideoRenderJobData>>(req.body);
    } catch (e: any) {
        req.log.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleVideoRenderJobUpdated(req.log, req.body);
    } catch (e: any) {
        req.log.error("Failure while handling ConferencePrepareJob inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});

router.post("/processQueue", json(), async (req: Request, res: Response) => {
    try {
        await handleProcessVideoRenderJobQueue(req.log);
    } catch (e: any) {
        req.log.error("Failure while processing VideoRenderJob queue", e);
        res.status(500).json("Failure while processing VideoRenderJob queue");
        return;
    }

    res.status(200).json("OK");
});
