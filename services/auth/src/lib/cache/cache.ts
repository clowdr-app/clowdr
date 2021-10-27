import { redisClientP, redisClientPool, redlock } from "../../redis";

export class Cache<T> {
    constructor(
        private redisRootKey: string,
        private fetch: (key: string) => Promise<T | undefined>,
        private stringify: (value: T) => string,
        private parse: (value: string) => T,
        private refetchAfterMs = 24 * 60 * 60 * 1000,
        private rateLimitPeriodMs = 3 * 60 * 1000
    ) {}

    private generateCacheKey(itemKey: string): string {
        return `${this.redisRootKey}:${itemKey}`;
    }

    async get(itemKey: string, refetchNow = false, acquireLock = true, fetchIfNotFound = true): Promise<T | undefined> {
        const cacheKey = this.generateCacheKey(itemKey);
        const redisClient = await redisClientPool.acquire("lib/cache/cache/get");
        let redisClientReleased = false;
        try {
            const existingValStr = await redisClientP.get(redisClient)(cacheKey);

            redisClientPool.release("lib/cache/cache/get", redisClient);
            redisClientReleased = true;

            if (existingValStr !== null) {
                const existingVal = JSON.parse(existingValStr);
                const fetchedAt: number = existingVal.fetchedAt;

                if (existingVal.value === "undefined" || refetchNow) {
                    if (Date.now() - fetchedAt < this.rateLimitPeriodMs) {
                        return existingVal.value === "undefined" ? undefined : this.parse(existingVal.value);
                    } else if (!fetchIfNotFound) {
                        return undefined;
                    }
                } else {
                    return this.parse(existingVal.value);
                }
            } else if (!fetchIfNotFound) {
                return undefined;
            }

            const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
            try {
                console.info("Fetching from original source for cache", cacheKey);
                const val = await this.fetch(itemKey);
                await this.set(itemKey, val, false);
                return val;
            } finally {
                lease?.unlock();
            }
        } finally {
            if (!redisClientReleased) {
                redisClientPool.release("lib/cache/cache/get", redisClient);
            }
        }
    }

    async set(itemKey: string, value: T | undefined, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const redisClient = await redisClientPool.acquire("lib/cache/cache/set");
            try {
                const valStr = value !== undefined ? this.stringify(value) : "undefined";
                await redisClientP.set(redisClient)(
                    cacheKey,
                    JSON.stringify({ fetchedAt: Date.now(), value: valStr }),
                    "PX",
                    Date.now() + this.refetchAfterMs
                );
            } finally {
                redisClientPool.release("lib/cache/cache/set", redisClient);
            }
        } finally {
            lease?.unlock();
        }
    }

    async delete(itemKey: string, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const redisClient = await redisClientPool.acquire("lib/cache/cache/delete");
            try {
                await redisClientP.del(redisClient)(cacheKey);
            } finally {
                redisClientPool.release("lib/cache/cache/delete", redisClient);
            }
        } finally {
            lease?.unlock();
        }
    }

    async update(
        itemKey: string,
        value: (existing: T | undefined) => T | undefined,
        fetchIfNotFound: boolean
    ): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
        try {
            const existingValue = await this.get(itemKey, false, false, fetchIfNotFound);
            if (!fetchIfNotFound && existingValue === undefined) {
                return;
            }
            const newValue = value(existingValue);
            // console.info("New value", newValue);
            await this.set(itemKey, newValue, false);
        } finally {
            lease?.unlock();
        }
    }
}
