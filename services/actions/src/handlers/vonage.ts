import { gql } from "@apollo/client/core";
import { Vonage_GetEventDetailsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getRegistrant } from "../lib/authorisation";
import { canUserJoinRoom, getRoomConferenceId, getRoomVonageMeeting as getRoomVonageSession } from "../lib/room";
import {
    addAndRemoveEventParticipantStreams,
    addAndRemoveRoomParticipants,
    startBroadcastIfOngoingEvent,
} from "../lib/vonage/sessionMonitoring";
import Vonage from "../lib/vonage/vonageClient";
import { CustomConnectionData, WebhookReqBody } from "../types/vonage";

gql`
    query OngoingBroadcastableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        schedule_Event(
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
        schedule_Event_by_pk(id: $eventId) {
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

    if (!result.data || !result.data.schedule_Event_by_pk || result.error) {
        console.error("Could not retrieve event information", payload.eventId);
        return {};
    }

    if (!result.data.schedule_Event_by_pk.eventVonageSession) {
        console.error("Could not retrieve Vonage session associated with event", payload.eventId);
        return {};
    }

    let registrant;
    try {
        registrant = await getRegistrant(userId, result.data.schedule_Event_by_pk.conferenceId);
    } catch (e) {
        console.error(
            "User does not have registrant at conference, refusing event join token",
            userId,
            payload.eventId,
            e
        );
        return {};
    }

    const connectionData: CustomConnectionData = {
        registrantId: registrant.id,
        userId,
    };

    try {
        const accessToken = Vonage.vonage.generateToken(result.data.schedule_Event_by_pk.eventVonageSession.sessionId, {
            data: JSON.stringify(connectionData),
            role: "publisher",
        });
        return { accessToken };
    } catch (e) {
        console.error(
            "Failure while generating event Vonage session token",
            payload.eventId,
            result.data.schedule_Event_by_pk.eventVonageSession.sessionId,
            e
        );
    }

    return {};
}

gql`
    query GetRoomThatUserCanJoin($roomId: uuid, $userId: String) {
        room_Room_by_pk(id: { _eq: $roomId }) {
            id
            publicVonageSessionId
        }
    }
`;

export async function handleJoinRoom(
    payload: joinRoomVonageSessionArgs,
    userId: string
): Promise<JoinRoomVonageSessionOutput> {
    const roomConferenceId = await getRoomConferenceId(payload.roomId);
    const registrant = await getRegistrant(userId, roomConferenceId);
    const canJoinRoom = await canUserJoinRoom(registrant.id, payload.roomId, roomConferenceId);

    if (!canJoinRoom) {
        console.warn("User tried to join a Vonage room, but was not permitted", { payload, userId });
        throw new Error("User is not permitted to join this room");
    }

    const maybeVonageMeetingId = await getRoomVonageSession(payload.roomId);

    if (!maybeVonageMeetingId) {
        console.error("Could not get Vonage meeting id", { payload, userId, registrantId: registrant.id });
        return {
            message: "Could not find meeting",
        };
    }

    const connectionData: CustomConnectionData = {
        registrantId: registrant.id,
        userId,
    };

    const accessToken = Vonage.vonage.generateToken(maybeVonageMeetingId, {
        data: JSON.stringify(connectionData),
        role: "publisher",
    });

    return {
        accessToken,
        sessionId: maybeVonageMeetingId,
    };
}
