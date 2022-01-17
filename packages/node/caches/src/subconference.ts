import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "graphql-tag";
import type Redlock from "redlock";
import type {
    Conference_VisibilityLevel_Enum,
    GetSubconferenceQuery,
    GetSubconferenceQueryVariables,
} from "./generated/graphql";
import { GetSubconferenceDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetSubconference($id: uuid!) {
        conference_Subconference_by_pk(id: $id) {
            id
            conferenceVisibilityLevel
        }
    }
`;

export interface SubconferenceEntity {
    id: string;
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
}

export class SubconferenceCache {
    constructor(
        private readonly redisClientPool: RedisClientPool,
        private readonly redlock: Redlock,
        private readonly gqlClient: GQLClient
    ) {}

    private readonly cache = new TableCache("Subconference", this.redisClientPool, this.redlock, async (id) => {
        const response = await this.gqlClient
            ?.query<GetSubconferenceQuery, GetSubconferenceQueryVariables>(GetSubconferenceDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.conference_Subconference_by_pk;
        if (data) {
            return {
                id: data.id,
                conferenceVisibilityLevel: data.conferenceVisibilityLevel,
            };
        }
        return undefined;
    });

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
}
