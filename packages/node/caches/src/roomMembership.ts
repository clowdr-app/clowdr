import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type P from "pino";
import * as R from "ramda";
import type {
    GetRoomMembershipsForHydrationQuery,
    GetRoomMembershipsForHydrationQueryVariables,
    GetRoomMembershipsQuery,
    GetRoomMembershipsQueryVariables,
    RoomMembershipCacheDataFragment,
    Room_PersonRole_Enum,
    Room_RoomMembership_Bool_Exp,
} from "./generated/graphql";
import { GetRoomMembershipsDocument, GetRoomMembershipsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment RoomMembershipCacheData on room_RoomMembership {
        id
        registrantId
        personRoleName
    }

    query GetRoomMemberships($roomId: uuid!) {
        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {
            ...RoomMembershipCacheData
        }
    }

    query GetRoomMembershipsForHydration($filters: room_RoomMembership_bool_exp!) {
        room_RoomMembership(where: $filters) {
            roomId
            ...RoomMembershipCacheData
        }
    }
`;

export type RoomMembershipsEntity = Record<string, Room_PersonRole_Enum>;

type RoomMembershipsCacheRecord = Record<string, string>;

export type RoomMembershipsHydrationFilters =
    | {
          registrantId: string;
      }
    | {
          roomId: string;
      }
    | {
          conferenceId: string;
      };

function convertToCacheRecord(data: RoomMembershipCacheDataFragment[]): CacheRecord<keyof RoomMembershipsCacheRecord> {
    return data.reduce<Record<string, string>>((acc, x) => {
        acc[x.registrantId] = x.personRoleName;
        return acc;
    }, {});
}

export const roomMembershipsCache = (logger: P.Logger) =>
    new TableCache<keyof RoomMembershipsCacheRecord, RoomMembershipsHydrationFilters>(
        logger,
        "RoomMembership",
        async (roomId) => {
            const response = await gqlClient
                ?.query<GetRoomMembershipsQuery, GetRoomMembershipsQueryVariables>(GetRoomMembershipsDocument, {
                    roomId,
                })
                .toPromise();

            const data = response?.data?.room_RoomMembership;
            if (data) {
                return convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Room_RoomMembership_Bool_Exp = {};

            if ("roomId" in filters) {
                gqlFilters.roomId = {
                    _eq: filters.roomId,
                };
            } else if ("registrantId" in filters) {
                gqlFilters.registrantId = {
                    _eq: filters.registrantId,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.room = {
                    conferenceId: {
                        _eq: filters.conferenceId,
                    },
                };
            }

            const response = await gqlClient
                ?.query<GetRoomMembershipsForHydrationQuery, GetRoomMembershipsForHydrationQueryVariables>(
                    GetRoomMembershipsForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                const groups = R.groupBy((x) => x.roomId, response.data.room_RoomMembership);
                return Object.entries(groups).map(([roomId, record]) => ({
                    entityKey: roomId,
                    data: convertToCacheRecord(record),
                }));
            }

            return undefined;
        }
    );
