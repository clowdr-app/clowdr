import { gql } from "@apollo/client/core";
import { assertType } from "typescript-is";
import {
    CreateRoomParticipantDocument,
    GetRoomBySessionIdDocument,
    OngoingBroadcastableVideoRoomEventsDocument,
    RemoveRoomParticipantDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { CustomConnectionData, WebhookReqBody } from "../../types/vonage";
import { startEventBroadcast } from "./vonageTools";

export async function startBroadcastIfOngoingEvent(payload: WebhookReqBody): Promise<boolean> {
    const ongoingMatchingEvents = await apolloClient.query({
        query: OngoingBroadcastableVideoRoomEventsDocument,
        variables: {
            sessionId: payload.sessionId,
            time: new Date().toISOString(),
        },
    });

    if (ongoingMatchingEvents.error || ongoingMatchingEvents.errors) {
        console.error(
            "Error while retrieving ongoing broadcast events related to a Vonage session.",
            payload.sessionId,
            ongoingMatchingEvents.error,
            ongoingMatchingEvents.errors
        );
        return false;
    }

    if (ongoingMatchingEvents.data.Event.length === 0) {
        console.log("No ongoing broadcast events connected to this session.", payload.sessionId);
        return true;
    }

    if (ongoingMatchingEvents.data.Event.length > 1) {
        console.error(
            "Unexpectedly found multiple ongoing broadcast events connected to this session. Aborting.",
            payload.sessionId
        );
        return false;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.Event[0];

    await startEventBroadcast(ongoingMatchingEvent.id);

    return true;
}

export async function addAndRemoveRoomParticipants(payload: WebhookReqBody): Promise<boolean> {
    let success = true;

    if (payload.event === "connectionCreated") {
        try {
            console.log("connectionCreated: adding participant to room", payload.sessionId, payload.connection.data);
            await addRoomParticipant(payload.sessionId, payload.connection.data);
        } catch (e) {
            console.error(
                "Failed to handle Vonage connectionCreated event",
                payload.sessionId,
                payload.connection.data
            );
            success = false;
        }
    }

    if (payload.event === "connectionDestroyed") {
        try {
            console.log(
                "connectionDestroyed: removing participant from room",
                payload.sessionId,
                payload.connection.data
            );
            await removeRoomParticipant(payload.sessionId, payload.connection.data);
        } catch (e) {
            console.error(
                "Failed to handle Vonage connectionDestroyed event",
                payload.sessionId,
                payload.connection.data
            );
            success = false;
        }
    }

    return success;
}

gql`
    query GetRoomBySessionId($sessionId: String!) {
        Room(where: { publicVonageSessionId: { _eq: $sessionId } }) {
            id
            conferenceId
        }
    }

    mutation CreateRoomParticipant($attendeeId: uuid!, $conferenceId: uuid!, $roomId: uuid!) {
        insert_RoomParticipant_one(
            on_conflict: { constraint: RoomParticipant_roomId_attendeeId_key, update_columns: updatedAt }
            object: { attendeeId: $attendeeId, conferenceId: $conferenceId, roomId: $roomId }
        ) {
            id
        }
    }

    mutation RemoveRoomParticipant($attendeeId: uuid!, $conferenceId: uuid!, $roomId: uuid!) {
        delete_RoomParticipant(
            where: { attendeeId: { _eq: $attendeeId }, conferenceId: { _eq: $conferenceId }, roomId: { _eq: $roomId } }
        ) {
            affected_rows
        }
    }
`;

export async function addRoomParticipant(sessionId: string, connectionData: string): Promise<void> {
    const data = JSON.parse(connectionData);
    const { attendeeId } = assertType<CustomConnectionData>(data);

    const result = await apolloClient.query({
        query: GetRoomBySessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (result.error || result.errors) {
        console.error("Could not retrieve room from Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not retrieve room from Vonage session ID");
    }

    if (result.data.Room.length !== 1) {
        console.error("Could not find room associated with Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not find room associated with Vonage session ID");
    }

    await apolloClient.mutate({
        mutation: CreateRoomParticipantDocument,
        variables: {
            attendeeId,
            conferenceId: result.data.Room[0].conferenceId,
            roomId: result.data.Room[0].id,
        },
    });
}

export async function removeRoomParticipant(sessionId: string, connectionData: string): Promise<void> {
    const data = JSON.parse(connectionData);
    const { attendeeId } = assertType<CustomConnectionData>(data);

    const result = await apolloClient.query({
        query: GetRoomBySessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (result.error || result.errors) {
        console.error("Could not retrieve room from Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not retrieve room from Vonage session ID");
    }

    if (result.data.Room.length !== 1) {
        console.error("Could not find room associated with Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not find room associated with Vonage session ID");
    }

    await apolloClient.mutate({
        mutation: RemoveRoomParticipantDocument,
        variables: {
            attendeeId,
            conferenceId: result.data.Room[0].conferenceId,
            roomId: result.data.Room[0].id,
        },
    });
}
