import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type { GetChatQuery, GetChatQueryVariables } from "./generated/graphql";
import { GetChatDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetChat($id: uuid!) {
        chat_Chat_by_pk(id: $id) {
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
    }
`;

export interface ChatEntity {
    id: string;
    restrictToAdmins: boolean;
    conferenceId: string;
    itemId: string | null;
    roomId: string | null;
}

class ChatCache {
    private readonly cache = new TableCache("Chat", async (id) => {
        const response = await gqlClient
            ?.query<GetChatQuery, GetChatQueryVariables>(GetChatDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.chat_Chat_by_pk;
        if (data) {
            return {
                id: data.id,
                restrictToAdmins: data.restrictToAdmins ? "true" : "false",
                conferenceId: data.conferenceId,
                itemId: data.item?.id ?? "null",
                roomId: data.room?.id ?? "null",
            };
        }
        return undefined;
    });

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

export const chatCache = new ChatCache();
