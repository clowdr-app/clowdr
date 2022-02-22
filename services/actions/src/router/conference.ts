import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { parseSessionVariables } from "@midspace/auth/middlewares/parse-session-variables";
import type { ActionPayload } from "@midspace/hasura/action";
import type {
    getSlugArgs,
    updateConferenceLogoArgs,
    UpdateConferenceLogoResponse
} from "@midspace/hasura/action-types";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { assertType, TypeGuardError } from "typescript-is";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";
import { handleGetSlug, handleUpdateConferenceLogo } from "../handlers/conference";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(json());

router.post("/getSlug", async (req: Request, res: Response) => {
    try {
        assertType<ActionPayload<getSlugArgs>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const slug = await handleGetSlug(req.body.input);
        res.status(200).json({ slug, url: req.body.input });
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling get slug");
        res.status(500).json("Failure while handling get slug");
        return;
    }
});

router.post(
    "/logo/update",
    parseSessionVariables,
    async (req: Request, res: Response<UpdateConferenceLogoResponse>, next: NextFunction) => {
        try {
            const body = assertType<ActionPayload<updateConferenceLogoArgs>>(req.body);
            if (!req.userId) {
                throw new BadRequestError("Invalid request", { privateMessage: "No User ID available" });
            }
            const result = await handleUpdateConferenceLogo(req.userId, body.input);
            res.status(200).json(result);
        } catch (err: unknown) {
            if (err instanceof TypeGuardError) {
                next(new BadRequestError("Invalid request", { originalError: err }));
            } else if (err instanceof Error) {
                next(err);
            } else {
                next(new UnexpectedServerError("Server error", undefined, err));
            }
        }
    }
);
