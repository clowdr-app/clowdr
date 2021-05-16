import { json } from "body-parser";
import express from "express";
import { eventEnded } from "../http-handlers/event";
import { checkEventSecret } from "../lib/checkEventSecret";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/ended", eventEnded);
