import bodyParser from "body-parser";
import express from "express";
import { pinChanged, subscriptionChanged } from "../http-handlers/chat";
import { checkEventSecret } from "../lib/checkEventSecret";

export const router = express.Router();

router.use(checkEventSecret);
router.use(bodyParser.json());

router.post("/subscriptionChanged", subscriptionChanged);
router.post("/pinChanged", pinChanged);
