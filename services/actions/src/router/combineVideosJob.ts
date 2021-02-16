import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { handleCombineVideosJobInserted } from "../handlers/combineVideosJob";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { CombineVideosJobData, Payload } from "../types/hasura/event";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/inserted", bodyParser.json(), async (req: Request, res: Response) => {
    try {
        assertType<Payload<CombineVideosJobData>>(req.body);
    } catch (e) {
        console.error("Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }

    const params: Payload<CombineVideosJobData> = req.body;
    handleCombineVideosJobInserted(params)
        .then(() => {
            console.log("Finished handling new CombineVideosJob", params.id, params.event.data.new?.id);
        })
        .catch((e) => {
            console.error("Failure while handling CombineVideosJob inserted", params.id, params.event.data.new?.id, e);
        });
    return res.status(200).json("OK");
});
