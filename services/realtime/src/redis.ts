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
    set: promisify((key: string, value: string, mode: string, duration: number, cb?: Callback<"OK" | undefined>) =>
        redisClient.set(key, value, mode, duration, cb)
    ),
    setForever: promisify((key: string, value: string, cb?: Callback<"OK" | undefined>) =>
        redisClient.set(key, value, cb)
    ),
    del: promisify((key: string, cb?: Callback<number>) => redisClient.del(key, cb)),
    sadd: promisify((key: string, value: string, cb?: Callback<number>) => redisClient.sadd(key, value, cb)),
    srem: promisify((key: string, value: string, cb?: Callback<number>) => redisClient.srem(key, value, cb)),
    smembers: promisify((key: string, cb?: Callback<string[]>) => redisClient.smembers(key, cb)),
    scan: promisify((cursor: string, pattern: string, cb?: Callback<[string, string[]]>) =>
        redisClient.scan(cursor, "match", pattern, cb)
    ),
};
