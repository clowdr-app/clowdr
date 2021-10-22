/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import assert from "assert";
import genericPool from "generic-pool";
import type { Callback, RedisClient } from "redis";
import redis from "redis";
import Redlock from "redlock";
import { promisify } from "util";

export function createRedisClient() {
    assert(process.env.REDIS_URL, "REDIS_URL env var not defined.");

    let redisExists = false;
    return redis.createClient(process.env.REDIS_URL, {
        retry_strategy: (options) => {
            // Waiting 75 attempts = ~3 hours of re-attempting to connect before giving up
            if (options.error && options.error.code === "ECONNREFUSED" && (!redisExists || options.attempt >= 75)) {
                return new Error("The server refused the connection");
            }

            redisExists = true;

            if (options.total_retry_time > 1000 * 60 * 60 * 3) {
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 1000) {
                return undefined;
            }

            // Every 5 attempts, wait a longer period
            if (options.attempt % 5 === 0) {
                return 10 * 60 * 1000; // 10 minutes
            }
            // Else, attempt several times in relatively quick succession
            else {
                return 30 * 1000; // 30 seconds
            }
        },
    });
}

const clientFactory = {
    create: async function () {
        return createRedisClient();
    },
    destroy: async function (client: RedisClient) {
        client.quit();
    },
};

const poolOpts = {
    max: process.env.MAX_REDIS_CONNECTIONS ? parseInt(process.env.MAX_REDIS_CONNECTIONS, 10) : 10,
    min: process.env.MIN_REDIS_CONNECTIONS ? parseInt(process.env.MIN_REDIS_CONNECTIONS, 10) : 2,
};

const _redisClientPool = genericPool.createPool<RedisClient>(clientFactory, poolOpts);
export const redisClientPool = {
    acquire: (_caller: string) => {
        // console.info(`Acquiring redis client for ${caller}`);
        return _redisClientPool.acquire();
    },
    release: (_caller: string, client: RedisClient) => {
        // console.info(`Releasing redis client for ${caller}`);
        return _redisClientPool.release(client);
    },
};

const redlockRedisClient = createRedisClient();
export const redlock = new Redlock([redlockRedisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 1000,
    retryJitter: 500,
});

export const redisClientP = {
    get: (redisClient: RedisClient) => promisify(redisClient.get).bind(redisClient),
    set: (redisClient: RedisClient) =>
        promisify((key: string, value: string, mode: string, duration: number, cb?: Callback<"OK" | undefined>) =>
            redisClient.set(key, value, mode, duration, cb)
        ),
    setForever: (redisClient: RedisClient) =>
        promisify((key: string, value: string, cb?: Callback<"OK" | undefined>) => redisClient.set(key, value, cb)),
    del: (redisClient: RedisClient) => promisify((key: string, cb?: Callback<number>) => redisClient.del(key, cb)),
    sadd: (redisClient: RedisClient) =>
        promisify((key: string, value: string, cb?: Callback<number>) => redisClient.sadd(key, value, cb)),
    srem: (redisClient: RedisClient) =>
        promisify((key: string, value: string, cb?: Callback<number>) => redisClient.srem(key, value, cb)),
    smembers: (redisClient: RedisClient) =>
        promisify((key: string, cb?: Callback<string[]>) => redisClient.smembers(key, cb)),
    scan: (redisClient: RedisClient) =>
        promisify((cursor: string, pattern: string, cb?: Callback<[string, string[]]>) =>
            redisClient.scan(cursor, "match", pattern, cb)
        ),
    zadd: (redisClient: RedisClient) =>
        promisify((key: string, score: number, member: string, cb?: Callback<number>) =>
            redisClient.zadd(key, score, member, cb)
        ),
    zrem: (redisClient: RedisClient) =>
        promisify((key: string, member: string, cb?: Callback<number>) => redisClient.zrem(key, member, cb)),
    zrange: (redisClient: RedisClient) =>
        promisify((key: string, start: number, stop: number, cb?: Callback<string[]>) =>
            redisClient.zrange(key, start, stop, cb)
        ),
    zremrangebyrank: (redisClient: RedisClient) =>
        promisify((key: string, start: number, stop: number, cb?: Callback<number>) =>
            redisClient.zremrangebyrank(key, start, stop, cb)
        ),
    zcard: (redisClient: RedisClient) => promisify((key: string, cb?: Callback<number>) => redisClient.zcard(key, cb)),
    zrevrank: (redisClient: RedisClient) =>
        promisify((key: string, member: string, cb?: Callback<number | null>) => redisClient.zrevrank(key, member, cb)),
    incr: (redisClient: RedisClient) => promisify((key: string, cb?: Callback<number>) => redisClient.incr(key, cb)),
    getset: (redisClient: RedisClient) =>
        promisify((key: string, value: string, cb?: Callback<string>) => redisClient.getset(key, value, cb)),
};
