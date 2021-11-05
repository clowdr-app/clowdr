import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type {
    getUploadAgreementArgs,
    GetUploadAgreementOutput,
    submitElementArgs,
    updateSubtitlesArgs,
} from "@midspace/hasura/actionTypes";
import type { ElementData, Payload } from "@midspace/hasura/event";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleElementUpdated, handleGetUploadAgreement } from "../handlers/content";
import { handleElementSubmitted, handleUpdateSubtitles } from "../handlers/upload";

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

router.post("/getUploadAgreement", json(), async (req: Request, res: Response<GetUploadAgreementOutput | string>) => {
    const params = req.body.input;
    try {
        assertType<getUploadAgreementArgs>(params);
    } catch (e: any) {
        req.log.error({ input: req.body.input }, "Invalid request");
        return res.status(500).json("Invalid request");
    }

    try {
        const result = await handleGetUploadAgreement(params);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to retrieve agreement text");
        return res.status(500).json("Failed to retrieve agreement text");
    }
});
