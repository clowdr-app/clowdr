import { json } from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleEventPersonDeleted } from "../handlers/eventProgramPerson";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { EventPersonData, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/deleted", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<EventPersonData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleEventPersonDeleted(req.body);
    } catch (e) {
        console.error("Failure while handling EventPerson deleted", e);
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});
