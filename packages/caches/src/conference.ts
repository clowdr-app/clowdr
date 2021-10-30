import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type {
    Conference_VisibilityLevel_Enum,
    GetConferenceQuery,
    GetConferenceQueryVariables,
} from "./generated/graphql";
import { GetConferenceDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetConference($id: uuid!) {
        conference_Conference_by_pk(id: $id) {
            id
            shortName
            conferenceVisibilityLevel
            createdBy
            subconferences {
                id
            }
        }
    }
`;

export interface ConferenceEntity {
    id: string;
    shortName: string;
    createdBy: string;
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
    subconferenceIds: string[];
}

class ConferenceCache {
    private readonly cache = new TableCache("Conference", async (id) => {
        const response = await gqlClient
            ?.query<GetConferenceQuery, GetConferenceQueryVariables>(GetConferenceDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.conference_Conference_by_pk;
        if (data) {
            return {
                id: data.id,
                createdBy: data.createdBy,
                conferenceVisibilityLevel: data.conferenceVisibilityLevel,
                subconferenceIds: JSON.stringify(data.subconferences.map((x) => x.id)),
            };
        }
        return undefined;
    });

    public async getEntity(id: string, fetchIfNotFound = true): Promise<ConferenceEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                shortName: rawEntity.shortName,
                conferenceVisibilityLevel: rawEntity.conferenceVisibilityLevel as Conference_VisibilityLevel_Enum,
                createdBy: rawEntity.createdBy,
                subconferenceIds: JSON.parse(rawEntity.subconferenceIds) as string[],
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
                field === "shortName"
            ) {
                return rawField as ConferenceEntity[FieldKey];
            } else if (field === "subconferenceIds") {
                return JSON.parse(rawField) as ConferenceEntity[FieldKey];
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
                conferenceVisibilityLevel: value.conferenceVisibilityLevel,
                subconferenceIds: JSON.stringify(value.subconferenceIds),
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
                field === "shortName"
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
}

export const conferenceCache = new ConferenceCache();
