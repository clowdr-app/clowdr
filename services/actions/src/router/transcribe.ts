import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { ActionPayload } from "@midspace/hasura/action";
import type { TranscribeGeneratePresignedUrlArgs } from "@midspace/hasura/action-types";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleGeneratePresignedTranscribeWebsocketURL } from "../handlers/transcribe";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(json());

router.post("/generatePresignedUrl", async (req: Request, res: Response) => {
    try {
        assertType<ActionPayload<TranscribeGeneratePresignedUrlArgs>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const payload = req.body as ActionPayload<TranscribeGeneratePresignedUrlArgs>;
        const result = await handleGeneratePresignedTranscribeWebsocketURL(
            payload.input.languageCode,
            payload.input.sampleRate
        );
        res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling transcribe generate pre-signed url");
        res.status(500).json("Failure while handling transcribe generate pre-signed url");
        return;
    }
});
