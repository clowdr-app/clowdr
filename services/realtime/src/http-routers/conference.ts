import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import express from "express";
import { conferenceInserted } from "../http-handlers/conference";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/inserted", conferenceInserted);
