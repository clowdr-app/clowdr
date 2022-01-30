import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import { gql } from "graphql-tag";
import type P from "pino";
import * as R from "ramda";
import type { Callback } from "redis";
import { promisify } from "util";
import type {
    Chat_ReadUpToIndex_Bool_Exp,
    GetReadUpToIndicesForHydrationQuery,
    GetReadUpToIndicesForHydrationQueryVariables,
    GetReadUpToIndicesQuery,
    GetReadUpToIndicesQueryVariables,
    ReadUpToIndexCacheDataFragment,
} from "./generated/graphql";
import { GetReadUpToIndicesDocument, GetReadUpToIndicesForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment ReadUpToIndexCacheData on chat_ReadUpToIndex {
        chatId
        registrant {
            userId
        }
        messageSId
    }

    query GetReadUpToIndices($chatId: uuid!) {
        chat_ReadUpToIndex(where: { chatId: { _eq: $chatId }, registrant: { userId: { _is_null: false } } }) {
            ...ReadUpToIndexCacheData
        }
    }

    query GetReadUpToIndicesForHydration($filters: chat_ReadUpToIndex_bool_exp!) {
        chat_ReadUpToIndex(where: $filters) {
            ...ReadUpToIndexCacheData
        }
    }
`;

export type ReadUpToIndicesEntity = Record<string, string>;

type ReadUpToIndicesCacheRecord = Record<string, string>;

export type ReadUpToIndicesHydrationFilters =
    | {
          userId: string;
      }
    | {
          registrantId: string;
      }
    | {
          chatId: string;
      };

export class ReadUpToIndexCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof ReadUpToIndicesCacheRecord, ReadUpToIndicesHydrationFilters>(
        this.logger,
        "ReadUpToIndex",
        async (chatId) => {
            const response = await gqlClient
                ?.query<GetReadUpToIndicesQuery, GetReadUpToIndicesQueryVariables>(GetReadUpToIndicesDocument, {
                    chatId,
                })
                .toPromise();

            const data = response?.data?.chat_ReadUpToIndex;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Chat_ReadUpToIndex_Bool_Exp = {};

            if ("chatId" in filters) {
                gqlFilters.chatId = {
                    _eq: filters.chatId,
                };
            } else if ("registrantId" in filters) {
                gqlFilters.registrantId = {
                    _eq: filters.registrantId,
                };
            } else if ("userId" in filters) {
                gqlFilters.registrant = {
                    userId: {
                        _eq: filters.userId,
                    },
                };
            }

            const response = await gqlClient
                ?.query<GetReadUpToIndicesForHydrationQuery, GetReadUpToIndicesForHydrationQueryVariables>(
                    GetReadUpToIndicesForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                const groups = R.groupBy((x) => x.chatId, response.data.chat_ReadUpToIndex);
                return Object.entries(groups).map(([chatId, record]) => ({
                    entityKey: chatId,
                    data: this.convertToCacheRecord(record),
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(
        data: ReadUpToIndexCacheDataFragment[]
    ): CacheRecord<keyof ReadUpToIndicesCacheRecord> {
        return data.reduce<Record<string, string>>((acc, x) => {
            if (x.registrant.userId) {
                acc[x.registrant.userId] = x.messageSId;
            }
            return acc;
        }, {});
    }

    private readonly modifiedSetKey = this.cache.generateEntityKey("::modifiedSet");

    public async getEntity(id: string, fetchIfNotFound = true): Promise<Record<string, string> | undefined> {
        return await this.cache.getEntity(id, fetchIfNotFound);
    }

    public async getField(id: string, field: string, fetchIfNotFound = true): Promise<string | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            return rawField;
        }
        return undefined;
    }

    public async setEntity(id: string, value: Record<string, string> | undefined): Promise<void> {
        await this.cache.setEntity(id, value);
    }

    public async setField(id: string, field: string, value: string | undefined): Promise<void> {
        await this.cache.setField(id, field, value);
        try {
            const redisClient = await redisClientPool.acquire("caches/readUpToIndex.setField");
            try {
                redisClientP.sadd(redisClient)(this.modifiedSetKey, `${id}¦${field}¦${value}`);
            } finally {
                redisClientPool.release("caches/readUpToIndex.setField", redisClient);
            }
        } catch (e: any) {
            console.error("Error adding to modified set for readUpToIndex cache");
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: string): Promise<void> {
        await this.cache.invalidateField(id, field);
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

    public async getAndClearModified(): Promise<
        {
            chatId: string;
            userId: string;
            messageSId: string;
        }[]
    > {
        try {
            const redisClient = await redisClientPool.acquire("caches/readUpToIndex.getAndClearModified");
            try {
                let multi = redisClient.multi();
                multi = multi.smembers(this.modifiedSetKey);
                multi = multi.del(this.modifiedSetKey);
                const results: any[] = await promisify((cb: Callback<any[]>) => multi.exec(cb))();
                if (results && results[0] && results[0] instanceof Array) {
                    return results[0].map((x: string) => {
                        const parts = x.split("¦");
                        return {
                            chatId: parts[0],
                            userId: parts[1],
                            messageSId: parts[2],
                        };
                    });
                }
            } finally {
                redisClientPool.release("caches/readUpToIndex.getAndClearModified", redisClient);
            }
        } catch (e: any) {
            console.error("Error getting and clearing the modified set for readUpToIndex cache");
        }
        return [];
    }

    public async hydrateIfNecessary(filters: ReadUpToIndicesHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
