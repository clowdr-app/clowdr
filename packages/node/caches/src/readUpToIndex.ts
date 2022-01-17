import type { RedisClientPool } from "@midspace/component-clients/redis";
import { redisClientP } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "graphql-tag";
import type { Callback } from "redis";
import type Redlock from "redlock";
import { promisify } from "util";
import type { GetReadUpToIndicesQuery, GetReadUpToIndicesQueryVariables } from "./generated/graphql";
import { GetReadUpToIndicesDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetReadUpToIndices($chatId: uuid!) {
        chat_ReadUpToIndex(where: { chatId: { _eq: $chatId }, registrant: { userId: { _is_null: false } } }) {
            chatId
            registrant {
                userId
            }
            messageSId
        }
    }
`;

export type ReadUpToIndicesEntity = Record<string, string>;

export class ReadUpToIndexCache {
    constructor(
        private readonly redisClientPool: RedisClientPool,
        private readonly redlock: Redlock,
        private readonly gqlClient: GQLClient
    ) {}

    private readonly cache = new TableCache("ReadUpToIndex", this.redisClientPool, this.redlock, async (chatId) => {
        const response = await this.gqlClient
            ?.query<GetReadUpToIndicesQuery, GetReadUpToIndicesQueryVariables>(GetReadUpToIndicesDocument, {
                chatId,
            })
            .toPromise();

        const data = response?.data?.chat_ReadUpToIndex;
        if (data) {
            return data.reduce<Record<string, string>>((acc, x) => {
                if (x.registrant.userId) {
                    acc[x.registrant.userId] = x.messageSId;
                }
                return acc;
            }, {});
        }
        return undefined;
    });

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
            const redisClient = await this.redisClientPool.acquire("caches/readUpToIndex.setField");
            try {
                redisClientP.sadd(redisClient)(this.modifiedSetKey, `${id}¦${field}¦${value}`);
            } finally {
                this.redisClientPool.release("caches/readUpToIndex.setField", redisClient);
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
            const redisClient = await this.redisClientPool.acquire("caches/readUpToIndex.getAndClearModified");
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
                this.redisClientPool.release("caches/readUpToIndex.getAndClearModified", redisClient);
            }
        } catch (e: any) {
            console.error("Error getting and clearing the modified set for readUpToIndex cache");
        }
        return [];
    }
}
