import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { parseSessionVariables } from "@midspace/auth/middlewares/parse-session-variables";
import type { GetUploadAgreementOutput, submitElementArgs, updateSubtitlesArgs } from "@midspace/hasura/actionTypes";
import type { ElementData, Payload } from "@midspace/hasura/event";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { assertType, TypeGuardError } from "typescript-is";
import { handleElementUpdated, handleGetUploadAgreement } from "../handlers/content";
import { handleElementSubmitted, handleUpdateSubtitles } from "../handlers/upload";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ElementData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleElementUpdated(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling element updated");
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/submit", json(), async (req: Request, res: Response) => {
    const params = req.body.input;
    try {
        assertType<submitElementArgs>(params);
    } catch (e: any) {
        req.log.error({ params }, "Invalid request");
        return res.status(200).json({
            success: false,
            message: "Invalid request",
        });
    }

    try {
        req.log.info("Content item submitted");
        const result = await handleElementSubmitted(req.log, params);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to submit content item");
        return res.status(200).json({
            success: false,
            message: "Failed to submit content item",
        });
    }
});

router.post("/updateSubtitles", json(), async (req: Request, res: Response) => {
    try {
        const params = req.body.input;
        assertType<updateSubtitlesArgs>(params);
        const result = await handleUpdateSubtitles(req.log, params);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ body: req.body, err: e }, "Invalid request");
        return res.status(200).json({
            success: false,
            message: "Invalid request",
        });
    }
});

router.post(
    "/getUploadAgreement",
    json(),
    parseSessionVariables,
    async (req: Request, res: Response<GetUploadAgreementOutput | string>, next: NextFunction) => {
        try {
            const magicToken = assertType<string>(req.magicToken);
            const result = await handleGetUploadAgreement(magicToken);
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
