import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleMediaPackageHarvestJobUpdated } from "../handlers/recording";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { MediaPackageHarvestJob, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<MediaPackageHarvestJob>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    try {
        await handleMediaPackageHarvestJobUpdated(req.body);
    } catch (e) {
        console.error("Failure while handling ConferencePrepareJob inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }

    res.status(200).json("OK");
});
