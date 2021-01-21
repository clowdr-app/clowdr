import { gql } from "@apollo/client/core";
import { GetRoomThatUserCanJoinDocument, Vonage_GetEventDetailsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getAttendee } from "../lib/authorisation";
import {
    addAndRemoveEventParticipantStreams,
    addAndRemoveRoomParticipants,
    startBroadcastIfOngoingEvent,
} from "../lib/vonage/sessionMonitoring";
import Vonage from "../lib/vonage/vonageClient";
import { CustomConnectionData, WebhookReqBody } from "../types/vonage";

gql`
    query OngoingBroadcastableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        Event(
            where: {
                eventVonageSession: { sessionId: { _eq: $sessionId } }
                intendedRoomModeName: { _in: [Q_AND_A, PRESENTATION] }
                endTime: { _gt: $time }
                startTime: { _lte: $time }
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

    try {
        success &&= await addAndRemoveEventParticipantStreams(payload);
    } catch (e) {
        console.error("Error while adding/removing event participant streams", e);
        success = false;
    }

    return success;
}

gql`
    query Vonage_GetEventDetails($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            conferenceId
            id
            eventVonageSession {
                id
                sessionId
            }
        }
    }
`;

export async function handleJoinEvent(
    payload: joinEventVonageSessionArgs,
    userId: string
): Promise<{ accessToken?: string }> {
    const result = await apolloClient.query({
        query: Vonage_GetEventDetailsDocument,
        variables: {
            eventId: payload.eventId,
        },
    });

    if (!result.data || !result.data.Event_by_pk || result.error) {
        console.error("Could not retrieve event information", payload.eventId);
        return {};
    }

    if (!result.data.Event_by_pk.eventVonageSession) {
        console.error("Could not retrieve Vonage session associated with event", payload.eventId);
        return {};
    }

    let attendee;
    try {
        attendee = await getAttendee(userId, result.data.Event_by_pk.conferenceId);
    } catch (e) {
        console.error(
            "User does not have attendee at conference, refusing event join token",
            userId,
            payload.eventId,
            e
        );
        return {};
    }

    const connectionData: CustomConnectionData = {
        attendeeId: attendee.id,
        userId,
    };

    try {
        const accessToken = Vonage.vonage.generateToken(result.data.Event_by_pk.eventVonageSession.sessionId, {
            data: JSON.stringify(connectionData),
            role: "publisher",
        });
        return { accessToken };
    } catch (e) {
        console.error(
            "Failure while generating event Vonage session token",
            payload.eventId,
            result.data.Event_by_pk.eventVonageSession.sessionId,
            e
        );
    }

    return {};
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
