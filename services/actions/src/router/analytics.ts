import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { gatherPresenceStats } from "../lib/analytics";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/gatherPresenceStats", json(), async (req: Request, res: Response) => {
    try {
        req.log.info("Gathering presence stats");
        await gatherPresenceStats();
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while gathering presence stats");
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
