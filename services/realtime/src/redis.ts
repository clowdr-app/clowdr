import assert from "assert";
import redis, { Callback } from "redis";
import Redlock from "redlock";
import { promisify } from "util";

assert(process.env.REDIS_URL, "REDIS_URL env var not defined.");

export const redisClient = redis.createClient(process.env.REDIS_URL, {});

export const redlock = new Redlock([redisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
});

export const redisClientP = {
    get: promisify(redisClient.get).bind(redisClient),
    set: promisify(
        (key: string, value: string, flag: string, mode: string, duration: number, cb?: Callback<"OK" | undefined>) =>
            redisClient.set(key, value, flag, mode, duration, cb)
    ),
};
