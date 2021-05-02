import { gql } from "@apollo/client/core";
import { DeleteRoomChimeMeetingDocument, DeleteRoomChimeMeetingForRoomDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function deleteRoomChimeMeeting(chimeMeetingId: string): Promise<void> {
    gql`
        mutation DeleteRoomChimeMeeting($chimeMeetingId: uuid!) {
            delete_room_ChimeMeeting_by_pk(id: $chimeMeetingId) {
                id
            }
        }
    `;
    await apolloClient.mutate({
        mutation: DeleteRoomChimeMeetingDocument,
        variables: {
            chimeMeetingId,
        },
    });
}

export async function deleteRoomChimeMeetingForRoom(roomId: string, chimeMeetingId: string): Promise<number> {
    gql`
        mutation DeleteRoomChimeMeetingForRoom($roomId: uuid!, $chimeMeetingId: String!) {
            delete_room_ChimeMeeting(where: { roomId: { _eq: $roomId }, chimeMeetingId: { _eq: $chimeMeetingId } }) {
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

    return result.data?.delete_room_ChimeMeeting?.affected_rows ?? 0;
}
