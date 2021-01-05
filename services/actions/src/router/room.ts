import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleRoomCreated } from "../handlers/room";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { Payload, RoomData } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/created", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<RoomData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleRoomCreated(req.body);
    } catch (e) {
        console.error("Failure while handling room created", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});
