import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleGetSlug } from "../handlers/conference";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import type { ActionPayload } from "../types/hasura/action";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(json());

router.post("/getSlug", async (req: Request, res: Response) => {
    try {
        assertType<ActionPayload<getSlugArgs>>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        const slug = await handleGetSlug(req.body.input);
        res.status(200).json({ slug });
    } catch (e) {
        console.error("Failure while handling get slug", e);
        res.status(500).json("Failure while handling get slug");
        return;
    }
});
