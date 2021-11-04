import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { processCombineVideosJobQueue } from "../handlers/combineVideosJob";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);

router.post("/process", json(), async (req: Request, res: Response) => {
    req.log.info(`${req.originalUrl}: processing combine videos job queue`);
    processCombineVideosJobQueue(req.log)
        .then(() => {
            req.log.info("Finished processing CombineVideosJob queue");
        })
        .catch((e) => {
            req.log.error("Failure processing CombineVideosJob queue", e);
        });
    return res.status(200).json("OK");
});
