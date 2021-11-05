import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type {
    getGoogleOAuthUrlArgs,
    GetGoogleOAuthUrlOutput,
    submitGoogleOAuthCodeArgs,
    SubmitGoogleOAuthCodeOutput,
} from "@midspace/hasura/actionTypes";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import {
    handleGetGoogleOAuthUrl,
    handleSubmitGoogleOAuthToken,
    handleUploadYouTubeVideoJobQueue,
} from "../handlers/google";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/getOAuthUrl", json(), async (req: Request, res: Response<GetGoogleOAuthUrlOutput | string>) => {
    const params = req.body.input;
    try {
        assertType<getGoogleOAuthUrlArgs>(params);
    } catch (e: any) {
        req.log.error({ input: req.body.input }, "Invalid request");
        return res.status(500).json("Invalid request");
    }

    try {
        const result = await handleGetGoogleOAuthUrl(params);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to get Google OAuth URL");
        return res.status(500).json("Failed to get Google OAuth URL");
    }
});

router.post("/submitOAuthCode", json(), async (req: Request, res: Response<SubmitGoogleOAuthCodeOutput | string>) => {
    const params: submitGoogleOAuthCodeArgs = req.body.input;
    try {
        assertType<submitGoogleOAuthCodeArgs>(params);
    } catch (e: any) {
        req.log.error({ input: req.body.input }, "Invalid request");
        return res.status(500).json("Invalid request");
    }

    try {
        const result = await handleSubmitGoogleOAuthToken(
            req.log,
            params,
            req.body.session_variables["x-hasura-user-id"]
        );
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to submit Google OAuth token");
        return res.status(500).json("Failed to submit Google OAuth token");
    }
});

router.post("/processUploadYouTubeVideoQueue", json(), async (req: Request, res: Response) => {
    try {
        await handleUploadYouTubeVideoJobQueue(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing UploadYouTubeVideoJob queue");
        res.status(500).json("Failure while processing UploadYouTubeVideoJob queue");
        return;
    }

    res.status(200).json("OK");
});
