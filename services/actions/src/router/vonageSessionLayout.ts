import { json } from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleVonageSessionLayoutUpdated } from "../handlers/vonageSessionLayout";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { Payload, VonageSessionLayoutData_Record } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/updated", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<VonageSessionLayoutData_Record>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleVonageSessionLayoutUpdated(req.body);
    } catch (e) {
        console.error("Failure while handling vonageSessionLayout updated", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});
