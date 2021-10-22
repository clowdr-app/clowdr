import assert from "assert";
import type { NextFunction, Request, Response } from "express";
import { assertType } from "typescript-is";
import {
    deletePushNotificationSubscription,
    insertOrUpdatePushNotificationSubscription,
} from "../lib/cache/pushNotificationSubscriptions";
import type { Payload, PushNotificationSubscription } from "../types/hasura";

export async function pushNotificationSubscriptionChanged(
    req: Request,
    res: Response,
    _next?: NextFunction
): Promise<void> {
    try {
        assertType<Payload<PushNotificationSubscription>>(req.body);

        const data: Payload<PushNotificationSubscription> = req.body;

        const sub = data.event.data.new ?? data.event.data.old;
        assert(sub, "Missing data");

        if (data.event.op === "INSERT" || data.event.op === "UPDATE" || data.event.op === "MANUAL") {
            await insertOrUpdatePushNotificationSubscription(sub.userId, {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.auth,
                    p256dh: sub.p256dh,
                },
            });
        } else if (data.event.op === "DELETE") {
            await deletePushNotificationSubscription(sub.userId, sub.endpoint);
        }

        res.status(200).send("OK");
    } catch (e) {
        console.error("Push notification subscription changed: Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
}
