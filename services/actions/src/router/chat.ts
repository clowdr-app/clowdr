import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { EventPayload } from "@midspace/hasura/event";
import type { FlagData } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleFlagInserted } from "../handlers/chat";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(json());

router.post("/flag/inserted", async (req: Request, res: Response) => {
    try {
        assertType<EventPayload<FlagData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleFlagInserted(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling flag inserted");
        res.status(500).json("Failure while handling flag inserted");
        return;
    }
    res.status(200).json("OK");
});
