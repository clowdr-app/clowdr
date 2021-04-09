import bodyParser from "body-parser";
import express from "express";
import { getVAPIDPublicKey } from "../http-handlers/vapid";
import { checkEventSecret } from "../lib/checkEventSecret";

export const router = express.Router();

router.use(checkEventSecret);
router.use(bodyParser.json());

router.post("/publicKey", getVAPIDPublicKey);
