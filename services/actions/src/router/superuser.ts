import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import express, { Request, Response } from "express";
import { handleInitialiseSuperUser } from "../handlers/superuser";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/initialise", json(), async (_req: Request, res: Response) => {
    try {
        const result = await handleInitialiseSuperUser();
        res.status(200).json(result);
    } catch (e: any) {
        console.error("Failure while handling initialise superuser", e);
        res.status(200).json({ success: false, error: e.toString() });
        return;
    }
});
