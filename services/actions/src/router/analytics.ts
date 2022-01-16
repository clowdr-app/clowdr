import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { gatherPresenceStats } from "../lib/analytics";
import { awsClient } from "../lib/aws/awsClient";
import { UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));

router.post("/gatherPresenceStats", json(), async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.log.info("Gathering presence stats");
        await gatherPresenceStats();
    } catch (err: unknown) {
        if (err instanceof Error) {
            next(err);
        } else {
            next(new UnexpectedServerError("Server error", undefined, err));
        }
    }
    res.status(200).json("OK");
});
