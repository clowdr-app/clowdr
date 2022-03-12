import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    EventCacheDataFragment,
    GetEventQuery,
    GetEventQueryVariables,
    GetEventsForHydrationQuery,
    GetEventsForHydrationQueryVariables,
    Schedule_Event_Bool_Exp,
} from "./generated/graphql";
import { GetEventDocument, GetEventsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment EventCacheData on schedule_Event {
        id
        conferenceId
        roomId
    }

    query GetEvent($id: uuid!) {
        schedule_Event_by_pk(id: $id) {
            ...EventCacheData
        }
    }

    query GetEventsForHydration($filters: schedule_Event_bool_exp!) {
        schedule_Event(where: $filters) {
            ...EventCacheData
        }
    }
`;

export interface EventEntity {
    id: string;
    conferenceId: string;
    roomId: string;
}

interface EventCacheRecord {
    id: string;
    conferenceId: string;
    roomId: string;
}

export type EventHydrationFilters =
    | {
          id: string;
      }
    | ((
          | {
                conferenceId: string;
            }
          | {
                roomId: string;
            }
      ) &
          (
              | {
                    startLte: string;
                }
              | {
                    endGte: string;
                }
              | {
                    startLte: string;
                    endGte: string;
                }
          ));

export class EventCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<keyof EventCacheRecord, EventHydrationFilters>(
        this.logger,
        "Event",
        async (id) => {
            const response = await gqlClient
                ?.query<GetEventQuery, GetEventQueryVariables>(GetEventDocument, {
                    id,
                })
                .toPromise();

            const data = response?.data?.schedule_Event_by_pk;
            if (data) {
                return this.convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Schedule_Event_Bool_Exp = {};

            if ("id" in filters) {
                gqlFilters.id = {
                    _eq: filters.id,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.conferenceId = {
                    _eq: filters.conferenceId,
                };
            } else if ("roomId" in filters) {
                gqlFilters.roomId = {
                    _eq: filters.roomId,
                };
            }

            if ("startLte" in filters) {
                gqlFilters.scheduledStartTime = {
                    _lte: filters.startLte,
                };
            }
            if ("endGte" in filters) {
                gqlFilters.scheduledEndTime = {
                    _lte: filters.endGte,
                };
            }

            const response = await gqlClient
                ?.query<GetEventsForHydrationQuery, GetEventsForHydrationQueryVariables>(
                    GetEventsForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                return response.data.schedule_Event.map((record) => ({
                    data: this.convertToCacheRecord(record),
                    entityKey: record.id,
                }));
            }

            return undefined;
        }
    );

    private convertToCacheRecord(data: EventCacheDataFragment): CacheRecord<keyof EventCacheRecord> {
        return {
            id: data.id,
            conferenceId: data.conferenceId,
            roomId: data.roomId,
        };
    }

    public async getEntity(id: string, fetchIfNotFound = true): Promise<EventEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                id: rawEntity.id,
                conferenceId: rawEntity.conferenceId,
                roomId: rawEntity.roomId,
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof EventEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<EventEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "id" || field === "conferenceId" || field === "roomId") {
                return rawField as EventEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: EventEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                id: value.id,
                conferenceId: value.conferenceId,
                roomId: value.roomId,
            }
        );
    }

    public async setField<FieldKey extends keyof EventEntity>(
        id: string,
        field: FieldKey,
        value: EventEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "id" || field === "conferenceId" || field === "roomId") {
                await this.cache.setField(id, field, value as string);
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof EventEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: EventEntity) => EventEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, fetchIfNotFound);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        }
    }

    public async hydrateIfNecessary(filters: EventHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
