import { NextFunction, Request, Response } from "express";
import { getVAPIDKeys } from "../web-push/vapidKeys";

export async function getVAPIDPublicKey(_req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        const keys = await getVAPIDKeys();
        res.status(200).send({ key: keys.publicKey });
    } catch (e) {
        console.error("Error handling request for VAPID public key. Failed to get VAPID keys.", e);
        res.status(500).send("Failed to get VAPID public key");
    }
}
