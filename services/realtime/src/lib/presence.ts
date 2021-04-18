import { redisClient, redlock } from "../redis";
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

function addUserSession(listId: string, userId: string, sessionId: string, cb: (err: Error | null) => void) {
    const sessionsKey = userSessionsKey(listId, userId);
    const listsKey = sessionListsKey(sessionId);

    redlock.lock(`locks:${sessionsKey}`, 1000, (err, sessionsKeyLock) => {
        if (err) {
            cb(err);
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
            }

            redisClient.sadd(sessionsKey, sessionId, (err) => {
                if (err) {
                    unlock();
                    cb(err);
                }

                redisClient.sadd(listsKey, listId, (err) => {
                    unlock();
                    cb(err);
                });
            });
        });
    });
}

function removeUserSession(listId: string, userId: string, sessionId: string, cb: (err: Error | null) => void) {
    const sessionsKey = userSessionsKey(listId, userId);
    const listsKey = sessionListsKey(sessionId);
    redlock.lock(`locks:${sessionsKey}`, 1000, (err, sessionsKeyLock) => {
        if (err) {
            cb(err);
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
            }

            redisClient.srem(sessionsKey, sessionId, (err) => {
                if (err) {
                    unlock();
                    cb(err);
                }

                redisClient.srem(listsKey, listId, (err) => {
                    unlock();
                    cb(err);
                });
            });
        });
    });
}

export function enterPresence(
    listId: string,
    userId: string,
    sessionId: string,
    cb: (err: Error | null) => void
): void {
    // console.info(`${userId} / ${sessionId} entering ${listId}`);

    addUserSession(listId, userId, sessionId, (err) => {
        if (err) {
            cb(err);
        }

        const listKey = presenceListKey(listId);
        redisClient.sadd(listKey, userId, (err, v) => {
            if (err) {
                cb(err);
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
        });
    });
}

export function exitPresence(listId: string, userId: string, sessionId: string, cb: (err: Error | null) => void): void {
    // console.info(`${userId} / ${sessionId} exiting ${listId}`);

    const listKey = presenceListKey(listId);
    const userKey = userSessionsKey(listId, userId);
    removeUserSession(listId, userId, sessionId, (err) => {
        if (err) {
            cb(err);
        }

        function attempt(attemptNum: number) {
            if (attemptNum > 0) {
                redisClient.watch(userKey, (watchErr) => {
                    if (watchErr) {
                        cb(watchErr);
                    }

                    redisClient.scard(userKey, (getErr, sessionCount) => {
                        if (getErr) {
                            cb(getErr);
                        }

                        if (sessionCount === 0) {
                            // Attempt to remove user from the presence list
                            redisClient
                                .multi()
                                .srem(listKey, userId)
                                .exec((execErr, results) => {
                                    if (execErr) {
                                        attempt(attemptNum - 1);
                                    }

                                    if (!results) {
                                        return;
                                    }

                                    const [numRemoved] = results;

                                    if (numRemoved > 0) {
                                        // console.info(`${userId} / ${sessionId} left ${listId}`);
                                        const chan = presenceChannelName(listId);
                                        socketServer.in(chan).emit("left", { listId, userId });
                                    }
                                });
                        } else {
                            // Validate that the session count hasn't changed
                            redisClient.multi().exec((execErr) => {
                                if (execErr) {
                                    attempt(attemptNum - 1);
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
            }
        }
        attempt(5);
    });
}

export function exitAllPresences(userId: string, sessionId: string, cb: (err: Error | null) => void): void {
    console.info(`Begin ${userId} exiting all presences for session ${sessionId}`);

    const listsKey = sessionListsKey(sessionId);

    redlock.lock(`locks:${listsKey}`, 1000, (err, listsKeyLock) => {
        if (err) {
            cb(err);
        }

        redisClient.SMEMBERS(listsKey, (err, listIds) => {
            listsKeyLock?.unlock((err) => {
                if (err) {
                    console.error(`Error unlocking ${listsKey}`, err);
                }
            });

            if (err) {
                cb(err);
            }

            console.info(`${userId} exiting all presences for session ${sessionId}:`, listIds);

            const accumulatedErrors: string[] = [];
            const cleanupFunctionChain = listIds.reduce<() => void>(
                (cb, listId) => {
                    return () => {
                        exitPresence(listId, userId, sessionId, (err) => {
                            if (err) {
                                accumulatedErrors.push(
                                    `Error exiting presence for ${listId} / ${userId} / ${sessionId}: ${err.toString()}`
                                );
                            }

                            cb();
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
            } else {
                cb(null);
            }
        });
    });
}
