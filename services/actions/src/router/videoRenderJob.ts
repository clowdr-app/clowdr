import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleVideoRenderJobUpdated } from "../handlers/prepare";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { Payload, VideoRenderJobData } from "../types/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", bodyParser.json(), async (req: Request, res: Response) => {
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
