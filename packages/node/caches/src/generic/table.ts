import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { Callback, RedisClient } from "redis";
import { promisify } from "util";

export class TableCache {
    constructor(
        private readonly redisRootKey: string,
        private readonly fetch: (key: string) => Promise<Record<string, string> | undefined>,
        private readonly ttlSeconds = 7 * 24 * 60 * 60
    ) {}

    public generateEntityKey(itemKey: string): string {
        return `caches.${this.redisRootKey}:${itemKey}`;
    }

    private async rawSet(cacheKey: string, value: Record<string, string>, redisClient: RedisClient) {
        let discard = true;
        let multi = redisClient.multi();
        try {
            for (const fieldKey in value) {
                multi = multi.hset(cacheKey, fieldKey, value[fieldKey]);
            }
            multi.expire(cacheKey, this.ttlSeconds);
            discard = false;
            await promisify((cb: Callback<any[]>) => multi.exec(cb))();
        } finally {
            if (discard) {
                await redisClientP.discard(redisClient)();
            }
        }
    }

    public async getEntity(entityKey: string, fetchIfNotFound = true): Promise<Record<string, string> | undefined> {
        try {
            const cacheKey = this.generateEntityKey(entityKey);
            const redisClient = await redisClientPool.acquire(`caches/generic/table:${this.redisRootKey}`);
            try {
                await redisClientP.watch(redisClient)(cacheKey);
                const exists = await redisClientP.exists(redisClient)(cacheKey);
                if (exists !== 0) {
                    const multi = redisClient.multi();
                    const results = await promisify((cb: Callback<any[]>) => multi.hgetall(cacheKey).exec(cb))();
                    if (results && results[0]) {
                        return results[0];
                    }
                } else if (fetchIfNotFound) {
                    //const lease = await redlock.acquire(`locks:${cacheKey}`, 30000);

                    //try {
                    const value = await this.fetch(entityKey);
                    if (value) {
                        await this.rawSet(cacheKey, value, redisClient);
                    } else {
                        await redisClientP.del(redisClient)(cacheKey);
                    }
                    return value;
                    // } finally {
                    //     await lease.unlock();
                    // }
                }
            } catch (e: any) {
                await redisClientP.unwatch(redisClient)();
                console.error("Error getting field from cache", e);
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (e: any) {
            console.error("Error acquiring redis client in order to fetch field from cache", e);
        }
        return undefined;
    }

    public async getField(entityKey: string, fieldKey: string, fetchIfNotFound = true): Promise<string | undefined> {
        try {
            const redisClient = await redisClientPool.acquire(`caches/generic/table:${this.redisRootKey}`);
            const cacheKey = this.generateEntityKey(entityKey);
            try {
                await redisClientP.watch(redisClient)(cacheKey);
                const exists = await redisClientP.exists(redisClient)(cacheKey);
                if (exists !== 0) {
                    const multi = redisClient.multi();
                    const results = await promisify((cb: Callback<any[]>) => multi.hget(cacheKey, fieldKey).exec(cb))();
                    if (results && results[0]) {
                        return results[0];
                    }
                }

                // It is possible that just the one field is missing

                if (fetchIfNotFound) {
                    // const lease = await redlock.acquire(`locks:${cacheKey}`, 30000);

                    // try {
                    const value = await this.fetch(entityKey);
                    if (value) {
                        await this.rawSet(cacheKey, value, redisClient);
                        return value[fieldKey];
                    } else {
                        await redisClientP.del(redisClient)(cacheKey);
                    }
                    // } finally {
                    //     await lease.unlock();
                    // }
                }
            } catch (e: any) {
                await redisClientP.unwatch(redisClient)();
                console.error("Error getting entity from cache", e);
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (e: any) {
            console.error("Error acquiring redis client in order to fetch entity from cache", e);
        }
        return undefined;
    }

    public async setEntity(entityKey: string, value: Record<string, string> | undefined): Promise<void> {
        try {
            const redisClient = await redisClientPool.acquire(`caches/generic/table:${this.redisRootKey}`);
            const cacheKey = this.generateEntityKey(entityKey);
            try {
                //const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
                //try {
                if (value) {
                    await this.rawSet(cacheKey, value, redisClient);
                } else {
                    await redisClientP.del(redisClient)(cacheKey);
                }
                // } finally {
                //     await lease.unlock();
                // }
            } catch (e: any) {
                console.error("Error setting entity in cache", e);
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (e: any) {
            console.error("Error acquiring redis client in order to set entity in cache", e);
        }
    }

    public async setField(entityKey: string, fieldKey: string, value: string | undefined): Promise<void> {
        try {
            const redisClient = await redisClientPool.acquire(`caches/generic/table:${this.redisRootKey}`);
            const cacheKey = this.generateEntityKey(entityKey);
            try {
                // const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
                // try {
                if (value) {
                    await redisClientP.hset(redisClient)(cacheKey, fieldKey, value);
                } else {
                    await redisClientP.hdel(redisClient)(cacheKey, fieldKey);
                }
                // } finally {
                //     await lease.unlock();
                // }
            } catch (e: any) {
                console.error("Error setting field in cache", e);
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (e: any) {
            console.error("Error acquiring redis client in order to set field in cache", e);
        }
    }

    public async invalidateEntity(entityKey: string): Promise<void> {
        return this.setEntity(entityKey, undefined);
    }

    public async invalidateField(entityKey: string, fieldKey: string): Promise<void> {
        return this.setField(entityKey, fieldKey, undefined);
    }

    public async updateEntity(
        id: string,
        update: (entity: Record<string, string>) => Record<string, string> | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }
}
