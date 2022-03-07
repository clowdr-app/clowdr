import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { Socket } from "socket.io";
import { logger } from "../lib/logger";
import { canAccessRoom } from "../lib/permissions";
import { getVerifiedPageKey, presenceChannelName, presenceListKey } from "../lib/presence";
import { enterPresence, exitAllPresences, exitPresence } from "../lib/presenceSocketFunctions";
import { socketServer } from "../servers/socket-server";

const ALL_SESSION_USER_IDS_KEY = "Presence.SessionAndUserIds";

export function invalidateSessions(): void {
    try {
        redisClientPool.acquire("socket-handlers/presence/invalidateSessions").then((redisClient) => {
            redisClient.SMEMBERS(ALL_SESSION_USER_IDS_KEY, async (err, sessionListsKeys) => {
                if (err) {
                    redisClientPool.release("socket-handlers/presence/invalidateSessions", redisClient);
                    logger.error("Error invalidating sessions", err);
                    return;
                }

                if (!sessionListsKeys) {
                    redisClientPool.release("socket-handlers/presence/invalidateSessions", redisClient);
                    return;
                }

                const socketIds = await socketServer.allSockets();
                let exitsRequired = 0;
                let exitsSeen = 0;
                for (const sessionListsKey of sessionListsKeys) {
                    const parts = sessionListsKey.split("¬");
                    const sessionId = parts[0];
                    if (!socketIds.has(sessionId)) {
                        logger.info("Found dangling session", sessionListsKey);
                        exitsRequired++;
                    }
                }

                for (const sessionListsKey of sessionListsKeys) {
                    const parts = sessionListsKey.split("¬");
                    const sessionId = parts[0];
                    const userId = parts[1];
                    if (!socketIds.has(sessionId)) {
                        logger.info("Found dangling session", sessionListsKey);
                        try {
                            exitAllPresences(redisClient, userId, sessionId, (err) => {
                                try {
                                    if (err) {
                                        logger.error(
                                            `Error exiting all presences of dangling session ${sessionId} / ${userId}`,
                                            err
                                        );
                                    } else {
                                        redisClient.SREM(ALL_SESSION_USER_IDS_KEY, sessionListsKey);
                                    }
                                } finally {
                                    exitsSeen++;
                                    if (exitsSeen === exitsRequired) {
                                        redisClientPool.release(
                                            "socket-handlers/presence/invalidateSessions",
                                            redisClient
                                        );
                                    }
                                }
                            });
                        } catch (error: any) {
                            logger.error(
                                { error },
                                `Error exiting all presences of dangling session ${sessionId} / ${userId}`
                            );
                        }
                    }
                }

                if (exitsRequired === 0) {
                    redisClientPool.release("socket-handlers/presence/invalidateSessions", redisClient);
                }
            });
        });
    } catch (error: any) {
        logger.warn({ error }, "Could not list all sockets to try to exit presences");
    }
}

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

export function onEnterPage(userId: string, socketId: string): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(path);
                if (pageKey) {
                    enterPresence(null, pageKey, userId, socketId, (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                } else {
                    logger.info("User is not authorized to enter path", path);
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error entering presence on socket ${socketId}`);
        }
    };
}

export function onLeavePage(userId: string, socketId: string): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(path);
                if (pageKey) {
                    exitPresence(null, pageKey, userId, socketId, (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                } else {
                    logger.info("User is not authorized to exit path", path);
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Error exiting presence on socket ${socketId}`);
        }
    };
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
                    redisClient.smembers(listKey, (err, userIds) => {
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

export function onConnect(userId: string, socketId: string): void {
    // Removed periodically by `invalidateSessions`
    redisClientPool
        .acquire("socket-handlers/presence/onConnect")
        .then((redisClient) => {
            try {
                redisClient.SADD(ALL_SESSION_USER_IDS_KEY, `${socketId}¬${userId}`);
            } finally {
                redisClientPool.release("socket-handlers/presence/onConnect", redisClient);
            }
        })
        .catch((err) => {
            logger.error({ err }, `Error exiting all presences on socket ${socketId}`);
        });
}

export function onDisconnect(socketId: string, userId: string): void {
    redisClientPool
        .acquire("socket-handlers/presence/onDisconnect")
        .then((redisClient) => {
            try {
                exitAllPresences(redisClient, userId, socketId, (err) => {
                    redisClientPool.release("socket-handlers/presence/onDisconnect", redisClient);

                    if (err) {
                        throw err;
                    }
                });
            } catch (error: any) {
                logger.error({ error }, `Error exiting all presences on socket ${socketId}`);
            }
        })
        .catch((err) => {
            logger.error({ err }, `Error exiting all presences on socket ${socketId}`);
        });
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
