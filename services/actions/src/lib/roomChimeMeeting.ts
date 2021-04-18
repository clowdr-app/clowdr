import { gql } from "@apollo/client/core";
import { DeleteRoomChimeMeetingDocument, DeleteRoomChimeMeetingForRoomDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function deleteRoomChimeMeeting(roomChimeMeetingId: string): Promise<void> {
    gql`
        mutation DeleteRoomChimeMeeting($roomChimeMeetingId: uuid!) {
            delete_room_RoomChimeMeeting_by_pk(id: $roomChimeMeetingId) {
                id
            }
        }
    `;
    await apolloClient.mutate({
        mutation: DeleteRoomChimeMeetingDocument,
        variables: {
            roomChimeMeetingId: roomChimeMeetingId,
        },
    });
}

export async function deleteRoomChimeMeetingForRoom(roomId: string, chimeMeetingId: string): Promise<number> {
    gql`
        mutation DeleteRoomChimeMeetingForRoom($roomId: uuid!, $chimeMeetingId: String!) {
            delete_room_RoomChimeMeeting(
                where: { roomId: { _eq: $roomId }, chimeMeetingId: { _eq: $chimeMeetingId } }
            ) {
                affected_rows
            }
        }
    `;

    const result = await apolloClient.mutate({
        mutation: DeleteRoomChimeMeetingForRoomDocument,
        variables: {
            roomId,
            chimeMeetingId,
        },
    });

    return result.data?.delete_room_RoomChimeMeeting?.affected_rows ?? 0;
}
