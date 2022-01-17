import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "@urql/core";
import type Redlock from "redlock";
import type {
    GetSubconferenceRoomsQuery,
    GetSubconferenceRoomsQueryVariables,
    Room_ManagementMode_Enum,
} from "./generated/graphql";
import { GetSubconferenceRoomsDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetSubconferenceRooms($subconferenceId: uuid!) {
        room_Room(where: { subconferenceId: { _eq: $subconferenceId } }) {
            id
            managementModeName
        }
    }
`;

export type SubconferenceRoomsEntity = Record<string, Room_ManagementMode_Enum>;

export class SubconferenceRoomsCache extends TableCache {
    constructor(redisClientPool: RedisClientPool, redlock: Redlock, gqlClient: GQLClient) {
        super("SubconferenceRoom", redisClientPool, redlock, async (subconferenceId) => {
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
                return data.reduce<Record<string, string>>((acc, x) => {
                    acc[x.id] = x.managementModeName;
                    return acc;
                }, {});
            }
            return undefined;
        });
    }
}
