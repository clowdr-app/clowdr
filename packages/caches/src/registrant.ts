import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type {
    GetRegistrantQuery,
    GetRegistrantQueryVariables,
    Registrant_RegistrantRole_Enum,
} from "./generated/graphql";
import { GetRegistrantDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetRegistrant($id: uuid!) {
        registrant_Registrant_by_pk(id: $id) {
            id
            conferenceRole
            displayName
            subconferenceMemberships {
                id
                subconferenceId
                role
            }
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
    subconferenceMemberships: SubconferenceMembership[];
}

class RegistrantCache {
    private readonly cache = new TableCache("Registrant", async (id) => {
        const response = await gqlClient
            ?.query<GetRegistrantQuery, GetRegistrantQueryVariables>(GetRegistrantDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.registrant_Registrant_by_pk;
        if (data) {
            return {
                id: data.id,
                displayName: data.displayName,
                conferenceRole: data.conferenceRole,
                subconferenceMemberships: JSON.stringify(
                    data.subconferenceMemberships.map((x) => ({
                        id: x.id,
                        role: x.role,
                        subconferenceId: x.subconferenceId,
                    }))
                ),
            };
        }
        return undefined;
    });

    public async getEntity(id: string, fetchIfNotFound = true): Promise<RegistrantEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                displayName: rawEntity.displayName,
                conferenceRole: rawEntity.conferenceRole as Registrant_RegistrantRole_Enum,
                subconferenceMemberships: JSON.parse(rawEntity.subconferenceMemberships),
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
            if (field === "id" || field === "conferenceRole" || field === "displayName") {
                await this.cache.setField(id, field, value as string);
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
}

export const registrantCache = new RegistrantCache();
