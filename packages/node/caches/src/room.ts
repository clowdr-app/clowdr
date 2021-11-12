import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type { GetRoomQuery, GetRoomQueryVariables, Room_ManagementMode_Enum } from "./generated/graphql";
import { GetRoomDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetRoom($id: uuid!) {
        room_Room_by_pk(id: $id) {
            id
            name
            conferenceId
            subconferenceId
            managementModeName
        }
    }
`;

export interface RoomEntity {
    id: string;
    name: string;
    conferenceId: string;
    subconferenceId?: string | null;
    managementModeName: Room_ManagementMode_Enum;
}

class RoomCache {
    private readonly cache = new TableCache("Room", async (id) => {
        const response = await gqlClient
            ?.query<GetRoomQuery, GetRoomQueryVariables>(GetRoomDocument, {
                id,
            })
            .toPromise();

        const data = response?.data?.room_Room_by_pk;
        if (data) {
            return {
                id: data.id,
                name: data.name,
                conferenceId: data.conferenceId,
                subconferenceId: data.subconferenceId ?? "null",
                managementModeName: data.managementModeName,
            };
        }
        return undefined;
    });

    public async getEntity(id: string, fetchIfNotFound = true): Promise<RoomEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                name: rawEntity.name,
                conferenceId: rawEntity.conferenceId,
                subconferenceId: rawEntity.subconferenceId === "null" ? null : rawEntity.subconferenceId,
                managementModeName: rawEntity.managementModeName as Room_ManagementMode_Enum,
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof RoomEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<RoomEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (rawField === "null") {
                return null as RoomEntity[FieldKey];
            }
            return rawField as RoomEntity[FieldKey];
        }
        return undefined;
    }

    public async setEntity(id: string, value: RoomEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                name: value.name,
                conferenceId: value.conferenceId,
                subconferenceId: value.subconferenceId ?? "null",
                managementModeName: value.managementModeName as Room_ManagementMode_Enum,
            }
        );
    }

    public async setField<FieldKey extends keyof RoomEntity>(
        id: string,
        field: FieldKey,
        value: RoomEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            await this.cache.setField(id, field, (value ?? "null") as string);
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof RoomEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: RoomEntity) => RoomEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }
}

export const roomCache = new RoomCache();
