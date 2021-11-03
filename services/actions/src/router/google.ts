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
        console.error(`${req.path}: Invalid request:`, req.body.input);
        return res.status(500).json("Invalid request");
    }

    try {
        const result = await handleGetGoogleOAuthUrl(params);
        return res.status(200).json(result);
    } catch (e: any) {
        console.error(`${req.path}: Failed to get Google OAuth URL`, e);
        return res.status(500).json("Failed to get Google OAuth URL");
    }
});

router.post("/submitOAuthCode", json(), async (req: Request, res: Response<SubmitGoogleOAuthCodeOutput | string>) => {
    const params: submitGoogleOAuthCodeArgs = req.body.input;
    try {
        assertType<submitGoogleOAuthCodeArgs>(params);
    } catch (e: any) {
        console.error(`${req.path}: Invalid request:`, req.body.input);
        return res.status(500).json("Invalid request");
    }

    try {
        const result = await handleSubmitGoogleOAuthToken(params, req.body.session_variables["x-hasura-user-id"]);
        return res.status(200).json(result);
    } catch (e: any) {
        console.error(`${req.path}: Failed to submit Google OAuth token`, e);
        return res.status(500).json("Failed to submit Google OAuth token");
    }
});

router.post("/processUploadYouTubeVideoQueue", json(), async (_req: Request, res: Response) => {
    try {
        await handleUploadYouTubeVideoJobQueue();
    } catch (e: any) {
        console.error("Failure while processing UploadYouTubeVideoJob queue", e);
        res.status(500).json("Failure while processing UploadYouTubeVideoJob queue");
        return;
    }

    res.status(200).json("OK");
});
