import express, { Request, Response } from "express";
import { sendEmailUnnotifiedMessageNotifications } from "../lib/chat";

export const router = express.Router();

router.post("/sendEmailUnnotifiedMessageNotifications", async (_req: Request, res: Response) => {
    try {
        await sendEmailUnnotifiedMessageNotifications();
    } catch (e) {
        console.error("Failure while processing unnotified message notifications", e);
        res.status(500).json("Failure");
        return;
    }
    res.status(200).json("OK");
});
