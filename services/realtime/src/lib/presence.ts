import { redlock } from "@midspace/component-clients/redis";
import crypto from "crypto";
import type { RedisClient } from "redis";
import { logger } from "./logger";

/**
 * A Presence List contains the user ids present for that list.
 */
export function presenceListKey(listId: string): string {
    return `PresenceList:${listId}`;
}

/**
 * A Presence Channel is the pub/sub channel for the associated presence list.
 */
export function presenceChannelName(listId: string): string {
    return `PresenceQueue:${listId}`;
}

/**
 * A User Sessions list contains the session ids for a particular user present
 * in the associated Presence List.
 */
export function userSessionsKey(listId: string, userId: string): string {
    return `PresenceList:${listId}:UserSessions:${userId}`;
}

/**
 * A Session List contains the list ids in which this session is currently present.
 */
export function sessionListsKey(sessionId: string): string {
    return `SessionLists:${sessionId}`;
}

export function addUserSession(
    redisClient: RedisClient,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    const sessionsKey = userSessionsKey(listId, userId);
    const listsKey = sessionListsKey(sessionId);

    redlock.lock(`locks:${sessionsKey}`, 1000, (err, sessionsKeyLock) => {
        if (err) {
            cb(err);
            return;
        }

        redlock.lock(`locks:${listsKey}`, 1000, (err, listsKeyLock) => {
            function unlock() {
                listsKeyLock?.unlock((err) => {
                    if (err) {
                        logger.error({ err }, `Error unlocking ${listsKey}`);
                    }
                });
                sessionsKeyLock?.unlock((err) => {
                    if (err) {
                        logger.error({ err }, `Error unlocking ${sessionsKey}`);
                    }
                });
            }

            if (err) {
                unlock();
                cb(err);
                return;
            }

            redisClient.sadd(sessionsKey, sessionId, (err) => {
                if (err) {
                    unlock();
                    cb(err);
                    return;
                }

                redisClient.sadd(listsKey, listId, (err) => {
                    unlock();
                    cb(err);
                    return;
                });
            });
        });
    });
}

export function removeUserSession(
    redisClient: RedisClient,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    const sessionsKey = userSessionsKey(listId, userId);
    const listsKey = sessionListsKey(sessionId);
    redlock.lock(`locks:${sessionsKey}`, 1000, (err, sessionsKeyLock) => {
        if (err) {
            cb(err);
            return;
        }

        redlock.lock(`locks:${listsKey}`, 1000, (err, listsKeyLock) => {
            function unlock() {
                listsKeyLock?.unlock((err) => {
                    if (err) {
                        logger.error({ err }, `Error unlocking ${listsKey}`);
                    }
                });
                sessionsKeyLock?.unlock((err) => {
                    if (err) {
                        logger.error({ err }, `Error unlocking ${sessionsKey}`);
                    }
                });
            }

            if (err) {
                unlock();
                cb(err);
                return;
            }

            redisClient.srem(sessionsKey, sessionId, (err) => {
                if (err) {
                    unlock();
                    cb(err);
                    return;
                }

                redisClient.srem(listsKey, listId, (err) => {
                    unlock();
                    cb(err);
                    return;
                });
            });
        });
    });
}

export function getVerifiedPageKey(confSlug: string, path: string): string {
    const hash = crypto.createHash("sha256");
    hash.write(confSlug, "utf8");
    hash.write(path, "utf8");
    return hash.digest("hex").toLowerCase();
}
