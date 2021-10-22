import type { NextFunction, Request, Response } from "express";
import { assertType } from "typescript-is";
import { generateEventHandsRaisedKeyName } from "../lib/handRaise";
import { redisClientP, redisClientPool } from "../redis";
import type { Action, EventEndedNotification } from "../types/hasura";

export async function eventEnded(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Action<EventEndedNotification>>(req.body);

        const data: Action<EventEndedNotification> = req.body;

        const keyName = generateEventHandsRaisedKeyName(data.input.eventId);
        const redisClient = await redisClientPool.acquire("http-handlers/event/eventEnded");
        try {
            await redisClientP.del(redisClient)(keyName);
        } finally {
            redisClientPool.release("http-handlers/event/eventEnded", redisClient);
        }

        res.status(200).send({ ok: true });
    } catch (e) {
        console.error("Event ended: Received incorrect payload", e);
        res.status(500).json({ ok: false });
        return;
    }
}
