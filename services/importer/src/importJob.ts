import type { EventPayload } from "@midspace/hasura/event";
import assert from "assert";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { publishTask } from "./rabbitmq/tasks";
import type { ImportJob } from "./types/job";

export const router = express.Router();

router.post("/inserted", json(), async (req: Request, res: Response) => {
    try {
        assertType<EventPayload<ImportJob>>(req.body);
        const payload: EventPayload<ImportJob> = req.body;
        assert(payload.event.data.new, "New payload data missing.");
        const job: ImportJob = payload.event.data.new;

        req.log.info({ jobId: job.id }, "Initializing import job");
        await publishTask({
            type: "initialize",
            jobId: job.id,
        });

        res.status(200).json("OK");
    } catch (err) {
        req.log.error({ err, body: req.body }, "Failure while handling import job inserted event");
        res.status(500).json("Failure while handling import job inserted event");
        return;
    }
});
