import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleContentItemUpdated, handleGetByRequiredItem, handleGetUploadAgreement } from "../handlers/content";
import { handleContentItemSubmitted, handleUpdateSubtitles } from "../handlers/upload";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { ContentItemData, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ContentItemData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleContentItemUpdated(req.body);
    } catch (e) {
        console.error("Failure while handling contentItem updated", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/submit", bodyParser.json(), async (req: Request, res: Response) => {
    const params = req.body.input;
    try {
        assertType<submitContentItemArgs>(params);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request`, params);
        return res.status(200).json({
            success: false,
            message: "Invalid request",
        });
    }

    try {
        console.log(`${req.originalUrl}: content item submitted`);
        const result = await handleContentItemSubmitted(params);
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: failed to submit content item`, e);
        return res.status(200).json({
            success: false,
            message: "Failed to submit content item",
        });
    }
});

router.post("/updateSubtitles", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        const params = req.body.input;
        assertType<updateSubtitlesArgs>(params);
        const result = await handleUpdateSubtitles(params);
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request:`, req.body, e);
        return res.status(200).json({
            success: false,
            message: "Invalid request",
        });
    }
});

router.post(
    "/getByRequiredItem",
    bodyParser.json(),
    async (req: Request, res: Response<Array<GetContentItemOutput> | string>) => {
        const params = req.body.input;
        try {
            assertType<getContentItemArgs>(params);
        } catch (e) {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(500).json("Invalid request");
        }

        try {
            const result = await handleGetByRequiredItem(params);
            return res.status(200).json(result);
        } catch (e) {
            console.error(`${req.path}: Failed to retrieve item`, e);
            return res.status(500).json("Failed to retrieve item");
        }
    }
);

router.post(
    "/getUploadAgreement",
    bodyParser.json(),
    async (req: Request, res: Response<GetUploadAgreementOutput | string>) => {
        const params = req.body.input;
        try {
            assertType<getUploadAgreementArgs>(params);
        } catch (e) {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(500).json("Invalid request");
        }

        try {
            const result = await handleGetUploadAgreement(params);
            return res.status(200).json(result);
        } catch (e) {
            console.error(`${req.path}: Failed to retrieve agreement text`, e);
            return res.status(500).json("Failed to retrieve agreement text");
        }
    }
);
