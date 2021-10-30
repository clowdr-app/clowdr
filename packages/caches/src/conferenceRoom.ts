import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
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

export const conferenceRoomsCache = new TableCache("ConferenceRoom", async (conferenceId) => {
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
