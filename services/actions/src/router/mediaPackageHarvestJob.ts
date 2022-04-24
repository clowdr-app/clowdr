import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { EventPayload } from "@midspace/hasura/event";
import type { MediaPackageHarvestJob } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { assertType, TypeGuardError } from "typescript-is";
import { handleMediaPackageHarvestJobUpdated } from "../handlers/recording";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", json(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = assertType<EventPayload<MediaPackageHarvestJob>>(req.body);
        await handleMediaPackageHarvestJobUpdated(req.log, body);
        res.status(200).json("OK");
    } catch (err: unknown) {
        if (err instanceof TypeGuardError) {
            next(new BadRequestError("Invalid request", { originalError: err }));
        } else if (err instanceof Error) {
            res.status(403).json(err.toString());
        } else {
            next(new UnexpectedServerError("Server error", undefined, err));
        }
    }
});
