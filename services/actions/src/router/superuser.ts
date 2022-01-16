import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { handleInitialiseSuperUser } from "../handlers/superuser";
import { awsClient } from "../lib/aws/awsClient";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));

router.post("/initialise", json(), async (req: Request, res: Response) => {
    try {
        const result = await handleInitialiseSuperUser(req.log);
        res.status(200).json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while handling initialise superuser");
        res.status(200).json({ success: false, error: e.toString() });
        return;
    }
});
