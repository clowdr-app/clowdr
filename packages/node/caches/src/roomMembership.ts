import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "@urql/core";
import type Redlock from "redlock";
import type {
    GetRoomMembershipsQuery,
    GetRoomMembershipsQueryVariables,
    Room_PersonRole_Enum,
} from "./generated/graphql";
import { GetRoomMembershipsDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetRoomMemberships($roomId: uuid!) {
        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {
            id
            registrantId
            personRoleName
        }
    }
`;

export type RoomMembershipsEntity = Record<string, Room_PersonRole_Enum>;

export class RoomMembershipsCache extends TableCache {
    constructor(redisClientPool: RedisClientPool, redlock: Redlock, gqlClient: GQLClient) {
        super("RoomMembership", redisClientPool, redlock, async (roomId) => {
            const response = await gqlClient
                ?.query<GetRoomMembershipsQuery, GetRoomMembershipsQueryVariables>(GetRoomMembershipsDocument, {
                    roomId,
                })
                .toPromise();

            const data = response?.data?.room_RoomMembership;
            if (data) {
                return data.reduce<Record<string, string>>((acc, x) => {
                    acc[x.registrantId] = x.personRoleName;
                    return acc;
                }, {});
            }
            return undefined;
        });
    }
}
