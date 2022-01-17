import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "@urql/core";
import type Redlock from "redlock";
import type {
    GetConferenceRoomsQuery,
    GetConferenceRoomsQueryVariables,
    Room_ManagementMode_Enum,
} from "./generated/graphql";
import { GetConferenceRoomsDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetConferenceRooms($conferenceId: uuid!) {
        room_Room(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: { _is_null: true } }) {
            id
            managementModeName
        }
    }
`;

export type ConferenceRoomsEntity = Record<string, Room_ManagementMode_Enum>;

export class ConferenceRoomsCache extends TableCache {
    constructor(redisClientPool: RedisClientPool, redlock: Redlock, gqlClient: GQLClient) {
        super("ConferenceRoom", redisClientPool, redlock, async (conferenceId) => {
            const response = await gqlClient
                ?.query<GetConferenceRoomsQuery, GetConferenceRoomsQueryVariables>(GetConferenceRoomsDocument, {
                    conferenceId,
                })
                .toPromise();

            const data = response?.data?.room_Room;
            if (data) {
                return data.reduce<Record<string, string>>((acc, x) => {
                    acc[x.id] = x.managementModeName;
                    return acc;
                }, {});
            }
            return undefined;
        });
    }
}
