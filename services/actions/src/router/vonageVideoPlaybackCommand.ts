import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { EventPayload } from "@midspace/hasura/event";
import type { VonageVideoPlaybackCommandData } from "@midspace/hasura/event-data";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { assertType, TypeGuardError } from "typescript-is";
import { handleVonageVideoPlaybackCommandInserted } from "../handlers/vonageVideoPlaybackCommand";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/inserted", json(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = assertType<EventPayload<VonageVideoPlaybackCommandData>>(req.body);
        await handleVonageVideoPlaybackCommandInserted(req.log, body);
        res.status(200).json({});
    } catch (err: unknown) {
        if (err instanceof TypeGuardError) {
            next(new BadRequestError("Invalid request", { originalError: err }));
        } else if (err instanceof Error) {
            next(err);
        } else {
            next(new UnexpectedServerError("Server error", undefined, err));
        }
    }
});
