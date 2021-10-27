import { redisClientP, redisClientPool, redlock } from "../../redis";

export class HashsetCache {
    constructor(
        private redisRootKey: string,
        private fetch: (key: string) => Promise<Record<string, string> | undefined>,
        private refetchAfterMs = 24 * 60 * 60 * 1000
    ) {}

    private generateCacheKey(itemKey: string): string {
        return `${this.redisRootKey}:${itemKey}`;
    }

    async get(itemKey: string, acquireLock = true): Promise<Record<string, string> | undefined> {
        const cacheKey = this.generateCacheKey(itemKey);
        const redisClient = await redisClientPool.acquire("lib/cache/hashsetCache/get");
        let redisClientReleased = false;
        try {
            const existingVal = await redisClientP.hgetall(redisClient)(cacheKey);

            redisClientPool.release("lib/cache/hashsetCache/get", redisClient);
            redisClientReleased = true;

            if (existingVal !== null) {
                return existingVal;
            }

            const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
            try {
                console.info("Fetching from original source for hashset cache", cacheKey);
                const val = await this.fetch(itemKey);
                await this.set(itemKey, val, false);
                return val;
            } finally {
                lease?.unlock();
            }
        } finally {
            if (!redisClientReleased) {
                redisClientPool.release("lib/cache/hashsetcache/get", redisClient);
            }
        }
    }

    async getField(itemKey: string, field: string, acquireLock = true): Promise<string | undefined> {
        const cacheKey = this.generateCacheKey(itemKey);
        const redisClient = await redisClientPool.acquire("lib/cache/hashsetCache/getField");
        let redisClientReleased = false;
        try {
            const existingVal = await redisClientP.hget(redisClient)(cacheKey, field);

            redisClientPool.release("lib/cache/hashsetCache/getField", redisClient);
            redisClientReleased = true;

            if (existingVal !== null) {
                return existingVal;
            }

            const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
            try {
                console.info("Fetching from original source for hashset cache", cacheKey);
                const val = await this.fetch(itemKey);
                await this.set(itemKey, val, false);
                return val?.[field];
            } finally {
                lease?.unlock();
            }
        } finally {
            if (!redisClientReleased) {
                redisClientPool.release("lib/cache/hashsetcache/getField", redisClient);
            }
        }
    }

    async set(itemKey: string, value: Record<string, string> | undefined, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const redisClient = await redisClientPool.acquire("lib/cache/hashsetcache/set");
            try {
                if (value) {
                    // Clear existing fields else ones not present in the new value would persist
                    await redisClientP.del(redisClient)(cacheKey);
                    if (Object.keys(value).length > 0) {
                        await redisClientP.hmset(redisClient)(cacheKey, value);
                        await redisClientP.expire(redisClient)(cacheKey, this.refetchAfterMs / 1000);
                    }
                } else {
                    await redisClientP.del(redisClient)(cacheKey);
                }
            } finally {
                redisClientPool.release("lib/cache/hashsetcache/set", redisClient);
            }
        } finally {
            lease?.unlock();
        }
    }

    async setField(itemKey: string, field: string, value: string | undefined, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const redisClient = await redisClientPool.acquire("lib/cache/hashsetcache/setField");
            try {
                if (value) {
                    await redisClientP.hset(redisClient)(cacheKey, field, value);
                } else {
                    await redisClientP.hdel(redisClient)(cacheKey, field);
                }
            } finally {
                redisClientPool.release("lib/cache/hashsetcache/setField", redisClient);
            }
        } finally {
            lease?.unlock();
        }
    }

    async delete(itemKey: string, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const redisClient = await redisClientPool.acquire("lib/cache/hashsetcache/delete");
            try {
                await redisClientP.del(redisClient)(cacheKey);
            } finally {
                redisClientPool.release("lib/cache/hashsetcache/delete", redisClient);
            }
        } finally {
            lease?.unlock();
        }
    }

    async deleteField(itemKey: string, field: string, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const redisClient = await redisClientPool.acquire("lib/cache/hashsetcache/deleteField");
            try {
                await redisClientP.hdel(redisClient)(cacheKey, field);
            } finally {
                redisClientPool.release("lib/cache/hashsetcache/deleteField", redisClient);
            }
        } finally {
            lease?.unlock();
        }
    }

    async update(
        itemKey: string,
        value: (existing: Record<string, string> | undefined) => Record<string, string> | undefined
    ): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
        try {
            const existingValue = await this.get(itemKey, false);
            const newValue = value(existingValue);
            // console.info("New value", newValue);
            await this.set(itemKey, newValue, false);
        } finally {
            lease?.unlock();
        }
    }

    async updateField(
        itemKey: string,
        field: string,
        value: (existing: string | undefined) => string | undefined
    ): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
        try {
            const existingValue = await this.getField(itemKey, field, false);
            const newValue = value(existingValue);
            // console.info("New value", newValue);
            await this.setField(itemKey, field, newValue, false);
        } finally {
            lease?.unlock();
        }
    }
}
