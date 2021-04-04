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

    async get(itemKey: string, testMode_ExpectedValue: T | undefined, refetchNow = false): Promise<T | undefined> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
        try {
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

            console.info("Fetching from original source for cache", cacheKey);
            const val = await this.fetch(itemKey, testMode_ExpectedValue);
            const valStr = val !== undefined ? this.stringify(val) : "undefined";
            await redisClientP.set(
                cacheKey,
                JSON.stringify({ fetchedAt: Date.now(), value: valStr }),
                "NX",
                "PX",
                Date.now() + this.refetchAfterMs
            );
            return val;
        } finally {
            lease.unlock();
        }
    }
}
