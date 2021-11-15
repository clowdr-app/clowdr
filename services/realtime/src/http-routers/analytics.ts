import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import express from "express";
import { queueConferenceBatchUpdates, queueSingleConferenceBatchUpdate } from "../http-handlers/analytics";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/batchUpdate", queueConferenceBatchUpdates);
router.post("/singleBatchUpdate", queueSingleConferenceBatchUpdate);
