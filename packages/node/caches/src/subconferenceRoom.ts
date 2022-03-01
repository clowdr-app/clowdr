import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import * as R from "ramda";
import type {
    GetSubconferenceRoomsForHydrationQuery,
    GetSubconferenceRoomsForHydrationQueryVariables,
    GetSubconferenceRoomsQuery,
    GetSubconferenceRoomsQueryVariables,
    Room_ManagementMode_Enum,
    Room_Room_Bool_Exp,
    SubconferenceRoomCacheDataFragment,
} from "./generated/graphql";
import { GetSubconferenceRoomsDocument, GetSubconferenceRoomsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment SubconferenceRoomCacheData on room_Room {
        id
        managementModeName
    }

    query GetSubconferenceRooms($subconferenceId: uuid!) {
        room_Room(where: { subconferenceId: { _eq: $subconferenceId } }) {
            ...SubconferenceRoomCacheData
        }
    }

    query GetSubconferenceRoomsForHydration($filters: room_Room_bool_exp!) {
        room_Room(where: $filters) {
            subconferenceId
            ...SubconferenceRoomCacheData
        }
    }
`;

export type SubconferenceRoomsEntity = Record<string, Room_ManagementMode_Enum>;

type SubconferenceRoomCacheRecord = Record<string, string>;

export type SubconferenceRoomHydrationFilters =
    | {
          conferenceId: string;
      }
    | {
          subconferenceId: string;
      };

function convertToCacheRecord(
    data: SubconferenceRoomCacheDataFragment[]
): CacheRecord<keyof SubconferenceRoomCacheRecord> {
    return data.reduce<Record<string, string>>((acc, x) => {
        acc[x.id] = x.managementModeName;
        return acc;
    }, {});
}

export const subconferenceRoomsCache = (logger: P.Logger) =>
    new TableCache(
        logger,
        "SubconferenceRoom",
        async (subconferenceId) => {
            const response = await gqlClient
                ?.query<GetSubconferenceRoomsQuery, GetSubconferenceRoomsQueryVariables>(
                    GetSubconferenceRoomsDocument,
                    {
                        subconferenceId,
                    }
                )
                .toPromise();

            const data = response?.data?.room_Room;
            if (data) {
                return convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Room_Room_Bool_Exp = {};

            if ("subconferenceId" in filters) {
                gqlFilters.subconferenceId = {
                    _eq: filters.subconferenceId,
                };
            } else {
                gqlFilters.subconferenceId = {
                    _is_null: false,
                };
            }

            if ("conferenceId" in filters) {
                gqlFilters.conferenceId = {
                    _eq: filters.conferenceId,
                };
            }

            const response = await gqlClient
                ?.query<GetSubconferenceRoomsForHydrationQuery, GetSubconferenceRoomsForHydrationQueryVariables>(
                    GetSubconferenceRoomsForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                const groups = R.groupBy((x) => x.subconferenceId, response.data.room_Room);
                return Object.entries(groups).map(([subconferenceId, record]) => ({
                    entityKey: subconferenceId,
                    data: convertToCacheRecord(record),
                }));
            }

            return undefined;
        }
    );
