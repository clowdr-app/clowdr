import assert from "assert";
import crypto from "crypto";
import express from "express";
import jwksRsa from "jwks-rsa";
import redis from "redis";
import socketIO, { Socket } from "socket.io";
import { createAdapter } from "socket.io-redis";
import { promisify } from "util";
import { authorize } from "./authorize";

assert(process.env.REDIS_URL, "REDIS_URL env var not defined.");
assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;

function getPageKey(confSlug: string, path: string) {
    const hash = crypto.createHash("sha256");
    hash.write(confSlug, "utf8");
    hash.write(path, "utf8");
    return hash.digest("hex").toLowerCase();
}

/**
 * A Presence List contains the user ids present for that list.
 */
function presenceListKey(listId: string) {
    return `PresenceList:${listId}`;
}

/**
 * A Presence Channel is the pub/sub channel for the associated presence list.
 */
function presenceChannelName(listId: string) {
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

const jwksClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 1,
    jwksUri: `https://${process.env.AUTH0_API_DOMAIN}/.well-known/jwks.json`,
});

const INDEX = "/resources/index.html";
const server = express();
server.post("/flush", (req, res) => {
    if (process.env.SECRET_FOR_FLUSHING) {
        const providedSecret = req.query["secret"] ?? req.headers["x-hasura-presence-flush-secret"];
        if (process.env.SECRET_FOR_FLUSHING === providedSecret) {
            redisClient.flushall((err, reply) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({ ok: reply });
                }
            });
        } else {
            res.status(403).send("Secret mismatch");
        }
    } else {
        res.status(403).send("No secret configured");
    }
});
server.post("/summary", async (req, res) => {
    if (process.env.SECRET_FOR_SUMMARY) {
        const providedSecret = req.query["secret"] ?? req.headers["x-hasura-presence-summary-secret"];
        if (process.env.SECRET_FOR_SUMMARY === providedSecret) {
            const basePresenceListKey = presenceListKey("");

            const scan = promisify<(...opts: string[]) => Promise<[string, string[]]>>(
                (redisClient.scan as unknown) as any
            ).bind(redisClient);
            const smembers = promisify<(...opts: string[]) => Promise<string[]>>(
                (redisClient.smembers as unknown) as any
            ).bind(redisClient);
            const scanAll = async (pattern: string) => {
                const found = [];
                let cursor = "0";

                do {
                    const reply = await scan(cursor, "MATCH", pattern);

                    cursor = reply[0];
                    found.push(...reply[1]);
                } while (cursor !== "0");

                return found;
            };

            try {
                const keys = await scanAll(`${basePresenceListKey}*`);
                const interestingKeys = keys.filter((key) => key.lastIndexOf(":") === basePresenceListKey.length - 1);
                const results = await Promise.all(
                    interestingKeys.map(async (key) => ({ key, userIds: await smembers(key) }))
                );
                const userIds = new Set<string>();
                for (const result of results) {
                    for (const userId of result.userIds) {
                        userIds.add(userId);
                    }
                }

                res.status(200).send({
                    total_unique_tabs: results.reduce((acc, x) => acc + x.userIds.length, 0),
                    total_unique_user_ids: userIds.size,
                    pages: results.reduce(
                        (acc, x) => ({
                            ...acc,
                            [x.key]: x.userIds.length,
                        }),
                        {}
                    ),
                });
            } catch (e) {
                res.status(500).send(e);
            }
        } else {
            res.status(403).send("Secret mismatch");
        }
    } else {
        res.status(403).send("No secret configured");
    }
});
server.use((_req, res) => res.sendFile(INDEX, { root: __dirname }));
const serverListening = server.listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = new socketIO.Server(serverListening, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
    transports: ["websocket"],
});
const redisPubClient = redis.createClient(process.env.REDIS_URL, {});
const redisSubClient = redisPubClient.duplicate();
const redisClient = redisPubClient.duplicate();
io.adapter(createAdapter({ pubClient: redisPubClient, subClient: redisSubClient, key: process.env.REDIS_KEY }));

io.use(
    authorize({
        secret: async (token) => {
            if (token && typeof token !== "string") {
                const key = await jwksClient.getSigningKeyAsync(token.header.kid);
                return key.getPublicKey();
            }
            return "";
        },
        algorithms: ["RS256"],
    })
);

function addUserSession(listId: string, userId: string, sessionId: string) {
    const sessionsKey = userSessionsKey(listId, userId);
    const listsKey = sessionListsKey(sessionId);
    redisClient.sadd(sessionsKey, sessionId);
    redisClient.sadd(listsKey, listId);
}

function removeUserSession(listId: string, userId: string, sessionId: string, cb: (err: Error | null) => void) {
    const sessionsKey = userSessionsKey(listId, userId);
    const listsKey = sessionListsKey(sessionId);
    redisClient.srem(sessionsKey, sessionId, (err) => {
        if (err) {
            throw err;
        }

        redisClient.srem(listsKey, listId, cb);
    });
}

function enterPresence(listId: string, userId: string, sessionId: string) {
    addUserSession(listId, userId, sessionId);
    const listKey = presenceListKey(listId);
    redisClient.sadd(listKey, userId, (err, v) => {
        if (err) {
            throw err;
        }

        if (v > 0) {
            // console.log(`${userId} entered ${listId}`);
            const chan = presenceChannelName(listId);
            io.in(chan).emit("entered", { listId, userId });
        } else {
            // console.log(`${userId} re-entered ${listId}`);
        }
    });
}

function exitPresence(listId: string, userId: string, sessionId: string) {
    const listKey = presenceListKey(listId);
    const userKey = userSessionsKey(listId, userId);
    removeUserSession(listId, userId, sessionId, (err) => {
        if (err) {
            throw err;
        }

        function attempt(attemptNum: number) {
            if (attemptNum > 0) {
                redisClient.watch(userKey, (watchErr) => {
                    if (watchErr) {
                        throw watchErr;
                    }

                    redisClient.scard(userKey, (getErr, sessionCount) => {
                        if (getErr) {
                            throw getErr;
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
                                        // console.log(`${userId} left ${listId}`);
                                        const chan = presenceChannelName(listId);
                                        io.in(chan).emit("left", { listId, userId });
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
                throw new Error(
                    `Ran out of attempts to perform exit presence transaction! ${listId}, ${userId}, ${sessionId}`
                );
            }
        }
        attempt(5);
    });
}

function exitAllPresences(userId: string, sessionId: string) {
    const listsKey = sessionListsKey(sessionId);
    redisClient.SMEMBERS(listsKey, (err, listIds) => {
        if (err) {
            throw err;
        }

        // console.log(`${userId} exiting all presences for session ${sessionId}`, listIds);

        const accumulatedErrors = [];
        for (const listId of listIds) {
            try {
                exitPresence(listId, userId, sessionId);
            } catch (e) {
                accumulatedErrors.push(
                    `Error exiting presence for ${listId} / ${userId} / ${sessionId}: ${e.toString()}`
                );
            }
        }
        if (accumulatedErrors.length > 0) {
            const fullError = accumulatedErrors.reduce((acc, x) => `${acc}\n\n${x}`, "").substr(2);
            throw new Error(fullError);
        }
    });
}

const ALL_SESSION_USER_IDS_KEY = "Presence.SessionAndUserIds";

io.on("connection", function (socket: Socket) {
    if (!socket.decodedToken["https://hasura.io/jwt/claims"]) {
        console.error(`Socket ${socket.id} attempted to connect with a JWT that was missing the relevant claims.`);
        socket.disconnect();
        return;
    }

    const userId: string = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
    if (userId) {
        redisClient.SADD(ALL_SESSION_USER_IDS_KEY, `${socket.id}|${userId}`);

        const conferenceSlug: string =
            socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-conference-slug"] ?? "<<NO-CONFERENCE>>";
        console.log(`Authorized client connected: ${conferenceSlug} / ${userId}`);

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${conferenceSlug} / ${userId} / ${socket.id}`);
            redisClient.SREM(ALL_SESSION_USER_IDS_KEY, `${socket.id}|${userId}`);

            try {
                exitAllPresences(userId, socket.id);
            } catch (e) {
                console.error(`Error exiting all presences on socket ${socket.id}`, e);
            }
        });

        socket.on("enterPage", async (path: string) => {
            try {
                if (typeof path === "string") {
                    const pageKey = getPageKey(conferenceSlug, path);
                    enterPresence(pageKey, userId, socket.id);
                }
            } catch (e) {
                console.error(`Error entering presence on socket ${socket.id}`, e);
            }
        });

        socket.on("leavePage", async (path: string) => {
            try {
                if (typeof path === "string") {
                    const pageKey = getPageKey(conferenceSlug, path);
                    exitPresence(pageKey, userId, socket.id);
                }
            } catch (e) {
                console.error(`Error exiting presence on socket ${socket.id}`, e);
            }
        });

        socket.on("observePage", async (path: string) => {
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

                        // console.log(`Emitting presences for ${path} to ${userId} / ${socket.id}`, userIds);
                        socket.emit("presences", { listId, userIds });
                    });
                }
            } catch (e) {
                console.error(`Error observing presence on socket ${socket.id}`, e);
            }
        });

        socket.on("unobservePage", async (path: string) => {
            try {
                if (typeof path === "string") {
                    const pageKey = getPageKey(conferenceSlug, path);
                    const chan = presenceChannelName(pageKey);
                    // console.log(`${userId} unobserved ${pageKey}`);
                    await socket.leave(chan);
                }
            } catch (e) {
                console.error(`Error unobserving presence on socket ${socket.id}`, e);
            }
        });
    }
});

function invalidateSessions() {
    redisClient.SMEMBERS(ALL_SESSION_USER_IDS_KEY, async (err, sessionListsKeys) => {
        if (err) {
            console.error("Error invalidating sessions", err);
            return;
        }

        if (!sessionListsKeys) {
            return;
        }

        const socketIds = await io.allSockets();
        for (const sessionListsKey of sessionListsKeys) {
            const parts = sessionListsKey.split("|");
            const sessionId = parts[0];
            const userId = parts[1];
            if (!socketIds.has(sessionId)) {
                console.log("Found dangling session", sessionListsKey);
                try {
                    exitAllPresences(userId, sessionId);
                    redisClient.SREM(ALL_SESSION_USER_IDS_KEY, sessionListsKey);
                } catch (e) {
                    console.error(`Error exiting all presences of dangling session ${sessionId} / ${userId}`, e);
                }
            }
        }
    });
}

setInterval(invalidateSessions, 1000);
