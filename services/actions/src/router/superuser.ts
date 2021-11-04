import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { handleInitialiseSuperUser } from "../handlers/superuser";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/initialise", json(), async (req: Request, res: Response) => {
    try {
        const result = await handleInitialiseSuperUser(req.log);
        res.status(200).json(result);
    } catch (e: any) {
        req.log.error("Failure while handling initialise superuser", e);
        res.status(200).json({ success: false, error: e.toString() });
        return;
    }
});
