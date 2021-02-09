import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleAttendeeGoogleAccountDeleted } from "../handlers/attendeeGoogleAccount";
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
