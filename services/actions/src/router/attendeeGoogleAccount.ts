import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleAttendeeGoogleAccountDeleted, handleRefreshYouTubeData } from "../handlers/attendeeGoogleAccount";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { AttendeeGoogleAccountData, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/deleted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<AttendeeGoogleAccountData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleAttendeeGoogleAccountDeleted(req.body);
    } catch (e) {
        console.error("Failure while handling AttendeeGoogleAccount deleted", e);
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});

router.post("/refreshYouTubeData", bodyParser.json(), async (req: Request, res: Response<RefreshYouTubeDataOutput>) => {
    console.log(req.originalUrl);
    const params = req.body.input;
    try {
        assertType<refreshYouTubeDataArgs>(params);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request`, req.body, e);
        return res.status(500).json({ success: false, message: e.message });
    }

    try {
        const result = await handleRefreshYouTubeData(
            params,
            req.body.session_variables["x-hasura-user-id"],
            req.body.session_variables["x-hasura-conference-slug"]
        );
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: failed to refresh YouTube data`, params, e);
        return res.status(500).json({ success: false, message: e.message });
    }
});
