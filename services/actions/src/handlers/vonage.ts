import { gql } from "@apollo/client/core";
import {
    GetEventRolesForUserDocument,
    GetRoomWhereUserAttendsConferenceDocument,
    OngoingBroadcastableVideoRoomEventsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as Vonage from "../lib/vonage/vonageClient";
import { startEventBroadcast } from "../lib/vonage/vonageTools";
import { WebhookReqBody } from "../types/vonage";

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

export async function handleVonageSessionMonitoringWebhook(payload: WebhookReqBody): Promise<void> {
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
        return;
    }

    if (ongoingMatchingEvents.data.Event.length === 0) {
        console.log("No ongoing broadcast events connected to this session.", payload.sessionId);
        return;
    }

    if (ongoingMatchingEvents.data.Event.length > 1) {
        console.error(
            "Unexpectedly found multiple ongoing broadcast events connected to this session. Aborting.",
            payload.sessionId
        );
        return;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.Event[0];

    await startEventBroadcast(ongoingMatchingEvent.id);
}

gql`
    query GetEventRolesForUser($eventId: uuid!, $userId: String!) {
        Event_by_pk(id: $eventId) {
            eventPeople(where: { attendee: { userId: { _eq: $userId } } }) {
                id
                roleName
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

    const accessToken = Vonage.vonage.generateToken(rolesResult.data.Event_by_pk.eventVonageSession.sessionId, {
        data: `userId=${userId}`,
        role: "moderator", // TODO: change depending on event person role
    });

    return {
        accessToken,
    };
}

gql`
    query GetRoomWhereUserAttendsConference($roomId: uuid, $userId: String) {
        Room(where: { id: { _eq: $roomId }, conference: { attendees: { userId: { _eq: $userId } } } }) {
            id
            publicVonageSessionId
        }
    }
`;

export async function handleJoinRoom(
    payload: joinRoomVonageSessionArgs,
    userId: string
): Promise<JoinRoomVonageSessionOutput> {
    // TODO: check the user's roles explicitly, rather than just conference attendee-ship
    const roomResult = await apolloClient.query({
        query: GetRoomWhereUserAttendsConferenceDocument,
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
        throw new Error("No Vonage session exists for room");
    }

    const accessToken = Vonage.vonage.generateToken(room.publicVonageSessionId, {
        data: `userId=${userId}`,
        role: "publisher",
    });

    return {
        accessToken,
        sessionId: room.publicVonageSessionId,
    };
}
