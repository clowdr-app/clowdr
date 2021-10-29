import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleRefreshYouTubeData, handleRegistrantGoogleAccountDeleted } from "../handlers/registrantGoogleAccount";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import type { Payload, RegistrantGoogleAccountData } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/deleted", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<RegistrantGoogleAccountData>>(req.body);
    } catch (e: any) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleRegistrantGoogleAccountDeleted(req.body);
    } catch (e: any) {
        console.error("Failure while handling RegistrantGoogleAccount deleted", e);
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});

router.post("/refreshYouTubeData", json(), async (req: Request, res: Response<RefreshYouTubeDataOutput>) => {
    console.log(req.originalUrl);
    const params = req.body.input;
    try {
        assertType<refreshYouTubeDataArgs>(params);
    } catch (e: any) {
        console.error(`${req.originalUrl}: invalid request`, req.body, e);
        return res.status(500).json({ success: false, message: e.message });
    }

    try {
        const result = await handleRefreshYouTubeData(params);
        return res.status(200).json(result);
    } catch (e: any) {
        console.error(`${req.originalUrl}: failed to refresh YouTube data`, params, e);
        return res.status(500).json({ success: false, message: e.message });
    }
});
