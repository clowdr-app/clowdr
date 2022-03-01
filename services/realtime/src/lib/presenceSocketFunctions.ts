import { redisClientPool, redlock } from "@midspace/component-clients/redis";
import type { RedisClient } from "redis";
import { socketServer } from "../servers/socket-server";
import { logger } from "./logger";
import {
    addUserSession,
    presenceChannelName,
    presenceListKey,
    removeUserSession,
    sessionListsKey,
    userSessionsKey,
} from "./presence";

export function enterPresence(
    _redisClient: RedisClient | null,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    // logger.info(`${userId} / ${sessionId} entering ${listId}`);

    function internal(redisClient: RedisClient, cb: (err: Error | null) => void) {
        addUserSession(redisClient, listId, userId, sessionId, (err) => {
            if (err) {
                cb(err);
                return;
            }

            const listKey = presenceListKey(listId);
            redisClient.sadd(listKey, userId, (err, v) => {
                if (err) {
                    cb(err);
                    return;
                }

                if (v > 0) {
                    // logger.info(`${userId} / ${sessionId} entered ${listId}`);
                    const chan = presenceChannelName(listId);
                    socketServer.in(chan).emit("entered", { listId, userId });
                }
                // else {
                //     logger.info(`${userId} / ${sessionId} re-entered ${listId}`);
                // }

                cb(null);
                return;
            });
        });
    }

    if (_redisClient) {
        internal(_redisClient, cb);
    } else {
        redisClientPool
            .acquire("lib/presence/enterPresence")
            .then((redisClient) => {
                internal(redisClient, (err) => {
                    redisClientPool.release("lib/presence/enterPresence", redisClient);
                    cb(err);
                    return;
                });
            })
            .catch(cb);
    }
}

export function exitPresence(
    _redisClient: RedisClient | null,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    // logger.info(`${userId} / ${sessionId} exiting ${listId}`);

    function internal(redisClient: RedisClient, cb: (err: Error | null) => void) {
        const listKey = presenceListKey(listId);
        const userKey = userSessionsKey(listId, userId);
        removeUserSession(redisClient, listId, userId, sessionId, (err) => {
            if (err) {
                cb(err);
                return;
            }

            function attempt(attemptNum: number) {
                if (attemptNum > 0) {
                    redisClient.watch(userKey, (watchErr) => {
                        if (watchErr) {
                            cb(watchErr);
                            return;
                        }

                        redisClient.scard(userKey, (getErr, sessionCount) => {
                            if (getErr) {
                                redisClient.unwatch((unwatchErr) => {
                                    cb(unwatchErr ?? getErr);
                                    return;
                                });
                                return;
                            }

                            if (sessionCount === 0) {
                                // Attempt to remove user from the presence list
                                redisClient
                                    .multi()
                                    .srem(listKey, userId)
                                    .exec((execErr, results) => {
                                        if (execErr) {
                                            attempt(attemptNum - 1);
                                            return;
                                        }

                                        if (!results) {
                                            cb(null);
                                            return;
                                        }

                                        const [numRemoved] = results;

                                        if (numRemoved > 0) {
                                            // logger.info(`${userId} / ${sessionId} left ${listId}`);
                                            const chan = presenceChannelName(listId);
                                            socketServer.in(chan).emit("left", { listId, userId });
                                        }

                                        cb(null);
                                    });
                            } else {
                                // Validate that the session count hasn't changed
                                redisClient.multi().exec((execErr) => {
                                    if (execErr) {
                                        attempt(attemptNum - 1);
                                    } else {
                                        cb(null);
                                    }
                                });
                            }
                        });
                    });
                } else {
                    cb(
                        new Error(
                            `Ran out of attempts to perform exit presence transaction! ${listId}, ${userId}, ${sessionId}`
                        )
                    );
                    return;
                }
            }
            attempt(5);
        });
    }

    if (_redisClient) {
        internal(_redisClient, cb);
    } else {
        redisClientPool
            .acquire("lib/presence/exitPresence")
            .then((redisClient) => {
                internal(redisClient, (err) => {
                    redisClientPool.release("lib/presence/exitPresence", redisClient);
                    cb(err);
                    return;
                });
            })
            .catch(cb);
    }
}

export function exitAllPresences(
    redisClient: RedisClient,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    logger.info(`Begin ${userId} exiting all presences for session ${sessionId}`);

    const listsKey = sessionListsKey(sessionId);

    redlock.lock(`locks:${listsKey}`, 1000, (err, listsKeyLock) => {
        if (err) {
            cb(err);
            return;
        }

        redisClient.SMEMBERS(listsKey, (err, listIds) => {
            listsKeyLock?.unlock((err) => {
                if (err) {
                    logger.error({ err }, `Error unlocking ${listsKey}`);
                }
            });

            if (err) {
                cb(err);
                return;
            }

            logger.info(`${userId} exiting all presences for session ${sessionId}:`, listIds);

            const accumulatedErrors: string[] = [];
            const cleanupFunctionChain = listIds.reduce<() => void>(
                (cb, listId) => {
                    return () => {
                        exitPresence(redisClient, listId, userId, sessionId, (err) => {
                            if (err) {
                                accumulatedErrors.push(
                                    `Error exiting presence for ${listId} / ${userId} / ${sessionId}: ${err.toString()}`
                                );
                            }

                            cb();
                            return;
                        });
                    };
                },
                () => {
                    /* EMPTY */
                }
            );
            cleanupFunctionChain();

            if (accumulatedErrors.length > 0) {
                const fullError = accumulatedErrors.reduce((acc, x) => `${acc}\n\n${x}`, "").substr(2);
                cb(new Error(fullError));
                return;
            } else {
                cb(null);
                return;
            }
        });
    });
}
