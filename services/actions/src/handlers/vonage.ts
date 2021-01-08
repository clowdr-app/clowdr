import { gql } from "@apollo/client/core";
import { GetEventRolesForUserDocument, GetRoomThatUserCanJoinDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { addAndRemoveRoomParticipants, startBroadcastIfOngoingEvent } from "../lib/vonage/sessionMonitoring";
import * as Vonage from "../lib/vonage/vonageClient";
import { CustomConnectionData, WebhookReqBody } from "../types/vonage";

gql`
    query OngoingBroadcastableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        Event(
            where: {
                endTime: { _gt: $time }
                startTime: { _lte: $time }
                intendedRoomModeName: { _in: [Q_AND_A, PRESENTATION] }
                eventVonageSession: { sessionId: { _eq: $sessionId } }
            }
        ) {
            id
        }
    }
`;

export async function handleVonageSessionMonitoringWebhook(payload: WebhookReqBody): Promise<boolean> {
    let success = true;

    try {
        success &&= await startBroadcastIfOngoingEvent(payload);
    } catch (e) {
        console.error("Error while starting broadcast if ongoing event", e);
        success = false;
    }

    try {
        success &&= await addAndRemoveRoomParticipants(payload);
    } catch (e) {
        console.error("Error while adding/removing room participants", e);
        success = false;
    }

    return success;
}

gql`
    query GetEventRolesForUser($eventId: uuid!, $userId: String!) {
        Event_by_pk(id: $eventId) {
            eventPeople(where: { attendee: { userId: { _eq: $userId } } }) {
                id
                roleName
                attendee {
                    id
                    displayName
                }
            }
            eventVonageSession {
                sessionId
                id
            }
            id
        }
    }
`;

export async function handleJoinEvent(
    payload: joinEventVonageSessionArgs,
    userId: string
): Promise<{ accessToken?: string }> {
    const rolesResult = await apolloClient.query({
        query: GetEventRolesForUserDocument,
        variables: {
            eventId: payload.eventId,
            userId,
        },
    });

    if (rolesResult.error || rolesResult.errors) {
        console.error(
            "Could not retrieve event roles for user",
            payload.eventId,
            userId,
            rolesResult.error,
            rolesResult.errors
        );
        return {};
    }

    if (!rolesResult.data.Event_by_pk) {
        console.error("Could not find event", payload.eventId);
        return {};
    }

    if (rolesResult.data.Event_by_pk.eventPeople.length < 1) {
        console.log("User denied access to event Vonage session: has no event roles", payload.eventId, userId);
        return {};
    }

    if (!rolesResult.data.Event_by_pk.eventVonageSession) {
        console.error("No Vonage session has been created for event", payload.eventId, userId);
        // TODO: generate a session on the fly
        return {};
    }

    if (!rolesResult.data.Event_by_pk.eventPeople[0].attendee) {
        console.error("Could not find attendee for user", payload.eventId, userId);
        return {};
    }

    const attendeeId = rolesResult.data.Event_by_pk.eventPeople[0].attendee.id;

    const connectionData: CustomConnectionData = {
        attendeeId,
        userId,
    };

    const accessToken = Vonage.vonage.generateToken(rolesResult.data.Event_by_pk.eventVonageSession.sessionId, {
        data: JSON.stringify(connectionData),
        role: "moderator", // TODO: change depending on event person role
    });

    return {
        accessToken,
    };
}

gql`
    query GetRoomThatUserCanJoin($roomId: uuid, $userId: String) {
        Room(
            where: {
                id: { _eq: $roomId }
                conference: { attendees: { userId: { _eq: $userId } } }
                _or: [{ roomPeople: { attendee: { userId: { _eq: $userId } } } }, { roomPrivacyName: { _eq: PUBLIC } }]
            }
        ) {
            id
            publicVonageSessionId
            conference {
                attendees(where: { userId: { _eq: $userId } }) {
                    id
                }
            }
        }
    }
`;

export async function handleJoinRoom(
    payload: joinRoomVonageSessionArgs,
    userId: string
): Promise<JoinRoomVonageSessionOutput> {
    // TODO: check the user's roles explicitly, rather than just conference attendee-ship
    const roomResult = await apolloClient.query({
        query: GetRoomThatUserCanJoinDocument,
        variables: {
            roomId: payload.roomId,
            userId,
        },
    });

    if (roomResult.data.Room.length === 0) {
        console.warn("Could not find room to generate Vonage access token", payload.roomId);
        return {};
    }

    const room = roomResult.data.Room[0];

    if (!room.publicVonageSessionId) {
        console.warn("Could not find Vonage session for room", payload.roomId, userId);
        throw new Error("No Vonage session exists for room");
    }

    if (roomResult.data.Room[0].conference.attendees.length === 0) {
        console.warn("Could not find attendee for the user", payload.roomId, userId);
        throw new Error("Could not find attendee for the user");
    }

    const attendeeId = roomResult.data.Room[0].conference.attendees[0].id;

    const connectionData: CustomConnectionData = {
        attendeeId,
        userId,
    };

    const accessToken = Vonage.vonage.generateToken(room.publicVonageSessionId, {
        data: JSON.stringify(connectionData),
        role: "publisher",
    });

    return {
        accessToken,
        sessionId: room.publicVonageSessionId,
    };
}
