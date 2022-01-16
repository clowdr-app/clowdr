import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import type { ConferencePrepareJobData, Payload } from "@midspace/hasura/event";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { handleConferencePrepareJobInserted } from "../handlers/prepare";
import { awsClient } from "../lib/aws/awsClient";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));

router.post("/inserted", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ConferencePrepareJobData>>(req.body);
    } catch (e: any) {
        req.log.error({ err: e }, "Received incorrect payload");
        res.status(500).json("Unexpected payload");
        return;
    }

    const params: Payload<ConferencePrepareJobData> = req.body;
    handleConferencePrepareJobInserted(req.log, params)
        .then(() => {
            req.log.info({ id: params.id }, "Finished handling new ConferencePrepareJob");
        })
        .catch((e) => {
            req.log.error(
                {
                    id: params.id,
                    err: e,
                },
                "Failure while handling ConferencePrepareJob inserted"
            );
        });
    return res.status(200).json("OK");
});
