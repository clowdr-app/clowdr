import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { Payload, ShuffleQueueEntryData } from "@midspace/hasura/event";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleShuffleQueueEntered, processShuffleQueues } from "../handlers/shuffleRoom";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/entered", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ShuffleQueueEntryData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleShuffleQueueEntered(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling shuffle queue entered");
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});

router.post("/process", async (req: Request, res: Response) => {
    try {
        await processShuffleQueues(req.log);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing shuffle queues");
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
