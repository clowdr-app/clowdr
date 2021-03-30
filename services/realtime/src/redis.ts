import assert from "assert";
import redis from "redis";
import Redlock from "redlock";

assert(process.env.REDIS_URL, "REDIS_URL env var not defined.");

export const redisClient = redis.createClient(process.env.REDIS_URL, {});

export const redlock = new Redlock([redisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
});
