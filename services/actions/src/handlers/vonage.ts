import { gql } from "@apollo/client/core";
import { shortId } from "../aws/awsClient";
import { GetEventRolesForUserDocument, OngoingBroadcastableVideoRoomEventsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as Vonage from "../lib/vonage/vonageClient";
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
            startTime
            durationSeconds
            endTime
            intendedRoomModeName
            room {
                id
                mediaLiveChannel {
                    rtmpInputUri
                    id
                }
            }
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

    if (!ongoingMatchingEvent.room.mediaLiveChannel?.rtmpInputUri) {
        console.error(
            "No RTMP Push URI available for event room.",
            payload.sessionId,
            ongoingMatchingEvent.id,
            ongoingMatchingEvent.room.id
        );
        return;
    }

    const rtmpUri = ongoingMatchingEvent.room.mediaLiveChannel.rtmpInputUri;
    const rtmpUriParts = rtmpUri.split("/");
    if (rtmpUriParts.length < 2) {
        console.error("RTMP Push URI has unexpected format", payload.sessionId, ongoingMatchingEvent.id, rtmpUri);
        return;
    }
    const streamName = rtmpUriParts[rtmpUriParts.length - 1];
    const serverUrl = rtmpUri.substring(0, rtmpUri.length - streamName.length);

    const existingSessionBroadcasts = await Vonage.listBroadcasts({
        sessionId: payload.sessionId,
    });

    if (!existingSessionBroadcasts) {
        console.error("Could not retrieve existing session broadcasts.", payload.sessionId);
        return;
    }

    const existingBroadcast = existingSessionBroadcasts.find((broadcast) =>
        broadcast.broadcastUrls.rtmp?.find(
            (destination) => destination.serverUrl === ongoingMatchingEvent.room.mediaLiveChannel?.rtmpInputUri
        )
    );

    if (!existingBroadcast) {
        console.log(
            "Starting a broadcast from session to event room",
            payload.sessionId,
            ongoingMatchingEvent.id,
            ongoingMatchingEvent.room.id
        );
        await Vonage.startBroadcast(payload.sessionId, {
            layout: { type: "bestFit" },
            outputs: {
                rtmp: [
                    {
                        id: shortId(),
                        serverUrl,
                        streamName,
                    },
                ],
            },
            resolution: "1280x720",
        });
    } else {
        console.log(
            "There is already an existing RTMP broadcast from the session to the ongoing event.",
            payload.sessionId,
            ongoingMatchingEvent.id
        );
    }
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
