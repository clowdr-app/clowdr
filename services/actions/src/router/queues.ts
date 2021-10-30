import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { processCustomEmailsJobQueue } from "../handlers/customEmail";
import { processEmailsJobQueue } from "../handlers/email";
import { processInvitationEmailsQueue } from "../handlers/invitation";
import { processSendSubmissionRequestsJobQueue } from "../handlers/upload";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/processEmailsJobQueue", json(), async (req: Request, res: Response) => {
    try {
        console.log(`${req.originalUrl}: processing emails job queue`);
        await processEmailsJobQueue();
    } catch (e: any) {
        console.error("Failure while processing emails job queue", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/processSendSubmissionRequestsJobQueue", json(), async (req: Request, res: Response) => {
    try {
        console.log(`${req.originalUrl}: processing send submission requests job queue`);
        await processSendSubmissionRequestsJobQueue();
    } catch (e: any) {
        console.error("Failure while processing send submission requests job queue", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/processInvitationEmailsQueue", json(), async (req: Request, res: Response) => {
    try {
        console.log(`${req.originalUrl}: processing invitation emails job queue`);
        await processInvitationEmailsQueue();
    } catch (e: any) {
        console.error("Failure while processing invitations emails job queue", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/processCustomEmailsJobQueue", json(), async (req: Request, res: Response) => {
    try {
        console.log(`${req.originalUrl}: processing custom emails job queue`);
        await processCustomEmailsJobQueue();
    } catch (e: any) {
        console.error("Failure while processing invitations emails job queue", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
