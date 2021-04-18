import { gql } from "@apollo/client/core";
import {
    CreateRoomParticipantDocument,
    DeleteRoomParticipantsCreatedBeforeDocument,
    GetRoomParticipantDetailsDocument,
    RemoveRoomParticipantDocument,
    RoomParticipantFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { kickAttendeeFromRoom } from "./vonage/vonageTools";

gql`
    mutation CreateRoomParticipant(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $roomId: uuid!
        $vonageConnectionId: String
        $chimeAttendeeId: String
    ) {
        insert_RoomParticipant_one(
            object: {
                attendeeId: $attendeeId
                conferenceId: $conferenceId
                roomId: $roomId
                vonageConnectionId: $vonageConnectionId
                chimeAttendeeId: $chimeAttendeeId
            }
        ) {
            id
        }
    }
`;

export async function addRoomParticipant(
    roomId: string,
    conferenceId: string,
    identifier: { vonageConnectionId: string } | { chimeAttendeeId: string },
    attendeeId: string
): Promise<void> {
    const participantIdentifier =
        "vonageConnectionId" in identifier
            ? { vonageConnectionId: identifier.vonageConnectionId }
            : { chimeAttendeeId: identifier.chimeAttendeeId };

    try {
        await apolloClient.mutate({
            mutation: CreateRoomParticipantDocument,
            variables: {
                attendeeId,
                conferenceId,
                roomId,
                vonageConnectionId: null,
                chimeAttendeeId: null,
                ...participantIdentifier,
            },
        });
    } catch (err) {
        if ("vonageConnectionId" in identifier) {
            // If there is already a row for this room, kick the previous connection before recording the new one
            console.info("Attendee is already in the Vonage room, kicking from previous session", {
                roomId,
                attendeeId,
                conferenceId,
            });
            await kickAttendeeFromRoom(roomId, attendeeId);

            await apolloClient.mutate({
                mutation: CreateRoomParticipantDocument,
                variables: {
                    attendeeId,
                    conferenceId,
                    roomId,
                    vonageConnectionId: null,
                    chimeAttendeeId: null,
                    ...participantIdentifier,
                },
            });
        } else {
            console.info("Attendee is already in the Chime room, ignoring", {
                roomId,
                attendeeId,
                conferenceId,
            });
        }
    }
}

gql`
    mutation RemoveRoomParticipant(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $roomId: uuid!
        $vonageConnectionId: String
        $chimeAttendeeId: String
    ) {
        delete_RoomParticipant(
            where: { attendeeId: { _eq: $attendeeId }, conferenceId: { _eq: $conferenceId }, roomId: { _eq: $roomId } }
        ) {
            affected_rows
        }
    }
`;

export async function removeRoomParticipant(roomId: string, conferenceId: string, attendeeId: string): Promise<void> {
    try {
        const removeResult = await apolloClient.mutate({
            mutation: RemoveRoomParticipantDocument,
            variables: {
                attendeeId,
                conferenceId,
                roomId,
            },
        });

        if (
            !removeResult.data?.delete_RoomParticipant?.affected_rows ||
            removeResult.data.delete_RoomParticipant.affected_rows === 0
        ) {
            console.warn("Could not find participant to remove for room", { roomId, attendeeId });
        }
    } catch (err) {
        console.error("Failed to remove RoomParticipant record", { roomId, conferenceId, attendeeId, err });
        throw new Error("Failed to remove RoomParticipant record");
    }
}

export async function getRoomParticipantDetails(
    roomId: string,
    attendeeId: string
): Promise<RoomParticipantFragment[]> {
    gql`
        query GetRoomParticipantDetails($roomId: uuid!, $attendeeId: uuid!) {
            RoomParticipant(where: { roomId: { _eq: $roomId }, attendeeId: { _eq: $attendeeId } }) {
                ...RoomParticipant
            }
        }

        fragment RoomParticipant on RoomParticipant {
            id
            room {
                id
                conferenceId
                publicVonageSessionId
                roomChimeMeeting {
                    id
                    chimeMeetingId
                }
            }
            vonageConnectionId
            chimeAttendeeId
        }
    `;

    const result = await apolloClient.query({
        query: GetRoomParticipantDetailsDocument,
        variables: {
            attendeeId,
            roomId,
        },
    });

    return result.data.RoomParticipant;
}

export async function deleteRoomParticipantsCreatedBefore(date: Date): Promise<number> {
    gql`
        mutation DeleteRoomParticipantsCreatedBefore($before: timestamptz!) {
            delete_RoomParticipant(where: { createdAt: { _lte: $before } }) {
                affected_rows
            }
        }
    `;

    const result = await apolloClient.mutate({
        mutation: DeleteRoomParticipantsCreatedBeforeDocument,
        variables: {
            before: date.toISOString(),
        },
    });

    return result.data?.delete_RoomParticipant?.affected_rows ?? 0;
}
