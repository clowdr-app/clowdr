import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    DeleteRoomMutation,
    DeleteRoomMutationVariables,
    GetRoomQuery,
    GetRoomQueryVariables,
    InsertRoomMutation,
    InsertRoomMutationVariables,
    RoomFragment,
    Room_Room_Insert_Input,
    Room_Room_Set_Input,
    UpdateRoomMutation,
    UpdateRoomMutationVariables,
} from "../generated/graphql";
import { DeleteRoomDocument, GetRoomDocument, InsertRoomDocument, UpdateRoomDocument } from "../generated/graphql";
import extractActualError from "./extractError";

gql`
    fragment Room on room_Room {
        id
        created_at
        updated_at
        conferenceId
        name
        capacity
        publicVonageSessionId
        priority
        managementModeName
        chatId
        itemId
        backendName
        colour
        subconferenceId
    }

    query GetRoom($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            ...Room
        }
    }

    mutation InsertRoom($object: room_Room_insert_input!) {
        insert_room_Room_one(object: $object) {
            ...Room
        }
    }

    mutation UpdateRoom($roomId: uuid!, $set: room_Room_set_input!) {
        update_room_Room_by_pk(pk_columns: { id: $roomId }, _set: $set) {
            ...Room
        }
    }

    mutation DeleteRoom($roomId: uuid!) {
        delete_room_Room_by_pk(id: $roomId) {
            id
        }
    }
`;

export async function getRoom(roomId: string): Promise<RoomFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetRoomQuery, GetRoomQueryVariables>(GetRoomDocument, {
            roomId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.room_Room_by_pk) {
        throw new Error("No data");
    }
    return response.data.room_Room_by_pk;
}

export async function insertRoom(object: Room_Room_Insert_Input): Promise<RoomFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<InsertRoomMutation, InsertRoomMutationVariables>(InsertRoomDocument, {
            object,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.insert_room_Room_one) {
        throw new Error("No insert response");
    }
    return response.data.insert_room_Room_one;
}

export async function updateRoom(roomId: string, set: Room_Room_Set_Input): Promise<RoomFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateRoomMutation, UpdateRoomMutationVariables>(UpdateRoomDocument, {
            roomId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.update_room_Room_by_pk) {
        throw new Error("No update response");
    }
    return response.data.update_room_Room_by_pk;
}

export async function deleteRoom(roomId: string): Promise<string> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<DeleteRoomMutation, DeleteRoomMutationVariables>(DeleteRoomDocument, {
            roomId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.delete_room_Room_by_pk) {
        throw new Error("No delete response");
    }
    return response.data.delete_room_Room_by_pk.id;
}
