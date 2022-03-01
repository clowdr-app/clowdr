import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import { gql } from "@urql/core";
import type { NextFunction, Request, Response } from "express";
import { assertType } from "typescript-is";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import type { GetEventQuery, GetEventQueryVariables } from "../generated/graphql";
import { Chat_MessageType_Enum, GetEventDocument } from "../generated/graphql";
import { generateEventHandsRaisedKeyName } from "../lib/handRaise";
import { logger } from "../lib/logger";
import { publishAction } from "../rabbitmq/chat/messages";
import type { Action, EventEndedNotification, EventStartedNotification } from "../types/hasura";

gql`
    query GetEvent($id: uuid!) {
        schedule_Event_by_pk(id: $id) {
            id
            startTime
            durationSeconds
            roomId
            name
            item {
                id
                title
            }
            room {
                id
                name
                chatId
            }
            automaticParticipationSurvey
        }
    }
`;

export async function eventStarted(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        assertType<Action<EventStartedNotification>>(req.body);

        const data: Action<EventStartedNotification> = req.body;

        const eventResponse = await gqlClient
            ?.query<GetEventQuery, GetEventQueryVariables>(GetEventDocument, {
                id: data.input.eventId,
            })
            .toPromise();

        if (eventResponse?.data?.schedule_Event_by_pk) {
            const event = eventResponse?.data.schedule_Event_by_pk;
            if (event.room.chatId) {
                const systemId =
                    "EVENT_START:" + event.id + ":" + event.roomId + "@" + new Date(event.startTime).toISOString();
                const redisClient = await redisClientPool.acquire("/http-handlers/chat/eventStarted");
                try {
                    const systemIdsKey = `realtime:chat.${event.room.chatId}.recentSystemIdsSeen`;
                    redisClient.watch(systemIdsKey);
                    const isMember = await redisClientP.sismember(redisClient)(systemIdsKey, systemId);
                    if (isMember === 0) {
                        let multi = redisClient.multi();
                        multi = multi.sadd(systemIdsKey, systemId);
                        multi = multi.expire(systemIdsKey, 60);
                        let proceed = false;
                        try {
                            await promisify(multi.exec.bind(multi))();
                            proceed = true;
                        } catch (e) {
                            // Skip
                        }

                        if (proceed) {
                            await publishAction({
                                op: "INSERT",
                                data: {
                                    chatId: event.room.chatId,
                                    created_at: new Date().toISOString(),
                                    data: {
                                        event: {
                                            id: event.id,
                                            startTime: event.startTime,
                                            durationSeconds: event.durationSeconds,
                                            name: event.name,
                                        },
                                        room: {
                                            id: event.room.id,
                                            name: event.room.name,
                                        },
                                        item: event.item
                                            ? {
                                                  id: event.item.id,
                                                  title: event.item.title,
                                              }
                                            : undefined,
                                    },
                                    isPinned: false,
                                    message: "Event started: " + (event.item ? event.item.title : event.name),
                                    sId: uuidv4(),
                                    senderId: null,
                                    type: Chat_MessageType_Enum.EventStart,
                                    updated_at: new Date().toISOString(),
                                    systemId,
                                },
                            });
                        }
                    }
                } finally {
                    redisClientPool.release("/http-handlers/chat/eventStarted", redisClient);
                }
            }
        }

        res.status(200).send({ ok: true });
    } catch (e) {
        logger.error("Event started: Received incorrect payload", e);
        res.status(500).json({ ok: false });
        return;
    }
}

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

        const eventResponse = await gqlClient
            ?.query<GetEventQuery, GetEventQueryVariables>(GetEventDocument, {
                id: data.input.eventId,
            })
            .toPromise();

        if (eventResponse?.data?.schedule_Event_by_pk) {
            const event = eventResponse?.data.schedule_Event_by_pk;
            if (event.automaticParticipationSurvey && event.room.chatId) {
                const systemId =
                    "PARTICIPATION_SURVEY:" +
                    event.id +
                    ":" +
                    event.roomId +
                    "@" +
                    new Date(Date.parse(event.startTime) + event.durationSeconds * 1000).toISOString();
                const redisClient = await redisClientPool.acquire("/http-handlers/chat/eventEnded");
                try {
                    const systemIdsKey = `realtime:chat.${event.room.chatId}.recentSystemIdsSeen`;
                    redisClient.watch(systemIdsKey);
                    const isMember = await redisClientP.sismember(redisClient)(systemIdsKey, systemId);
                    if (isMember === 0) {
                        let multi = redisClient.multi();
                        multi = multi.sadd(systemIdsKey, systemId);
                        multi = multi.expire(systemIdsKey, 60);
                        let proceed = false;
                        try {
                            await promisify(multi.exec.bind(multi))();
                            proceed = true;
                        } catch {
                            // Skip
                        }
                        if (proceed) {
                            await publishAction({
                                op: "INSERT",
                                data: {
                                    chatId: event.room.chatId,
                                    created_at: new Date().toISOString(),
                                    data: {
                                        event: {
                                            id: event.id,
                                            startTime: event.startTime,
                                            durationSeconds: event.durationSeconds,
                                            name: event.name,
                                        },
                                        room: {
                                            id: event.room.id,
                                            name: event.room.name,
                                        },
                                        item: event.item
                                            ? {
                                                  id: event.item.id,
                                                  title: event.item.title,
                                              }
                                            : undefined,
                                    },
                                    isPinned: false,
                                    message:
                                        "Log your participation in: " + (event.item ? event.item.title : event.name),
                                    sId: uuidv4(),
                                    senderId: null,
                                    type: Chat_MessageType_Enum.ParticipationSurvey,
                                    updated_at: new Date().toISOString(),
                                    systemId,
                                },
                            });
                        }
                    }
                } finally {
                    redisClientPool.release("/http-handlers/chat/eventEnded", redisClient);
                }
            }
        }

        res.status(200).send({ ok: true });
    } catch (error: any) {
        logger.error({ error }, "Event ended: Received incorrect payload");
        res.status(500).json({ ok: false });
        return;
    }
}
