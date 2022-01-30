import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    GetRegistrantQuery,
    GetRegistrantQueryVariables,
    GetRegistrantsForHydrationQuery,
    GetRegistrantsForHydrationQueryVariables,
    RegistrantCacheDataFragment,
    Registrant_RegistrantRole_Enum,
    Registrant_Registrant_Bool_Exp,
} from "./generated/graphql";
import { GetRegistrantDocument, GetRegistrantsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment RegistrantCacheData on registrant_Registrant {
        id
        conferenceRole
        displayName
        userId
        subconferenceMemberships {
            id
            subconferenceId
            role
        }
    }

    query GetRegistrant($id: uuid!) {
        registrant_Registrant_by_pk(id: $id) {
            ...RegistrantCacheData
        }
    }

    query GetRegistrantsForHydration($filters: registrant_Registrant_bool_exp!) {
        registrant_Registrant(where: $filters) {
            ...RegistrantCacheData
        }
    }
`;

export interface SubconferenceMembership {
    id: string;
    subconferenceId: string;
    role: Registrant_RegistrantRole_Enum;
}

export interface RegistrantEntity {
    id: string;
    displayName: string;
    conferenceRole: Registrant_RegistrantRole_Enum;
    userId: string | undefined | null;
    subconferenceMemberships: SubconferenceMembership[];
}

interface RegistrantCacheRecord {
    id: string;
    displayName: string;
    conferenceRole: string;
    userId: string;
    subconferenceMemberships: string;
}

export type RegistrantHydrationFilters =
    | {
          id: string;
      }
    | {
          conferenceId: string;
      }
    | {
          userId: string;
      };

export class RegistrantCache {
    constructor(private readonly logger: P.Logger) {}
    private readonly cache = new TableCache<keyof RegistrantCacheRecord, RegistrantHydrationFilters>(
        this.logger,
        "Registrant",
        async (id) => {
            const response = await gqlClient
                ?.query<GetRegistrantQuery, GetRegistrantQueryVariables>(GetRegistrantDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.registrant_Registrant_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Registrant_Registrant_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.conferenceId = {
                    _eq: filters.conferenceId,
                };
            } else if ("userId" in filters) {
                gqlFilters.userId = {
                    _eq: filters.userId,
                };
            }

            const response = await gqlClient
                ?.query<GetRegistrantsForHydrationQuery, GetRegistrantsForHydrationQueryVariables>(
                    GetRegistrantsForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                return response.data.registrant_Registrant.map((record) => ({
                    data: this.convertToCacheRecord(record),
                    entityKey: record.id,
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: RegistrantCacheDataFragment): CacheRecord<keyof RegistrantCacheRecord> {
        return {
            id: data.id,
            displayName: data.displayName,
            conferenceRole: data.conferenceRole,
            userId: data.userId ?? "null",
            subconferenceMemberships: JSON.stringify(
                data.subconferenceMemberships.map((x) => ({
                    id: x.id,
                    role: x.role,
                    subconferenceId: x.subconferenceId,
                }))
            ),
        };
    }

    public async getEntity(id: string, fetchIfNotFound = true): Promise<RegistrantEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                displayName: rawEntity.displayName,
                conferenceRole: rawEntity.conferenceRole as Registrant_RegistrantRole_Enum,
                subconferenceMemberships: JSON.parse(rawEntity.subconferenceMemberships),
                userId: rawEntity.userId === "null" ? null : rawEntity.userId,
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof RegistrantEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<RegistrantEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "id" || field === "conferenceRole" || field === "displayName") {
                return rawField as RegistrantEntity[FieldKey];
            } else if (field === "userId") {
                return (rawField === "null" ? null : rawField) as RegistrantEntity[FieldKey];
            } else if (field === "subconferenceMemberships") {
                return JSON.parse(rawField) as RegistrantEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: RegistrantEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                displayName: value.displayName,
                conferenceRole: value.conferenceRole,
                subconferenceMemberships: JSON.stringify(value.subconferenceMemberships),
                userId: value.userId ?? "null",
            }
        );
    }

    public async setField<FieldKey extends keyof RegistrantEntity>(
        id: string,
        field: FieldKey,
        value: RegistrantEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "id" || field === "conferenceRole" || field === "displayName" || field === "userId") {
                await this.cache.setField(id, field, (value ?? "null") as string);
            } else if (field === "subconferenceMemberships") {
                await this.cache.setField(id, field, JSON.stringify(value));
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof RegistrantEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: RegistrantEntity) => RegistrantEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }

    public async hydrateIfNecessary(filters: RegistrantHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
