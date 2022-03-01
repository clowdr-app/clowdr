import express from "express";
import { summary } from "../http-handlers/summary";

export const router = express.Router();

router.post("/summary", summary);
