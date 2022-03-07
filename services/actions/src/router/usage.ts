import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import {
    handleSaveVideoChatNonEventUsage,
    handleUpdateEventUsage,
    handleUpdateVideoChatNonEventUsage,
} from "../handlers/usage";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updateEvent", json(), async (req: Request, res: Response) => {
    try {
        await handleUpdateEventUsage(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling event usage update");
        res.status(500).json("Failure while handling event usage update");
        return;
    }
    res.status(200).json("OK");
});

router.post("/updateVideoChatNonEvent", json(), async (req: Request, res: Response) => {
    try {
        await handleUpdateVideoChatNonEventUsage(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling video-chat non-event usage update");
        res.status(500).json("Failure while handling video-chat non-event usage update");
        return;
    }
    res.status(200).json("OK");
});

router.post("/saveVideoChatNonEvent", json(), async (req: Request, res: Response) => {
    try {
        await handleSaveVideoChatNonEventUsage(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling save video-chat non-event usage");
        res.status(500).json("Failure while handling save video-chat non-event usage");
        return;
    }
    res.status(200).json("OK");
});
