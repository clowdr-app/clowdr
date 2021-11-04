import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { ConferencePrepareJobData, Payload } from "@midspace/hasura/event";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleConferencePrepareJobInserted } from "../handlers/prepare";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/inserted", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ConferencePrepareJobData>>(req.body);
    } catch (e: any) {
        req.log.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    const params: Payload<ConferencePrepareJobData> = req.body;
    handleConferencePrepareJobInserted(req.log, params)
        .then(() => {
            req.log.info("Finished handling new ConferencePrepareJob", params.id, params.event.data.new?.id);
        })
        .catch((e) => {
            req.log.error(
                "Failure while handling ConferencePrepareJob inserted",
                params.id,
                params.event.data.new?.id,
                e
            );
        });
    return res.status(200).json("OK");
});
