import { json } from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleVonageSessionLayoutCreated } from "../handlers/vonageSessionLayout";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { Payload, VonageSessionLayoutData_Record } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/inserted", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<VonageSessionLayoutData_Record>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
    try {
        await handleVonageSessionLayoutCreated(req.body);
    } catch (e) {
        console.error("Failure while handling vonageSessionLayout inserted", e);
        res.status(500).json("Failure while handling event");
        return;
    }
    res.status(200).json("OK");
});
