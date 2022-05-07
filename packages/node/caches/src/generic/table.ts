import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import crypto from "crypto";
import { hrtime } from "node:process";
import type P from "pino";
import type { Callback, RedisClient } from "redis";
import { promisify } from "util";

export type CacheRecord<Ks extends string> = {
    [K in Ks]: string;
};

export interface HydrationRecord<CacheRecordKeys extends string> {
    entityKey: string;
    data: CacheRecord<CacheRecordKeys>;
}

export class TableCache<CacheRecordKeys extends string, HydrationInputFilters extends Record<string, string | number>> {
    constructor(
        private readonly logger: P.Logger,
        private readonly redisRootKey: string,
        private readonly fetch: (key: string) => Promise<CacheRecord<CacheRecordKeys> | undefined>,
        private readonly fetchForHydrate: (
            filters: HydrationInputFilters
        ) => Promise<HydrationRecord<CacheRecordKeys>[] | undefined>,
        private readonly ttlSeconds = 7 * 24 * 60 * 60,
        private readonly hydrationPeriodMs = 24 * 60 * 60 * 1000
    ) {}

    public generateEntityKey(itemKey: string): string {
        return `caches.${this.redisRootKey}:${itemKey}`;
    }

    public generateLastHydratedKey(): string {
        return `caches.${this.redisRootKey}::hydratedAt`;
    }

    private async rawSet(cacheKey: string, value: CacheRecord<CacheRecordKeys>, redisClient: RedisClient) {
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

    public async getEntity(
        entityKey: string,
        fetchIfNotFound = true
    ): Promise<CacheRecord<CacheRecordKeys> | undefined> {
        try {
            this.logger.trace(
                { entityKey, fetchIfNotFound, redisRootKey: this.redisRootKey },
                "Retrieving entity from cache"
            );
            const cacheKey = this.generateEntityKey(entityKey);
            const redisClient = await redisClientPool.acquire(`caches/generic/table:${this.redisRootKey}`);
            try {
                await redisClientP.watch(redisClient)(cacheKey);
                const exists = await redisClientP.exists(redisClient)(cacheKey);
                if (exists !== 0) {
                    const multi = redisClient.multi();
                    const results = await promisify((cb: Callback<any[]>) => multi.hgetall(cacheKey).exec(cb))();
                    if (results && results[0]) {
                        this.logger.trace(
                            { entityKey, redisRootKey: this.redisRootKey },
                            "Returning entity from Redis cache"
                        );
                        return results[0];
                    }
                } else if (fetchIfNotFound) {
                    //const lease = await redlock.acquire(`locks:${cacheKey}`, 30000);

                    //try {
                    this.logger.trace({ entityKey, redisRootKey: this.redisRootKey }, "Fetching entity from database");
                    const start = hrtime.bigint();
                    const value = await this.fetch(entityKey);
                    const end = hrtime.bigint();
                    this.logger.trace(
                        { entityKey, redisRootKey: this.redisRootKey, fetchTimeNs: end - start },
                        "Fetched entity from database"
                    );
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
            } catch (err: any) {
                await redisClientP.unwatch(redisClient)();
                this.logger.error(
                    { err, entityKey, redisRootKey: this.redisRootKey },
                    "Error getting field from cache"
                );
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (err: any) {
            this.logger.error(
                { err, entityKey, redisRootKey: this.redisRootKey },
                "Error acquiring redis client in order to fetch field from cache"
            );
        }
        return undefined;
    }

    public async getField(
        entityKey: string,
        fieldKey: CacheRecordKeys,
        fetchIfNotFound = true
    ): Promise<string | undefined> {
        try {
            this.logger.trace(
                { entityKey, fieldKey, redisRootKey: this.redisRootKey, fetchIfNotFound },
                "Retrieving field from cache"
            );
            const redisClient = await redisClientPool.acquire(`caches/generic/table:${this.redisRootKey}`);
            const cacheKey = this.generateEntityKey(entityKey);
            try {
                await redisClientP.watch(redisClient)(cacheKey);
                const exists = await redisClientP.exists(redisClient)(cacheKey);
                if (exists !== 0) {
                    const multi = redisClient.multi();
                    const results = await promisify((cb: Callback<any[]>) => multi.hget(cacheKey, fieldKey).exec(cb))();
                    if (results && results[0]) {
                        this.logger.trace(
                            { entityKey, fieldKey, redisRootKey: this.redisRootKey },
                            "Returning field from Redis cache"
                        );
                        return results[0];
                    }
                }

                // It is possible that just the one field is missing

                if (fetchIfNotFound) {
                    // const lease = await redlock.acquire(`locks:${cacheKey}`, 30000);

                    // try {
                    this.logger.trace(
                        { entityKey, fieldKey, redisRootKey: this.redisRootKey },
                        "Fetching field from database"
                    );
                    const start = hrtime.bigint();
                    const value = await this.fetch(entityKey);
                    const end = hrtime.bigint();
                    this.logger.trace(
                        { entityKey, fieldKey, redisRootKey: this.redisRootKey, fetchTimeNs: end - start },
                        "Fetched field from database"
                    );
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
            } catch (err: any) {
                await redisClientP.unwatch(redisClient)();
                this.logger.error(
                    { err, entityKey, fieldKey, redisRootKey: this.redisRootKey },
                    "Error getting entity from cache"
                );
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (err: any) {
            this.logger.error(
                { err, entityKey, fieldKey, redisRootKey: this.redisRootKey },
                "Error acquiring redis client in order to fetch entity from cache"
            );
        }
        return undefined;
    }

    public async setEntity(entityKey: string, value: CacheRecord<CacheRecordKeys> | undefined): Promise<void> {
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
            } catch (err: any) {
                this.logger.error({ err, entityKey, redisRootKey: this.redisRootKey }, "Error setting entity in cache");
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (err: any) {
            this.logger.error(
                { err, entityKey, redisRootKey: this.redisRootKey },
                "Error acquiring redis client in order to set entity in cache"
            );
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
            } catch (err: any) {
                this.logger.error(
                    { err, entityKey, fieldKey, redisRootKey: this.redisRootKey },
                    "Error setting field in cache"
                );
            } finally {
                await redisClientPool.release(`caches/generic/table:${this.redisRootKey}`, redisClient);
            }
        } catch (err: any) {
            this.logger.error(
                { err, entityKey, fieldKey, redisRootKey: this.redisRootKey },
                "Error acquiring redis client in order to set field in cache"
            );
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
        update: (entity: CacheRecord<CacheRecordKeys>) => CacheRecord<CacheRecordKeys> | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }

    public async hydrate(filters: HydrationInputFilters): Promise<void> {
        this.logger.trace({ filters, redisRootKey: this.redisRootKey }, "Fetching data for hydration");

        const fetchedData = await this.fetchForHydrate(filters);

        this.logger.trace({ filters, redisRootKey: this.redisRootKey }, "Hydrating...");

        const redisClient = await redisClientPool.acquire("TableCache.hydrate");
        try {
            const accumulatedErrors: any[] = [];
            if (fetchedData) {
                await Promise.all(
                    fetchedData.map(async (record) => {
                        try {
                            const cacheKey = this.generateEntityKey(record.entityKey);
                            await this.rawSet(cacheKey, record.data, redisClient);
                        } catch (e: any) {
                            accumulatedErrors.push(e);
                        }
                    })
                );
            }

            if (accumulatedErrors.length > 0) {
                this.logger.error(
                    { filters, redisRootKey: this.redisRootKey, accumulatedErrors },
                    "Some records failed to hydrate"
                );
            } else {
                this.logger.trace({ filters, redisRootKey: this.redisRootKey }, "Hydration complete");
            }
        } catch (err: any) {
            this.logger.error({ filters, redisRootKey: this.redisRootKey, err }, "Hydration failed");
        } finally {
            await redisClientPool.release("TableCache.hydrate", redisClient);
        }
    }

    public async hydrateIfNecessary(filters: HydrationInputFilters): Promise<void> {
        const filtersHash = crypto.createHash("sha256").update(JSON.stringify(filters)).digest().toString("base64");
        const lastHydratedAtKey = this.generateLastHydratedKey();
        let shouldHydrate = false;
        let lastHydratedAtStr: string | undefined | null = undefined;

        let redisClient = await redisClientPool.acquire("TableCache.hydrateIfNecessary(A)");
        try {
            lastHydratedAtStr = await redisClientP.hget(redisClient)(lastHydratedAtKey, filtersHash);
            const lastHydratedAt = lastHydratedAtStr?.length ? Date.parse(lastHydratedAtStr) : undefined;
            if (!lastHydratedAt || lastHydratedAt < Date.now() - this.hydrationPeriodMs) {
                try {
                    await redisClientP.hset(redisClient)(lastHydratedAtKey, filtersHash, new Date().toISOString());
                    shouldHydrate = true;
                } catch (e: any) {
                    shouldHydrate = false;

                    if (lastHydratedAtStr) {
                        await redisClientP.hset(redisClient)(lastHydratedAtKey, filtersHash, lastHydratedAtStr);
                    } else {
                        await redisClientP.hdel(redisClient)(lastHydratedAtKey, filtersHash);
                    }

                    throw e;
                }
            }
        } finally {
            await redisClientPool.release("TableCache.hydrateIfNecessary(A)", redisClient);
        }

        if (shouldHydrate) {
            try {
                await this.hydrate(filters);
            } catch (e: any) {
                try {
                    redisClient = await redisClientPool.acquire("TableCache.hydrateIfNecessary(B)");
                    if (lastHydratedAtStr) {
                        await redisClientP.hset(redisClient)(lastHydratedAtKey, filtersHash, lastHydratedAtStr);
                    } else {
                        await redisClientP.hdel(redisClient)(lastHydratedAtKey, filtersHash);
                    }
                } finally {
                    await redisClientPool.release("TableCache.hydrateIfNecessary(B)", redisClient);
                }

                throw e;
            }
        }
    }
}
