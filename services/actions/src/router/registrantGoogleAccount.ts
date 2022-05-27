import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { refreshYouTubeDataArgs, RefreshYouTubeDataOutput } from "@midspace/hasura/action-types";
import type { EventPayload } from "@midspace/hasura/event";
import type { GoogleAuthTokenData } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleGoogleAuthTokenDeleted, handleRefreshYouTubeData } from "../handlers/registrantGoogleAccount";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/deleted", json(), async (req: Request, res: Response) => {
    try {
        assertType<EventPayload<GoogleAuthTokenData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleGoogleAuthTokenDeleted(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling GoogleAuthToken deleted");
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});

router.post("/refreshYouTubeData", json(), async (req: Request, res: Response<RefreshYouTubeDataOutput>) => {
    const params = req.body.input;
    try {
        assertType<refreshYouTubeDataArgs>(params);
    } catch (e: any) {
        req.log.error({ err: e, body: req.body }, "Invalid request");
        return res.status(500).json({ success: false, message: e.message });
    }

    try {
        const result = await handleRefreshYouTubeData(req.log, params);
        return res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ params, err: e }, "Failed to refresh YouTube data");
        return res.status(500).json({ success: false, message: e.message });
    }
});
