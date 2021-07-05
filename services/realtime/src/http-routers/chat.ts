import { json } from "body-parser";
import express from "express";
import { flagInserted, pinChanged, subscriptionChanged } from "../http-handlers/chat";
import { checkEventSecret } from "../lib/checkEventSecret";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/subscriptionChanged", subscriptionChanged);
router.post("/pinChanged", pinChanged);
router.post("/flag/inserted", flagInserted);
