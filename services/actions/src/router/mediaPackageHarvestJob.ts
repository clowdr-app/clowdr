import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { MediaPackageHarvestJob, Payload } from "@midspace/hasura/event";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleMediaPackageHarvestJobUpdated } from "../handlers/recording";
import { awsClient } from "../lib/aws/awsClient";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));

router.post("/updated", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<MediaPackageHarvestJob>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleMediaPackageHarvestJobUpdated(req.log, req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling ConferencePrepareJob inserted");
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});
