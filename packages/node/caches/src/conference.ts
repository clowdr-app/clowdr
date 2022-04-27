import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    ConferenceCacheDataFragment,
    Conference_Conference_Bool_Exp,
    Conference_VisibilityLevel_Enum,
    GetConferenceQuery,
    GetConferenceQueryVariables,
    GetConferencesForHydrationQuery,
    GetConferencesForHydrationQueryVariables,
    Registrant_RegistrantRole_Enum,
} from "./generated/graphql";
import { GetConferenceDocument, GetConferencesForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment ConferenceCacheData on conference_Conference {
        id
        shortName
        slug
        conferenceVisibilityLevel
        createdBy
        lowestRoleWithAccess
        subconferences {
            id
        }
    }

    query GetConference($id: uuid!) {
        conference_Conference_by_pk(id: $id) {
            ...ConferenceCacheData
        }
    }

    query GetConferencesForHydration($filters: conference_Conference_bool_exp!) {
        conference_Conference(where: $filters) {
            ...ConferenceCacheData
        }
    }
`;

export interface ConferenceEntity {
    id: string;
    shortName: string;
    createdBy: string;
    slug: string;
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
    subconferenceIds: string[];
    lowestRoleWithAccess?: Registrant_RegistrantRole_Enum | null;
}

interface ConferenceCacheRecord {
    id: string;
    shortName: string;
    createdBy: string;
    slug: string;
    conferenceVisibilityLevel: string;
    subconferenceIds: string;
    lowestRoleWithAccess: Registrant_RegistrantRole_Enum | "null";
}

export type ConferenceHydrationFilters =
    | {
          id: string;
      }
    | {
          slug: string;
      };

export class ConferenceCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof ConferenceCacheRecord, ConferenceHydrationFilters>(
        this.logger,
        "Conference",
        async (id) => {
            if (id === "NONE" || id === "") {
                return undefined;
            }

            const response = await gqlClient
                ?.query<GetConferenceQuery, GetConferenceQueryVariables>(GetConferenceDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.conference_Conference_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Conference_Conference_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            } else if ("slug" in filters) {
                gqlFilters.slug = {
                    _eq: filters.slug,
                };
            }

            const response = await gqlClient
                ?.query<GetConferencesForHydrationQuery, GetConferencesForHydrationQueryVariables>(
                    GetConferencesForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                return response.data.conference_Conference.map((record) => ({
                    data: this.convertToCacheRecord(record),
                    entityKey: record.id,
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: ConferenceCacheDataFragment): CacheRecord<keyof ConferenceCacheRecord> {
        return {
            id: data.id,
            shortName: data.shortName,
            createdBy: data.createdBy,
            slug: data.slug,
            conferenceVisibilityLevel: data.conferenceVisibilityLevel,
            subconferenceIds: JSON.stringify(data.subconferences.map((x) => x.id)),
            lowestRoleWithAccess: data.lowestRoleWithAccess ?? "null",
        };
    }

    public async getEntity(id: string, fetchIfNotFound = true): Promise<ConferenceEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                shortName: rawEntity.shortName,
                slug: rawEntity.slug,
                conferenceVisibilityLevel: rawEntity.conferenceVisibilityLevel as Conference_VisibilityLevel_Enum,
                createdBy: rawEntity.createdBy,
                subconferenceIds: JSON.parse(rawEntity.subconferenceIds) as string[],
                lowestRoleWithAccess:
                    rawEntity.lowestRoleWithAccess === "null"
                        ? null
                        : (rawEntity.lowestRoleWithAccess as Registrant_RegistrantRole_Enum),
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof ConferenceEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<ConferenceEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (
                field === "id" ||
                field === "conferenceVisibilityLevel" ||
                field === "createdBy" ||
                field === "shortName" ||
                field === "slug"
            ) {
                return rawField as ConferenceEntity[FieldKey];
            } else if (field === "subconferenceIds") {
                return JSON.parse(rawField) as ConferenceEntity[FieldKey];
            } else if (field === "lowestRoleWithAccess") {
                return (rawField === "null" ? null : rawField) as ConferenceEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: ConferenceEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                shortName: value.shortName,
                createdBy: value.createdBy,
                slug: value.slug,
                conferenceVisibilityLevel: value.conferenceVisibilityLevel,
                subconferenceIds: JSON.stringify(value.subconferenceIds),
                lowestRoleWithAccess: value.lowestRoleWithAccess ?? "null",
            }
        );
    }

    public async setField<FieldKey extends keyof ConferenceEntity>(
        id: string,
        field: FieldKey,
        value: ConferenceEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (
                field === "id" ||
                field === "conferenceVisibilityLevel" ||
                field === "createdBy" ||
                field === "shortName" ||
                field === "slug" ||
                field === "lowestRoleWithAccess"
            ) {
                await this.cache.setField(id, field, value as string);
            } else if (field === "subconferenceIds") {
                await this.cache.setField(id, field, JSON.stringify(value));
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof ConferenceEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: ConferenceEntity) => ConferenceEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }

    public async hydrateIfNecessary(filters: ConferenceHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
