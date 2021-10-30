import { HashsetCache } from "@midspace/component-clients/cache/hashsetCache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type {
    GetConferenceRoomsQuery,
    GetConferenceRoomsQueryVariables,
    Room_ManagementMode_Enum,
} from "../generated/graphql";
import { GetConferenceRoomsDocument } from "../generated/graphql";

gql`
    query GetConferenceRooms($conferenceId: uuid!) {
        room_Room(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: { _is_null: true } }) {
            id
            managementModeName
        }
    }
`;

export type ConferenceRooms = Record<string, Room_ManagementMode_Enum>;

export const ConferenceRoomCache = new HashsetCache(
    "auth.caches:ConferenceRoom",
    async (conferenceId) => {
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
    },
    7 * 24 * 60 * 60 * 1000 // Refetch every 7 days
);
