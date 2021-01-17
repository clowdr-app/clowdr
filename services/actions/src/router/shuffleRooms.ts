import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleShuffleQueueEntered, processShuffleQueues } from "../handlers/shuffleRoom";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { Payload, ShuffleQueueEntryData } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/entered", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ShuffleQueueEntryData>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleShuffleQueueEntered(req.body);
    } catch (e) {
        console.error("Failure while handling shuffle queue entered", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/process", async (_req: Request, res: Response) => {
    try {
        await processShuffleQueues();
    } catch (e) {
        console.error("Failure while processing shuffle queues", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
