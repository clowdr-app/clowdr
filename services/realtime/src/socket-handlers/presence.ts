import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { Callback, RedisClient } from "redis";
import type { Socket } from "socket.io";
import { promisify } from "util";
import { logger } from "../lib/logger";
import { canAccessRoom } from "../lib/permissions";
import {
    extractPresenceListIdFromKey,
    getVerifiedPageKey,
    presenceChannelName,
    presenceListKey,
} from "../lib/presence";
import { socketServer } from "../servers/socket-server";

function getPageKey(path: string): string | undefined {
    // TODO: Custom domains?
    // TODO: Permission to view path?
    if (path.startsWith("/conference/")) {
        const confSlug = path.split("/")[2];
        return getVerifiedPageKey(confSlug, path);
    } else {
        return getVerifiedPageKey("/<<NO-CONF>>/", path);
    }
}

export function onPagePresence(userId: string, socketId: string): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const listId = getPageKey(path);
                if (listId) {
                    await addToPresenceList(listId, userId);
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error recording page presence on socket ${socketId}`);
        }
    };
}

export function onPageUnpresence(userId: string, socketId: string): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const listId = getPageKey(path);
                if (listId) {
                    await removeFromPresenceList(listId, userId);
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error recording page unpresence on socket ${socketId}`);
        }
    };
}

export function onConferencePresence(userId: string, socketId: string): (slug: string) => Promise<void> {
    return async (slug) => {
        try {
            if (typeof slug === "string") {
                await addToPresenceList(slug, userId);
            }
        } catch (error: any) {
            logger.error({ error }, `Error recording conference presence on socket ${socketId}`);
        }
    };
}

async function addToPresenceList(listId: string, userId: string) {
    const listKey = presenceListKey(listId);

    const redisClient = await redisClientPool.acquire("socket-handlers/presence/addToPresenceList");

    try {
        const addedCount = await redisClientP.zadd(redisClient)(listKey, Date.now(), userId);
        if (addedCount > 0) {
            const chan = presenceChannelName(listId);
            socketServer.in(chan).emit("entered", { listId, userId });
        }
    } finally {
        await redisClientPool.release("socket-handlers/presence/addToPresenceList", redisClient);
    }
}

async function removeFromPresenceList(listId: string, userId: string) {
    const listKey = presenceListKey(listId);

    const redisClient = await redisClientPool.acquire("socket-handlers/presence/removeFromPresenceList");

    try {
        const removeCount = await redisClientP.zrem(redisClient)(listKey, userId);
        if (removeCount > 0) {
            const chan = presenceChannelName(listId);
            socketServer.in(chan).emit("left", { listId, userId });
        }
    } finally {
        await redisClientPool.release("socket-handlers/presence/removeFromPresenceList", redisClient);
    }
}

export async function maintainPresenceList(redisClient: RedisClient, listKey: string) {
    const listId = extractPresenceListIdFromKey(listKey);
    const chan = presenceChannelName(listId);

    const lowerLimit = Number.NEGATIVE_INFINITY;
    const upperLimit = Date.now() - 2 * 60 * 1000;

    let discard = true;
    let multi = redisClient.multi();
    try {
        multi = multi.zrangebyscore(listKey, lowerLimit, upperLimit);
        multi = multi.zremrangebyscore(listKey, lowerLimit, upperLimit);
        discard = false;
        const results = await promisify((cb: Callback<any[]>) => multi.exec(cb))();
        const userIds = results[0];
        for (const userId of userIds) {
            socketServer.in(chan).emit("left", { listId, userId });
        }
    } finally {
        if (discard) {
            await redisClientP.discard(redisClient)();
        }
    }
}

export function onObservePage(socketId: string, socket: Socket): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const listId = getPageKey(path);
                if (listId) {
                    const listKey = presenceListKey(listId);
                    const chan = presenceChannelName(listId);
                    // logger.info(`${userId} observed ${listId}`);
                    await socket.join(chan);

                    const redisClient = await redisClientPool.acquire("socket-handlers/presence/onObservePage");
                    redisClient.zrange(listKey, 0, -1, (err, userIds) => {
                        redisClientPool.release("socket-handlers/presence/onObservePage", redisClient);

                        if (err) {
                            throw err;
                        }

                        // logger.info(`Emitting presences for ${path} to ${userId} / ${socketId}`, userIds);
                        socket.emit("presences", { listId, userIds });
                    });
                } else {
                    logger.info("User is not authorized to observe path", path);
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error observing presence on socket ${socketId}`);
        }
    };
}

export function onUnobservePage(socketId: string, socket: Socket): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(path);
                if (pageKey) {
                    const chan = presenceChannelName(pageKey);
                    // logger.info(`${userId} unobserved ${pageKey}`);
                    await socket.leave(chan);
                } else {
                    logger.info("User is not authorized to unobserve path", path);
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error unobserving presence on socket ${socketId}`);
        }
    };
}

export function onConnect(_userId: string, _socketId: string): void {
    // Do nothing
}

export function onDisconnect(_socketId: string, _userId: string): void {
    // Do nothing
}

export function onRoomParticipants(userId: string, socket: Socket): (data: any) => Promise<void> {
    return async (data) => {
        let registrantIds: string[] = [];

        try {
            if (
                data &&
                typeof data === "object" &&
                typeof data.roomId === "string" &&
                typeof data.conferenceId === "string"
            ) {
                const accessAllowed = await canAccessRoom(userId, data.conferenceId, data.roomId);

                if (accessAllowed) {
                    const redisClient = await redisClientPool.acquire("socket-handlers/presence/onRoomParticipants");
                    try {
                        registrantIds = await redisClientP.zmembers(redisClient)(`RoomParticipants:${data.roomId}`);
                    } finally {
                        await redisClientPool.release("socket-handlers/presence/onRoomParticipants", redisClient);
                    }
                } else {
                    logger.info({ data }, "User is not authorized to list participants of room");
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error listing room participants on socket ${socket.id}`);
        } finally {
            socket.emit("room-participants", { roomId: data.roomId, registrantIds });
        }
    };
}
