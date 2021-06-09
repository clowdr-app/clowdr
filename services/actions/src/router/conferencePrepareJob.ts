import { json } from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleConferencePrepareJobInserted } from "../handlers/prepare";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { ConferencePrepareJobData, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/inserted", json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<ConferencePrepareJobData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    const params: Payload<ConferencePrepareJobData> = req.body;
    handleConferencePrepareJobInserted(params)
        .then(() => {
            console.log("Finished handling new ConferencePrepareJob", params.id, params.event.data.new?.id);
        })
        .catch((e) => {
            console.error(
                "Failure while handling ConferencePrepareJob inserted",
                params.id,
                params.event.data.new?.id,
                e
            );
        });
    return res.status(200).json("OK");
});
