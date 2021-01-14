import { gql } from "@apollo/client/core";
import assert from "assert";
import {
    AddAttendeeToRoomPeopleDocument,
    GetAttendeesForRoomAndUserDocument,
    RoomPersonRole_Enum,
    SetRoomVonageSessionIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { Payload, RoomData } from "../types/hasura/event";

export async function handleRoomCreated(payload: Payload<RoomData>): Promise<void> {
    assert(payload.event.data.new, "Expected new row data");

    if (!payload.event.data.new.publicVonageSessionId) {
        await createRoomVonageSession(payload.event.data.new.id);
    }

    // If room was created by a user, add them as an admin
    if ("x-hasura-user-id" in payload.event.session_variables) {
        await addUserToRoomPeople(
            payload.event.session_variables["x-hasura-user-id"],
            payload.event.data.new.id,
            RoomPersonRole_Enum.Admin
        );
    }
}

async function createRoomVonageSession(roomId: string): Promise<string> {
    const sessionResult = await Vonage.createSession({ mediaMode: "routed" });

    if (!sessionResult) {
        throw new Error("No session ID returned from Vonage");
    }

    gql`
        mutation SetRoomVonageSessionId($roomId: uuid!, $sessionId: String!) {
            update_Room_by_pk(pk_columns: { id: $roomId }, _set: { publicVonageSessionId: $sessionId }) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: SetRoomVonageSessionIdDocument,
        variables: {
            roomId: roomId,
            sessionId: sessionResult.sessionId,
        },
    });

    return sessionResult.sessionId;
}

export async function addUserToRoomPeople(userId: string, roomId: string, role: RoomPersonRole_Enum): Promise<void> {
    gql`
        query GetAttendeesForRoomAndUser($roomId: uuid!, $userId: String!) {
            Room_by_pk(id: $roomId) {
                id
                conference {
                    attendees(where: { userId: { _eq: $userId } }) {
                        userId
                        id
                    }
                    id
                }
            }
        }
    `;

    const result = await apolloClient.query({
        query: GetAttendeesForRoomAndUserDocument,
        variables: {
            roomId,
            userId,
        },
    });

    if (result.error || result.errors) {
        console.error("Failed to get attendee to be added to the room people list", userId, roomId);
        throw new Error("Failed to get attendee to be added to the room people list");
    }

    if (
        !result.data.Room_by_pk?.conference.attendees ||
        result.data.Room_by_pk.conference.attendees.length === 0 ||
        !result.data.Room_by_pk.conference.attendees[0].userId
    ) {
        console.error("Could not find an attendee to be added to the room people list", userId, roomId);
        throw new Error("Could not find an attendee to be added to the room people list");
    }

    const attendeeId = result.data.Room_by_pk.conference.attendees[0].id;

    gql`
        mutation AddAttendeeToRoomPeople(
            $attendeeId: uuid!
            $roomId: uuid!
            $roomPersonRoleName: RoomPersonRole_enum!
        ) {
            insert_RoomPerson_one(
                object: { attendeeId: $attendeeId, roomId: $roomId, roomPersonRoleName: $roomPersonRoleName }
            ) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: AddAttendeeToRoomPeopleDocument,
        variables: {
            attendeeId,
            roomId,
            roomPersonRoleName: role,
        },
    });
}
