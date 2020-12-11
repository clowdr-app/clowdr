import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType, is } from "typescript-is";
import {
    handleContentItemUpdated,
    handleGetByRequiredItem,
} from "../handlers/content";
import { submitContentHandler } from "../handlers/upload";
import { ContentItemData, Payload } from "../types/event";

export const router = express.Router();

router.post(
    "/updated",
    bodyParser.json(),
    async (req: Request, res: Response) => {
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
    }
);

router.post(
    "/submit",
    bodyParser.json(),
    async (req: Request, res: Response) => {
        const params = req.body.input;
        if (is<submitContentItemArgs>(params)) {
            console.log(`${req.path}: Item upload requested`);
            const result = await submitContentHandler(params);
            return res.status(200).json(result);
        } else {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(200).json({
                success: false,
                message: "Invalid request",
            });
        }
    }
);

router.post(
    "/getByRequiredItem",
    bodyParser.json(),
    async (
        req: Request,
        res: Response<Array<GetContentItemOutput> | string>
    ) => {
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

router.post("/notifyTranscode", async (req: Request, res: Response) => {
    console.log("notifyTranscode", req);
    res.status(200).json("OK");
});

router.post("/notifyTranscribe", (req: Request, res: Response) => {
    console.log("notifyTranscribe", req);
    res.status(200).json("OK");
});
