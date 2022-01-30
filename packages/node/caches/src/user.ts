import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    GetUserQuery,
    GetUserQueryVariables,
    GetUsersForHydrationQuery,
    GetUsersForHydrationQueryVariables,
    UserCacheDataFragment,
    User_Bool_Exp,
} from "./generated/graphql";
import { GetUserDocument, GetUsersForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment UserCacheData on User {
        id
        registrants {
            id
            conferenceId
        }
    }

    query GetUser($id: String!) {
        User_by_pk(id: $id) {
            ...UserCacheData
        }
    }

    query GetUsersForHydration($filters: User_bool_exp!) {
        User(where: $filters) {
            ...UserCacheData
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

interface UserCacheRecord {
    id: string;
    registrants: string;
}

export type UserHydrationFilters = {
    id: string;
};

export class UserCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof UserCacheRecord, UserHydrationFilters>(
        this.logger,
        "User",
        async (id) => {
            const response = await gqlClient
                ?.query<GetUserQuery, GetUserQueryVariables>(GetUserDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.User_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: User_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            }

            const response = await gqlClient
                ?.query<GetUsersForHydrationQuery, GetUsersForHydrationQueryVariables>(GetUsersForHydrationDocument, {
                    filters: gqlFilters,
                })
                .toPromise();
            if (response?.data) {
                return response.data.User.map((record) => ({
                    data: this.convertToCacheRecord(record),
                    entityKey: record.id,
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: UserCacheDataFragment): CacheRecord<keyof UserCacheRecord> {
        return {
            id: data.id,
            registrants: JSON.stringify(data.registrants.map((x) => ({ id: x.id, conferenceId: x.conferenceId }))),
        };
    }

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

    public async hydrateIfNecessary(filters: UserHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
