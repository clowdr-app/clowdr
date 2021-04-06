import assert from "assert";
import { NextFunction, Request, Response } from "express";
import { assertType } from "typescript-is";
import { deletePin, insertPin } from "../lib/cache/pin";
import { deleteSubscription, insertSubscription } from "../lib/cache/subscription";
import { generateChatPinsChangedRoomName, generateChatSubscriptionsChangedRoomName } from "../lib/chat";
import { emitter } from "../socket-emitter/socket-emitter";
import { Payload, Pin, Subscription } from "../types/hasura";

export async function subscriptionChanged(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Payload<Subscription>>(req.body);

        const data: Payload<Subscription> = req.body;

        const sub = data.event.data.new ?? data.event.data.old;
        assert(sub, "Missing data");

        if (data.event.op === "INSERT" || data.event.op === "MANUAL") {
            await insertSubscription(sub.chatId, sub.attendeeId);
            emitter.in(generateChatSubscriptionsChangedRoomName(sub.attendeeId)).emit("chat.subscribed", sub.chatId);
        } else if (data.event.op === "DELETE") {
            await deleteSubscription(sub.chatId, sub.attendeeId);
            emitter.in(generateChatSubscriptionsChangedRoomName(sub.attendeeId)).emit("chat.unsubscribed", sub.chatId);
        }

        res.status(200).send("OK");
    } catch (e) {
        console.error("Chat subscription changed: Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
}

export async function pinChanged(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Payload<Pin>>(req.body);

        const data: Payload<Pin> = req.body;

        const sub = data.event.data.new ?? data.event.data.old;
        assert(sub, "Missing data");

        if (data.event.op === "INSERT" || data.event.op === "MANUAL") {
            await insertPin(sub.chatId, sub.attendeeId);
            emitter.in(generateChatPinsChangedRoomName(sub.attendeeId)).emit("chat.pinned", sub.chatId);
        } else if (data.event.op === "DELETE") {
            await deletePin(sub.chatId, sub.attendeeId);
            emitter.in(generateChatPinsChangedRoomName(sub.attendeeId)).emit("chat.unpinned", sub.chatId);
        }

        res.status(200).send("OK");
    } catch (e) {
        console.error("Chat pin changed: Received incorrect payload", e);
        res.status(500).json("Unexpected payload");
        return;
    }
}
