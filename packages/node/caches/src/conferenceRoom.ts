import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import type {
    ConferenceRoomCacheDataFragment,
    GetConferenceRoomsQuery,
    GetConferenceRoomsQueryVariables,
    Room_ManagementMode_Enum,
} from "./generated/graphql";
import { GetConferenceRoomsDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment ConferenceRoomCacheData on room_Room {
        id
        managementModeName
    }

    query GetConferenceRooms($conferenceId: uuid!) {
        room_Room(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: { _is_null: true } }) {
            ...ConferenceRoomCacheData
        }
    }
`;

export type ConferenceRoomsEntity = Record<string, Room_ManagementMode_Enum>;

type ConferenceRoomCacheRecord = Record<string, string>;

export type ConferenceRoomHydrationFilters = {
    conferenceId: string;
};

function convertToCacheRecord(data: ConferenceRoomCacheDataFragment[]): CacheRecord<keyof ConferenceRoomCacheRecord> {
    return data.reduce<Record<string, string>>((acc, x) => {
        acc[x.id] = x.managementModeName;
        return acc;
    }, {});
}

export const conferenceRoomsCache = (logger: P.Logger) =>
    new TableCache<keyof ConferenceRoomCacheRecord, ConferenceRoomHydrationFilters>(
        logger,
        "ConferenceRoom",
        async (conferenceId) => {
            const response = await gqlClient
                ?.query<GetConferenceRoomsQuery, GetConferenceRoomsQueryVariables>(GetConferenceRoomsDocument, {
                    conferenceId,
                })
                .toPromise();

            const data = response?.data?.room_Room;
            if (data) {
                return convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const response = await gqlClient
                ?.query<GetConferenceRoomsQuery, GetConferenceRoomsQueryVariables>(GetConferenceRoomsDocument, {
                    conferenceId: filters.conferenceId,
                })
                .toPromise();
            if (response?.data) {
                return [{ entityKey: filters.conferenceId, data: convertToCacheRecord(response.data.room_Room) }];
            }

            return undefined;
        }
    );
