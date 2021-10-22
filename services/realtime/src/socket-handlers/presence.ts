import crypto from "crypto";
import type { Socket } from "socket.io";
import { enterPresence, exitAllPresences, exitPresence, presenceChannelName, presenceListKey } from "../lib/presence";
import { redisClientPool } from "../redis";
import { socketServer } from "../servers/socket-server";

const ALL_SESSION_USER_IDS_KEY = "Presence.SessionAndUserIds";

export function invalidateSessions(): void {
    try {
        redisClientPool.acquire("socket-handlers/presence/invalidateSessions").then((redisClient) => {
            redisClient.SMEMBERS(ALL_SESSION_USER_IDS_KEY, async (err, sessionListsKeys) => {
                if (err) {
                    redisClientPool.release("socket-handlers/presence/invalidateSessions", redisClient);
                    console.error("Error invalidating sessions", err);
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
                        console.log("Found dangling session", sessionListsKey);
                        exitsRequired++;
                    }
                }

                for (const sessionListsKey of sessionListsKeys) {
                    const parts = sessionListsKey.split("¬");
                    const sessionId = parts[0];
                    const userId = parts[1];
                    if (!socketIds.has(sessionId)) {
                        console.log("Found dangling session", sessionListsKey);
                        try {
                            exitAllPresences(redisClient, userId, sessionId, (err) => {
                                try {
                                    if (err) {
                                        console.error(
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
                        } catch (e) {
                            console.error(
                                `Error exiting all presences of dangling session ${sessionId} / ${userId}`,
                                e
                            );
                        }
                    }
                }

                if (exitsRequired === 0) {
                    redisClientPool.release("socket-handlers/presence/invalidateSessions", redisClient);
                }
            });
        });
    } catch (e) {
        console.warn("Could not list all sockets to try to exit presences", e);
    }
}

function getPageKey(confSlugs: string[], path: string): string | undefined {
    if (path.startsWith("/conference/")) {
        const confSlug = path.split("/")[2];
        if (confSlugs.includes(confSlug)) {
            const hash = crypto.createHash("sha256");
            hash.write(confSlug, "utf8");
            hash.write(path, "utf8");
            return hash.digest("hex").toLowerCase();
        } else {
            return undefined;
        }
    } else {
        const hash = crypto.createHash("sha256");
        hash.write("/<<NO-CONF>>/", "utf8");
        hash.write(path, "utf8");
        return hash.digest("hex").toLowerCase();
    }
}

export function onEnterPage(
    conferenceSlugs: string[],
    userId: string,
    socketId: string
): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(conferenceSlugs, path);
                if (pageKey) {
                    enterPresence(null, pageKey, userId, socketId, (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                } else {
                    console.info("User is not authorized to enter path", path);
                }
            }
        } catch (e) {
            console.error(`Error entering presence on socket ${socketId}`, e);
        }
    };
}

export function onLeavePage(
    conferenceSlugs: string[],
    userId: string,
    socketId: string
): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(conferenceSlugs, path);
                if (pageKey) {
                    exitPresence(null, pageKey, userId, socketId, (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                } else {
                    console.info("User is not authorized to exit path", path);
                }
            }
        } catch (e) {
            console.error(`Error exiting presence on socket ${socketId}`, e);
        }
    };
}

export function onObservePage(
    conferenceSlugs: string[],
    socketId: string,
    socket: Socket
): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const listId = getPageKey(conferenceSlugs, path);
                if (listId) {
                    const listKey = presenceListKey(listId);
                    const chan = presenceChannelName(listId);
                    // console.log(`${userId} observed ${listId}`);
                    await socket.join(chan);

                    const redisClient = await redisClientPool.acquire("socket-handlers/presence/onObservePage");
                    redisClient.smembers(listKey, (err, userIds) => {
                        redisClientPool.release("socket-handlers/presence/onObservePage", redisClient);

                        if (err) {
                            throw err;
                        }

                        // console.log(`Emitting presences for ${path} to ${userId} / ${socketId}`, userIds);
                        socket.emit("presences", { listId, userIds });
                    });
                } else {
                    console.info("User is not authorized to observe path", path);
                }
            }
        } catch (e) {
            console.error(`Error observing presence on socket ${socketId}`, e);
        }
    };
}

export function onUnobservePage(
    conferenceSlugs: string[],
    socketId: string,
    socket: Socket
): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(conferenceSlugs, path);
                if (pageKey) {
                    const chan = presenceChannelName(pageKey);
                    // console.log(`${userId} unobserved ${pageKey}`);
                    await socket.leave(chan);
                } else {
                    console.info("User is not authorized to unobserve path", path);
                }
            }
        } catch (e) {
            console.error(`Error unobserving presence on socket ${socketId}`, e);
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
            console.error(`Error exiting all presences on socket ${socketId}`, err);
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
            } catch (e) {
                console.error(`Error exiting all presences on socket ${socketId}`, e);
            }
        })
        .catch((err) => {
            console.error(`Error exiting all presences on socket ${socketId}`, err);
        });
}
