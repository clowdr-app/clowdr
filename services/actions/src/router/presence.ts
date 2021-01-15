import express, { Request, Response } from "express";
import { cleanupOpenTabs } from "../handlers/presence";
import { checkEventSecret } from "../middlewares/checkEventSecret";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/opentabs/cleanup", async (_req: Request, res: Response) => {
    try {
        await cleanupOpenTabs();
    } catch (e) {
        console.error("Failure while cleaning up open tabs", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
