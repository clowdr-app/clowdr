import express from "express";
import { flush } from "../http-handlers/flush";
import { summary } from "../http-handlers/summary";

export const router = express.Router();

router.post("/flush", flush);
router.post("/summary", summary);
