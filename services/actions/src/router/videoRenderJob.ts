import { json } from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleProcessVideoRenderJobQueue, handleVideoRenderJobUpdated } from "../handlers/videoRenderJob";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { Payload, VideoRenderJobData } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<VideoRenderJobData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleVideoRenderJobUpdated(req.body);
    } catch (e) {
        console.error("Failure while handling ConferencePrepareJob inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});

router.post("/processQueue", json(), async (_req: Request, res: Response) => {
    try {
        await handleProcessVideoRenderJobQueue();
    } catch (e) {
        console.error("Failure while processing VideoRenderJob queue", e);
        res.status(500).json("Failure while processing VideoRenderJob queue");
        return;
    }

    res.status(200).json("OK");
});
