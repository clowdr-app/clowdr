import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleEventRoomJoinUpdated } from "../handlers/eventRoomJoinRequest";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { EventRoomJoinRequestData, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<EventRoomJoinRequestData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleEventRoomJoinUpdated(req.body);
    } catch (e) {
        console.error("Failure while handling eventRoomJoin updated", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});
