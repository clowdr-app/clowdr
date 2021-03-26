import crypto from "crypto";
import { Socket } from "socket.io";
import { enterPresence, exitAllPresences, exitPresence, presenceChannelName, presenceListKey } from "../lib/presence";
import { redisClient } from "../redis";
import { socketServer } from "../servers/socket-server";

const ALL_SESSION_USER_IDS_KEY = "Presence.SessionAndUserIds";

function invalidateSessions() {
    redisClient.SMEMBERS(ALL_SESSION_USER_IDS_KEY, async (err, sessionListsKeys) => {
        if (err) {
            console.error("Error invalidating sessions", err);
            return;
        }

        if (!sessionListsKeys) {
            return;
        }

        const socketIds = await socketServer.allSockets();
        for (const sessionListsKey of sessionListsKeys) {
            const parts = sessionListsKey.split("¬");
            const sessionId = parts[0];
            const userId = parts[1];
            if (!socketIds.has(sessionId)) {
                console.log("Found dangling session", sessionListsKey);
                try {
                    exitAllPresences(userId, sessionId, (err) => {
                        if (err) {
                            console.error(
                                `Error exiting all presences of dangling session ${sessionId} / ${userId}`,
                                err
                            );
                        } else {
                            redisClient.SREM(ALL_SESSION_USER_IDS_KEY, sessionListsKey);
                        }
                    });
                } catch (e) {
                    console.error(`Error exiting all presences of dangling session ${sessionId} / ${userId}`, e);
                }
            }
        }
    });
}

setInterval(invalidateSessions, 60 * 1000);

function getPageKey(confSlug: string, path: string) {
    const hash = crypto.createHash("sha256");
    hash.write(confSlug, "utf8");
    hash.write(path, "utf8");
    return hash.digest("hex").toLowerCase();
}

export function onEnterPage(conferenceSlug: string, userId: string, socketId: string): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(conferenceSlug, path);
                enterPresence(pageKey, userId, socketId, (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
        } catch (e) {
            console.error(`Error entering presence on socket ${socketId}`, e);
        }
    };
}

export function onLeavePage(conferenceSlug: string, userId: string, socketId: string): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(conferenceSlug, path);
                exitPresence(pageKey, userId, socketId, (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
        } catch (e) {
            console.error(`Error exiting presence on socket ${socketId}`, e);
        }
    };
}

export function onObservePage(
    conferenceSlug: string,
    socketId: string,
    socket: Socket
): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const listId = getPageKey(conferenceSlug, path);
                const listKey = presenceListKey(listId);
                const chan = presenceChannelName(listId);
                // console.log(`${userId} observed ${listId}`);
                await socket.join(chan);

                redisClient.smembers(listKey, (err, userIds) => {
                    if (err) {
                        throw err;
                    }

                    // console.log(`Emitting presences for ${path} to ${userId} / ${socketId}`, userIds);
                    socket.emit("presences", { listId, userIds });
                });
            }
        } catch (e) {
            console.error(`Error observing presence on socket ${socketId}`, e);
        }
    };
}

export function onUnobservePage(
    conferenceSlug: string,
    socketId: string,
    socket: Socket
): (path: string) => Promise<void> {
    return async (path) => {
        try {
            if (typeof path === "string") {
                const pageKey = getPageKey(conferenceSlug, path);
                const chan = presenceChannelName(pageKey);
                // console.log(`${userId} unobserved ${pageKey}`);
                await socket.leave(chan);
            }
        } catch (e) {
            console.error(`Error unobserving presence on socket ${socketId}`, e);
        }
    };
}

export function onConnect(userId: string, socketId: string): void {
    // Removed periodically by `invalidateSessions`
    redisClient.SADD(ALL_SESSION_USER_IDS_KEY, `${socketId}¬${userId}`);
}

export function onDisconnect(socketId: string, userId: string): void {
    try {
        exitAllPresences(userId, socketId, (err) => {
            if (err) {
                throw err;
            }
        });
    } catch (e) {
        console.error(`Error exiting all presences on socket ${socketId}`, e);
    }
}
