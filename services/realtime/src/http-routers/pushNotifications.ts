import { json } from "body-parser";
import express from "express";
import { pushNotificationSubscriptionChanged } from "../http-handlers/pushNotifications";
import { checkEventSecret } from "../lib/checkEventSecret";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());

router.post("/changed", pushNotificationSubscriptionChanged);
