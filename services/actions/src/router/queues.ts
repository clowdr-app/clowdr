import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { processCustomEmailsJobQueue } from "../handlers/customEmail";
import { processEmailsJobQueue } from "../handlers/email";
import { processInvitationEmailsQueue } from "../handlers/invitation";
import { processSendSubmissionRequestsJobQueue } from "../handlers/upload";
import { awsClient } from "../lib/aws/awsClient";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));

router.post("/processEmailsJobQueue", json(), async (req: Request, res: Response) => {
    try {
        req.log.info("Processing emails job queue");
        await processEmailsJobQueue(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing emails job queue");
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/processSendSubmissionRequestsJobQueue", json(), async (req: Request, res: Response) => {
    try {
        req.log.info("Processing send submission requests job queue");
        await processSendSubmissionRequestsJobQueue(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing send submission requests job queue");
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/processInvitationEmailsQueue", json(), async (req: Request, res: Response) => {
    try {
        req.log.info("Processing invitation emails job queue");
        await processInvitationEmailsQueue(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing invitations emails job queue");
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});

router.post("/processCustomEmailsJobQueue", json(), async (req: Request, res: Response) => {
    try {
        req.log.info("Processing custom emails job queue");
        await processCustomEmailsJobQueue(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing invitations emails job queue");
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
