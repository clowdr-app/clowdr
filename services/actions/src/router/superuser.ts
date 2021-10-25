import { json } from "body-parser";
import express, { Request, Response } from "express";
import { handleInitialiseSuperUser } from "../handlers/superuser";
import { checkEventSecret } from "../middlewares/checkEventSecret";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/initialise", json(), async (_req: Request, res: Response) => {
    try {
        const result = await handleInitialiseSuperUser();
        res.status(200).json(result);
    } catch (e) {
        console.error("Failure while handling initialise superuser", e);
        res.status(200).json({ success: false, error: e.toString() });
        return;
    }
});
