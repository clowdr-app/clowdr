import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "graphql-tag";
import type Redlock from "redlock";
import type { GetUserQuery, GetUserQueryVariables } from "./generated/graphql";
import { GetUserDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetUser($id: String!) {
        User_by_pk(id: $id) {
            id
            registrants {
                id
                conferenceId
            }
        }
    }
`;

export interface UserEntity {
    id: string;
    registrants: {
        id: string;
        conferenceId: string;
    }[];
}

export class UserCache {
    constructor(
        private readonly redisClientPool: RedisClientPool,
        private readonly redlock: Redlock,
        private readonly gqlClient: GQLClient
    ) {}

    private readonly cache = new TableCache("User", this.redisClientPool, this.redlock, async (id) => {
        const response = await this.gqlClient
            ?.query<GetUserQuery, GetUserQueryVariables>(GetUserDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.User_by_pk;
        if (data) {
            return {
                id: data.id,
                registrants: JSON.stringify(data.registrants.map((x) => ({ id: x.id, conferenceId: x.conferenceId }))),
            };
        }
        return undefined;
    });

    public async getEntity(id: string, fetchIfNotFound = true): Promise<UserEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                registrants: JSON.parse(rawEntity.registrants),
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof UserEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<UserEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "id") {
                return rawField as UserEntity[FieldKey];
            } else if (field === "registrants") {
                return JSON.parse(rawField) as UserEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: UserEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                registrants: JSON.stringify(value.registrants),
            }
        );
    }

    public async setField<FieldKey extends keyof UserEntity>(
        id: string,
        field: FieldKey,
        value: UserEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "id") {
                await this.cache.setField(id, field, value as string);
            } else if (field === "registrants") {
                await this.cache.setField(id, field, JSON.stringify(value));
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof UserEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: UserEntity) => UserEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }
}
