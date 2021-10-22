import type { RedisClient } from "redis";
import { redisClientPool, redlock } from "../redis";
import { socketServer } from "../servers/socket-server";

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
function userSessionsKey(listId: string, userId: string) {
    return `PresenceList:${listId}:UserSessions:${userId}`;
}

/**
 * A Session List contains the list ids in which this session is currently present.
 */
function sessionListsKey(sessionId: string) {
    return `SessionLists:${sessionId}`;
}

function addUserSession(
    redisClient: RedisClient,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
) {
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
                        console.error(`Error unlocking ${listsKey}`, err);
                    }
                });
                sessionsKeyLock?.unlock((err) => {
                    if (err) {
                        console.error(`Error unlocking ${sessionsKey}`, err);
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

function removeUserSession(
    redisClient: RedisClient,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
) {
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
                        console.error(`Error unlocking ${listsKey}`, err);
                    }
                });
                sessionsKeyLock?.unlock((err) => {
                    if (err) {
                        console.error(`Error unlocking ${sessionsKey}`, err);
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

export function enterPresence(
    _redisClient: RedisClient | null,
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    // console.info(`${userId} / ${sessionId} entering ${listId}`);

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
                    // console.info(`${userId} / ${sessionId} entered ${listId}`);
                    const chan = presenceChannelName(listId);
                    socketServer.in(chan).emit("entered", { listId, userId });
                }
                // else {
                //     console.info(`${userId} / ${sessionId} re-entered ${listId}`);
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
    // console.info(`${userId} / ${sessionId} exiting ${listId}`);

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
                                            // console.info(`${userId} / ${sessionId} left ${listId}`);
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
    console.info(`Begin ${userId} exiting all presences for session ${sessionId}`);

    const listsKey = sessionListsKey(sessionId);

    redlock.lock(`locks:${listsKey}`, 1000, (err, listsKeyLock) => {
        if (err) {
            cb(err);
            return;
        }

        redisClient.SMEMBERS(listsKey, (err, listIds) => {
            listsKeyLock?.unlock((err) => {
                if (err) {
                    console.error(`Error unlocking ${listsKey}`, err);
                }
            });

            if (err) {
                cb(err);
                return;
            }

            console.info(`${userId} exiting all presences for session ${sessionId}:`, listIds);

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
