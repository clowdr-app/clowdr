import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { parseSessionVariables } from "@midspace/auth/middlewares/parse-session-variables";
import type { ActionPayload } from "@midspace/hasura/action";
import type {
    joinEventVonageSessionArgs,
    JoinEventVonageSessionOutput,
    joinRoomVonageSessionArgs,
    JoinRoomVonageSessionOutput,
    toggleVonageRecordingStateArgs,
    ToggleVonageRecordingStateOutput,
} from "@midspace/hasura/actionTypes";
import assert from "assert";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { assertType, TypeGuardError } from "typescript-is";
import {
    handleJoinEvent,
    handleJoinRoom,
    handleToggleVonageRecordingState,
    handleVonageArchiveMonitoringWebhook,
    handleVonageSessionMonitoringWebhook,
} from "../handlers/vonage";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";
import type { ArchiveMonitoringWebhookReqBody, SessionMonitoringWebhookReqBody } from "../types/vonage";

assert(process.env.VONAGE_WEBHOOK_SECRET, "VONAGE_WEBHOOK_SECRET environment variable must be set");

export const router = express.Router();

// Unprotected routes
router.post("/sessionMonitoring/:token", json(), async (req: Request, res: Response) => {
    // Validate token
    if (!req.params.token || req.params.token !== process.env.VONAGE_WEBHOOK_SECRET) {
        req.log.error({ token: req.params.token }, "Received Vonage Session Monitoring webhook with invalid token");
        res.status(403).json("Access denied");
        return;
    }

    let payload: SessionMonitoringWebhookReqBody;
    try {
        assertType<SessionMonitoringWebhookReqBody>(req.body);
        payload = req.body;
    } catch (e: any) {
        req.log.error({ err: e }, "Invalid Vonage Session Monitoring webhook payload");
        res.status(500).json("Failure");
        return;
    }

    let result = false;
    try {
        result = await handleVonageSessionMonitoringWebhook(req.log, payload);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling Vonage SessionMonitoring webhook");
        res.status(200).json("Failure");
        return;
    }

    res.status(200).json(result ? "OK" : "Failure");
});

router.post("/archiveMonitoring/:token", json(), async (req: Request, res: Response) => {
    // Validate token
    if (!req.params.token || req.params.token !== process.env.VONAGE_WEBHOOK_SECRET) {
        req.log.error({ token: req.params.token }, "Received Vonage Archive Monitoring webhook with invalid token");
        res.status(403).json("Access denied");
        return;
    }

    let payload: ArchiveMonitoringWebhookReqBody;
    try {
        assertType<ArchiveMonitoringWebhookReqBody>(req.body);
        payload = req.body;
    } catch (e: any) {
        req.log.error({ err: e }, "Invalid Vonage Archive Monitoring webhook payload");
        res.status(500).json("Failure");
        return;
    }

    let result = false;
    try {
        result = await handleVonageArchiveMonitoringWebhook(req.log, payload);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling Vonage SessionMonitoring webhook");
        res.status(200).json("Failure");
        return;
    }

    res.status(200).json(result ? "OK" : "Failure");
});

// Protected routes

router.use(checkEventSecret);

router.post(
    "/joinEvent",
    json(),
    parseSessionVariables,
    async (req: Request, res: Response<JoinEventVonageSessionOutput>, next: NextFunction) => {
        try {
            const body = assertType<ActionPayload<joinEventVonageSessionArgs>>(req.body);
            if (!req.userId) {
                throw new BadRequestError("Invalid request", { privateMessage: "No User ID available" });
            }
            const result = await handleJoinEvent(req.log, body.input, req.userId, req.registrantIds);
            res.status(200).json(result);
        } catch (err: unknown) {
            if (err instanceof TypeGuardError) {
                next(new BadRequestError("Invalid request", { originalError: err }));
            } else if (err instanceof Error) {
                next(err);
            } else {
                next(new UnexpectedServerError("Server error", undefined, err));
            }
        }
    }
);

router.post(
    "/joinRoom",
    json(),
    parseSessionVariables,
    async (req: Request, res: Response<JoinRoomVonageSessionOutput>, next: NextFunction): Promise<void> => {
        try {
            const body = assertType<ActionPayload<joinRoomVonageSessionArgs>>(req.body);
            if (!req.userId) {
                throw new BadRequestError("Invalid request", { privateMessage: "No User ID available" });
            }
            const result = await handleJoinRoom(req.log, body.input, req.registrantIds, req.roomIds, req.userId);
            res.status(200).json(result);
        } catch (err: unknown) {
            if (err instanceof TypeGuardError) {
                next(new BadRequestError("Invalid request", { originalError: err }));
            } else if (err instanceof Error) {
                next(err);
            } else {
                next(new UnexpectedServerError("Server error", undefined, err));
            }
        }
    }
);

router.post("/toggleRecordingState", json(), async (req: Request, res: Response<ToggleVonageRecordingStateOutput>) => {
    let body: ActionPayload<toggleVonageRecordingStateArgs>;
    try {
        body = req.body;
        assertType<ActionPayload<toggleVonageRecordingStateArgs>>(body);
    } catch (e: any) {
        req.log.error({ input: req.body.input, err: e }, "Invalid request");
        return res.status(200).json({
            allowed: false,
            recordingState: false,
        });
    }

    try {
        const result = await handleToggleVonageRecordingState(
            req.log,
            body.input,
            body.session_variables["x-hasura-user-id"]
        );
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ input: req.body.input, err: e }, "Failure while handling request");
        return res.status(200).json({
            allowed: false,
            recordingState: false,
        });
    }
});
