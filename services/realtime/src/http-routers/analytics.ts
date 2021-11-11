import { json } from "body-parser";
import express from "express";
import { queueConferenceBatchUpdates } from "../http-handlers/analytics";
import { checkEventSecret } from "../lib/checkEventSecret";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/batchUpdate", queueConferenceBatchUpdates);
