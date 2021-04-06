import { redisClientP, redlock } from "../../redis";

export class Cache<T> {
    constructor(
        private redisRootKey: string,
        private fetch: (key: string, testMode_ExpectedValue: T | undefined) => Promise<T | undefined>,
        private stringify: (value: T) => string,
        private parse: (value: string) => T,
        private refetchAfterMs = 24 * 60 * 60 * 1000,
        private rateLimitPeriodMs = 3 * 60 * 1000
    ) {}

    private generateCacheKey(itemKey: string): string {
        return `${this.redisRootKey}:${itemKey}`;
    }

    async get(
        itemKey: string,
        testMode_ExpectedValue: T | undefined,
        refetchNow = false,
        acquireLock = true
    ): Promise<T | undefined> {
        const cacheKey = this.generateCacheKey(itemKey);
        const existingValStr = await redisClientP.get(cacheKey);
        if (existingValStr !== null) {
            const existingVal = JSON.parse(existingValStr);
            const fetchedAt: number = existingVal.fetchedAt;

            if (existingVal.value === "undefined" || refetchNow) {
                if (Date.now() - fetchedAt < this.rateLimitPeriodMs) {
                    return existingVal.value === "undefined" ? undefined : this.parse(existingVal.value);
                }
            } else {
                return this.parse(existingVal.value);
            }
        }

        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            console.info("Fetching from original source for cache", cacheKey);
            const val = await this.fetch(itemKey, testMode_ExpectedValue);
            await this.set(itemKey, val, false);
            return val;
        } finally {
            lease?.unlock();
        }
    }

    async set(itemKey: string, value: T | undefined, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            const valStr = value !== undefined ? this.stringify(value) : "undefined";
            await redisClientP.set(
                cacheKey,
                JSON.stringify({ fetchedAt: Date.now(), value: valStr }),
                "PX",
                Date.now() + this.refetchAfterMs
            );
        } finally {
            lease?.unlock();
        }
    }

    async delete(itemKey: string, acquireLock = true): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = acquireLock ? await redlock.acquire(`locks:${cacheKey}`, 5000) : undefined;
        try {
            await redisClientP.del(cacheKey);
        } finally {
            lease?.unlock();
        }
    }

    async update(
        itemKey: string,
        value: (existing: T | undefined) => T | undefined,
        testMode_ExpectedExistingValue: T | undefined
    ): Promise<void> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
        try {
            const existingValue = await this.get(itemKey, testMode_ExpectedExistingValue, false, false);
            const newValue = value(existingValue);
            // console.info("New value", newValue);
            await this.set(itemKey, newValue, false);
        } finally {
            lease?.unlock();
        }
    }
}
