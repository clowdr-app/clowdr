import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "@urql/core";
import type Redlock from "redlock";
import type { GetEventQuery, GetEventQueryVariables } from "./generated/graphql";
import { GetEventDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetEvent($id: uuid!) {
        schedule_Event_by_pk(id: $id) {
            id
            conferenceId
            roomId
        }
    }
`;

export interface EventEntity {
    id: string;
    conferenceId: string;
    roomId: string;
}

export class EventCache {
    constructor(
        private readonly redisClientPool: RedisClientPool,
        private readonly redlock: Redlock,
        private readonly gqlClient: GQLClient
    ) {}

    private readonly cache = new TableCache("Event", this.redisClientPool, this.redlock, async (id) => {
        const response = await this.gqlClient
            ?.query<GetEventQuery, GetEventQueryVariables>(GetEventDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.schedule_Event_by_pk;
        if (data) {
            return {
                id: data.id,
                conferenceId: data.conferenceId,
                roomId: data.roomId,
            };
        }
        return undefined;
    });

    public async getEntity(id: string, fetchIfNotFound = true): Promise<EventEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                conferenceId: rawEntity.conferenceId,
                roomId: rawEntity.roomId,
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof EventEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<EventEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "id" || field === "conferenceId" || field === "roomId") {
                return rawField as EventEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: EventEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                conferenceId: value.conferenceId,
                roomId: value.roomId,
            }
        );
    }

    public async setField<FieldKey extends keyof EventEntity>(
        id: string,
        field: FieldKey,
        value: EventEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "id" || field === "conferenceId" || field === "roomId") {
                await this.cache.setField(id, field, value as string);
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof EventEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: EventEntity) => EventEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }
}
