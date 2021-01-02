import assert from "assert";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleJoinEvent, handleJoinRoom, handleVonageSessionMonitoringWebhook } from "../handlers/vonage";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { ActionPayload } from "../types/hasura/action";
import { WebhookReqBody } from "../types/vonage";

assert(process.env.VONAGE_WEBHOOK_SECRET, "VONAGE_WEBHOOK_SECRET environment variable must be set");

export const router = express.Router();

// Unprotected routes
router.post("/sessionMonitoring/:token", bodyParser.json(), async (req: Request, res: Response) => {
    console.log(req.originalUrl);

    // Validate token
    if (!req.params.token || req.params.token !== process.env.VONAGE_WEBHOOK_SECRET) {
        console.error("Received Vonage Session Monitoring webhook with invalid token", req.params.token);
        res.status(403).json("Access denied");
        return;
    }

    let payload: WebhookReqBody;
    try {
        assertType<WebhookReqBody>(req.body);
        payload = req.body;
    } catch (e) {
        console.error("Invalid Vonage Session Monitoring webhook payload", e);
        res.status(500).json("Failure");
        return;
    }

    try {
        await handleVonageSessionMonitoringWebhook(payload);
    } catch (e) {
        console.error("Failure while handling Vonage SessionMonitoring webhook", e);
        res.status(200).json("Failure");
        return;
    }

    res.status(200).json("OK");
});

// Protected routes

router.use(checkEventSecret);

router.post("/joinEvent", bodyParser.json(), async (req: Request, res: Response<JoinEventVonageSessionOutput>) => {
    let body: ActionPayload<joinEventVonageSessionArgs>;
    try {
        body = req.body;
        assertType<ActionPayload<joinEventVonageSessionArgs>>(body);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request`, req.body.input, e);
        return res.status(200).json({});
    }

    try {
        const result = await handleJoinEvent(body.input, body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: failure while handling request`, req.body.input, e);
        return res.status(200).json({});
    }
});

router.post("/joinRoom", bodyParser.json(), async (req: Request, res: Response<JoinRoomVonageSessionOutput>) => {
    let body: ActionPayload<joinRoomVonageSessionArgs>;
    try {
        body = req.body;
        assertType<ActionPayload<joinRoomVonageSessionArgs>>(body);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request`, req.body.input, e);
        return res.status(200).json({});
    }

    try {
        const result = await handleJoinRoom(body.input, body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: failure while handling request`, req.body.input, e);
        return res.status(200).json({});
    }
});
