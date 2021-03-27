import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import {
    handleGetGoogleOAuthUrl,
    handleSubmitGoogleOAuthToken,
    handleUploadYouTubeVideoJobQueue,
} from "../handlers/google";
import { checkEventSecret } from "../middlewares/checkEventSecret";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post(
    "/getOAuthUrl",
    bodyParser.json(),
    async (req: Request, res: Response<GetGoogleOAuthUrlOutput | string>) => {
        const params = req.body.input;
        try {
            assertType<getGoogleOAuthUrlArgs>(params);
        } catch (e) {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(500).json("Invalid request");
        }

        try {
            const result = await handleGetGoogleOAuthUrl(params);
            return res.status(200).json(result);
        } catch (e) {
            console.error(`${req.path}: Failed to get Google OAuth URL`, e);
            return res.status(500).json("Failed to get Google OAuth URL");
        }
    }
);

router.post(
    "/submitOAuthCode",
    bodyParser.json(),
    async (req: Request, res: Response<SubmitGoogleOAuthCodeOutput | string>) => {
        const params = req.body.input;
        try {
            assertType<submitGoogleOAuthCodeArgs>(params);
        } catch (e) {
            console.error(`${req.path}: Invalid request:`, req.body.input);
            return res.status(500).json("Invalid request");
        }

        try {
            const result = await handleSubmitGoogleOAuthToken(params, req.body.session_variables["x-hasura-user-id"]);
            return res.status(200).json(result);
        } catch (e) {
            console.error(`${req.path}: Failed to submit Google OAuth token`, e);
            return res.status(500).json("Failed to submit Google OAuth token");
        }
    }
);

router.post("/processUploadYouTubeVideoQueue", bodyParser.json(), async (_req: Request, res: Response) => {
    try {
        await handleUploadYouTubeVideoJobQueue();
    } catch (e) {
        console.error("Failure while processing UploadYouTubeVideoJob queue", e);
        res.status(500).json("Failure while processing UploadYouTubeVideoJob queue");
        return;
    }

    res.status(200).json("OK");
});
