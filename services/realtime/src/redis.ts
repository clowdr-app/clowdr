import assert from "assert";
import redis from "redis";
import Redlock from "redlock";

assert(process.env.REDIS_URL, "REDIS_URL env var not defined.");

export const redisPubClient = redis.createClient(process.env.REDIS_URL, {});
export const redisSubClient = redisPubClient.duplicate();
export const redisClient = redisPubClient.duplicate();

export const redlock = new Redlock([redisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
});
