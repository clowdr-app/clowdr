import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { json } from "body-parser";
import express from "express";
import { getVAPIDPublicKey } from "../http-handlers/vapid";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/publicKey", getVAPIDPublicKey);
