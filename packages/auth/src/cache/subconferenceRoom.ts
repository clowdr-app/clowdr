import { HashsetCache } from "@midspace/component-clients/cache/hashsetCache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type {
    GetSubconferenceRoomsQuery,
    GetSubconferenceRoomsQueryVariables,
    Room_ManagementMode_Enum,
} from "../generated/graphql";
import { GetSubconferenceRoomsDocument } from "../generated/graphql";

gql`
    query GetSubconferenceRooms($subconferenceId: uuid!) {
        room_Room(where: { subconferenceId: { _eq: $subconferenceId } }) {
            id
            managementModeName
        }
    }
`;

export type SubconferenceRooms = Record<string, Room_ManagementMode_Enum>;

export const SubconferenceRoomCache = new HashsetCache(
    "auth.caches:SubconferenceRoom",
    async (subconferenceId) => {
        const response = await gqlClient
            ?.query<GetSubconferenceRoomsQuery, GetSubconferenceRoomsQueryVariables>(GetSubconferenceRoomsDocument, {
                subconferenceId,
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
    },
    7 * 24 * 60 * 60 * 1000 // Refetch every 7 days
);
