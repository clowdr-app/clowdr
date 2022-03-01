import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import express from "express";
import { eventEnded, eventStarted } from "../http-handlers/event";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/ended", eventEnded);
router.post("/started", eventStarted);
