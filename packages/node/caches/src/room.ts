import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    GetRoomQuery,
    GetRoomQueryVariables,
    GetRoomsForHydrationQuery,
    GetRoomsForHydrationQueryVariables,
    RoomCacheDataFragment,
    Room_ManagementMode_Enum,
    Room_Room_Bool_Exp,
} from "./generated/graphql";
import { GetRoomDocument, GetRoomsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment RoomCacheData on room_Room {
        id
        name
        conferenceId
        subconferenceId
        managementModeName
    }

    query GetRoom($id: uuid!) {
        room_Room_by_pk(id: $id) {
            ...RoomCacheData
        }
    }

    query GetRoomsForHydration($filters: room_Room_bool_exp!) {
        room_Room(where: $filters) {
            ...RoomCacheData
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

interface RoomCacheRecord {
    id: string;
    name: string;
    conferenceId: string;
    subconferenceId?: string | "null";
    managementModeName: string;
}

export type RoomHydrationFilters =
    | {
          id: string;
      }
    | {
          conferenceId: string;
      }
    | {
          subconferenceId: string;
      };

export class RoomCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof RoomCacheRecord, RoomHydrationFilters>(
        this.logger,
        "Room",
        async (id) => {
            const response = await gqlClient
                ?.query<GetRoomQuery, GetRoomQueryVariables>(GetRoomDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.room_Room_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Room_Room_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.conferenceId = {
                    _eq: filters.conferenceId,
                };
            } else if ("subconferenceId" in filters) {
                gqlFilters.subconferenceId = {
                    _eq: filters.subconferenceId,
                };
            }

            const response = await gqlClient
                ?.query<GetRoomsForHydrationQuery, GetRoomsForHydrationQueryVariables>(GetRoomsForHydrationDocument, {
                    filters: gqlFilters,
                })
                .toPromise();
            if (response?.data) {
                return response.data.room_Room.map((record) => ({
                    data: this.convertToCacheRecord(record),
                    entityKey: record.id,
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: RoomCacheDataFragment): CacheRecord<keyof RoomCacheRecord> {
        return {
            id: data.id,
            name: data.name,
            conferenceId: data.conferenceId,
            subconferenceId: data.subconferenceId ?? "null",
            managementModeName: data.managementModeName,
        };
    }

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

    public async hydrateIfNecessary(filters: RoomHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
