import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { ActionPayload } from "@midspace/hasura/action";
import type { getSlugArgs } from "@midspace/hasura/actionTypes";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleGetSlug } from "../handlers/conference";
import { awsClient } from "../lib/aws/awsClient";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));
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
