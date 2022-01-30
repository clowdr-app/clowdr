import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type { P } from "pino";
import type {
    ChatCacheDataFragment,
    Chat_Chat_Bool_Exp,
    GetChatQuery,
    GetChatQueryVariables,
    GetChatsForHydrationQuery,
    GetChatsForHydrationQueryVariables,
} from "./generated/graphql";
import { GetChatDocument, GetChatsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord, HydrationRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment ChatCacheData on chat_Chat {
        id
        restrictToAdmins
        conferenceId
        item {
            id
        }
        room {
            id
        }
    }

    query GetChat($id: uuid!) {
        chat_Chat_by_pk(id: $id) {
            ...ChatCacheData
        }
    }

    query GetChatsForHydration($filters: chat_Chat_bool_exp!) {
        chat_Chat(where: $filters) {
            ...ChatCacheData
        }
    }
`;

export interface ChatEntity {
    id: string;
    restrictToAdmins: boolean;
    conferenceId: string;
    itemId: string | null;
    roomId: string | null;
}

interface ChatCacheRecord {
    id: string;
    restrictToAdmins: "true" | "false";
    conferenceId: string;
    itemId: "null" | string;
    roomId: "null" | string | number;
}

export type ChatHydrationFilters =
    | {
          id: string;
      }
    | {
          conferenceId: string;
      }
    | {
          itemId: string;
      }
    | {
          roomId: string;
      };

export class ChatCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof ChatCacheRecord, ChatHydrationFilters>(
        this.logger,
        "Chat",
        async (id) => {
            const response = await gqlClient
                ?.query<GetChatQuery, GetChatQueryVariables>(GetChatDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.chat_Chat_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Chat_Chat_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.conferenceId = {
                    _eq: filters.conferenceId,
                };
            } else if ("roomId" in filters) {
                gqlFilters.room = {
                    id: {
                        _eq: filters.roomId,
                    },
                };
            } else if ("itemId" in filters) {
                gqlFilters.item = {
                    id: {
                        _eq: filters.itemId,
                    },
                };
            }

            const response = await gqlClient
                ?.query<GetChatsForHydrationQuery, GetChatsForHydrationQueryVariables>(GetChatsForHydrationDocument, {
                    filters: gqlFilters,
                })
                .toPromise();
            if (response?.data) {
                const records: HydrationRecord<keyof ChatCacheRecord>[] = [];

                for (const chat of response.data.chat_Chat) {
                    records.push({
                        data: this.convertToCacheRecord(chat),
                        entityKey: chat.id,
                    });
                }

                return records;
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: ChatCacheDataFragment): CacheRecord<keyof ChatCacheRecord> {
        return {
            id: data.id,
            restrictToAdmins: data.restrictToAdmins ? "true" : "false",
            conferenceId: data.conferenceId,
            itemId: data.item?.id ?? "null",
            roomId: data.room?.id ?? "null",
        };
    }

    public async getEntity(id: string, fetchIfNotFound = true): Promise<ChatEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                restrictToAdmins: rawEntity.restrictToAdmins === "true",
                conferenceId: rawEntity.conferenceId,
                itemId: rawEntity.itemId === "null" ? null : rawEntity.itemId,
                roomId: rawEntity.roomId === "null" ? null : rawEntity.roomId,
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof ChatEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<ChatEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "id" || field === "conferenceId" || field === "itemId" || field === "roomId") {
                return (rawField === "null" ? null : rawField) as ChatEntity[FieldKey];
            } else if (field === "restrictToAdmins") {
                return (rawField === "true") as ChatEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: ChatEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                conferenceId: value.conferenceId,
                restrictToAdmins: value.restrictToAdmins ? "true" : "false",
                itemId: value.itemId ?? "null",
                roomId: value.roomId ?? "null",
            }
        );
    }

    public async setField<FieldKey extends keyof ChatEntity>(
        id: string,
        field: FieldKey,
        value: ChatEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "id" || field === "conferenceId" || field === "itemId" || field === "roomId") {
                await this.cache.setField(id, field, (value ?? "null") as string);
            } else if (field === "restrictToAdmins") {
                await this.cache.setField(id, field, value ? "true" : "false");
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof ChatEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: ChatEntity) => ChatEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }
}
