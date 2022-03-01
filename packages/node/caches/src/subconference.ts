import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    Conference_Subconference_Bool_Exp,
    Conference_VisibilityLevel_Enum,
    GetSubconferenceQuery,
    GetSubconferenceQueryVariables,
    GetSubconferencesForHydrationQuery,
    GetSubconferencesForHydrationQueryVariables,
    SubconferenceCacheDataFragment,
} from "./generated/graphql";
import { GetSubconferenceDocument, GetSubconferencesForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment SubconferenceCacheData on conference_Subconference {
        id
        conferenceVisibilityLevel
    }

    query GetSubconference($id: uuid!) {
        conference_Subconference_by_pk(id: $id) {
            ...SubconferenceCacheData
        }
    }

    query GetSubconferencesForHydration($filters: conference_Subconference_bool_exp!) {
        conference_Subconference(where: $filters) {
            ...SubconferenceCacheData
        }
    }
`;

export interface SubconferenceEntity {
    id: string;
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
}

interface SubconferenceCacheRecord {
    id: string;
    conferenceVisibilityLevel: string;
}

export type SubconferenceHydrationFilters =
    | {
          id: string;
      }
    | {
          conferenceId: string;
      };

export class SubconferenceCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof SubconferenceCacheRecord, SubconferenceHydrationFilters>(
        this.logger,
        "Subconference",
        async (id) => {
            const response = await gqlClient
                ?.query<GetSubconferenceQuery, GetSubconferenceQueryVariables>(GetSubconferenceDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.conference_Subconference_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Conference_Subconference_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.conferenceId = {
                    _eq: filters.conferenceId,
                };
            }

            const response = await gqlClient
                ?.query<GetSubconferencesForHydrationQuery, GetSubconferencesForHydrationQueryVariables>(
                    GetSubconferencesForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                return response.data.conference_Subconference.map((record) => ({
                    data: this.convertToCacheRecord(record),
                    entityKey: record.id,
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: SubconferenceCacheDataFragment): CacheRecord<keyof SubconferenceCacheRecord> {
        return {
            id: data.id,
            conferenceVisibilityLevel: data.conferenceVisibilityLevel,
        };
    }

    public async getEntity(id: string, fetchIfNotFound = true): Promise<SubconferenceEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                conferenceVisibilityLevel: rawEntity.conferenceVisibilityLevel as Conference_VisibilityLevel_Enum,
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof SubconferenceEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<SubconferenceEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "id" || field === "conferenceVisibilityLevel") {
                return rawField as SubconferenceEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: SubconferenceEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                conferenceVisibilityLevel: value.conferenceVisibilityLevel,
            }
        );
    }

    public async setField<FieldKey extends keyof SubconferenceEntity>(
        id: string,
        field: FieldKey,
        value: SubconferenceEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "id" || field === "conferenceVisibilityLevel") {
                await this.cache.setField(id, field, value as string);
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof SubconferenceEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: SubconferenceEntity) => SubconferenceEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }

    public async hydrateIfNecessary(filters: SubconferenceHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
