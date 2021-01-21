import { gql } from "@apollo/client/core";
import {
    CreateEventParticipantStreamDocument,
    CreateRoomParticipantDocument,
    GetEventBroadcastDetailsDocument,
    GetEventByVonageSessionIdDocument,
    GetRoomBySessionIdDocument,
    GetRoomParticipantDetailsDocument,
    RemoveEventParticipantStreamDocument,
    RemoveRoomParticipantDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { StreamData } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import { shortId } from "../aws/awsClient";
import Vonage from "./vonageClient";

gql`
    query GetEventBroadcastDetails($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
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
            eventVonageSession {
                sessionId
                id
            }
        }
    }
`;

interface EventBroadcastDetails {
    rtmpServerUrl: string;
    rtmpStreamName: string;
    vonageSessionId: string;
}

export async function getEventBroadcastDetails(eventId: string): Promise<EventBroadcastDetails> {
    const eventResult = await apolloClient.query({
        query: GetEventBroadcastDetailsDocument,
        variables: {
            eventId,
        },
    });

    if (!eventResult.data.Event_by_pk) {
        throw new Error("Could not find event");
    }

    if (!eventResult.data.Event_by_pk.room.mediaLiveChannel?.rtmpInputUri) {
        throw new Error("No RTMP Push URI available for event room.");
    }

    const rtmpUri = eventResult.data.Event_by_pk.room.mediaLiveChannel.rtmpInputUri;
    const rtmpUriParts = rtmpUri.split("/");
    if (rtmpUriParts.length < 2) {
        throw new Error("RTMP Push URI has unexpected format");
    }
    const streamName = rtmpUriParts[rtmpUriParts.length - 1];
    const serverUrl = rtmpUri.substring(0, rtmpUri.length - streamName.length);

    if (!eventResult.data.Event_by_pk.eventVonageSession?.sessionId) {
        throw new Error("Could not find Vonage session ID for event");
    }

    return {
        rtmpServerUrl: serverUrl,
        rtmpStreamName: streamName,
        vonageSessionId: eventResult.data.Event_by_pk.eventVonageSession.sessionId,
    };
}

export async function startEventBroadcast(eventId: string): Promise<void> {
    let broadcastDetails: EventBroadcastDetails;
    try {
        broadcastDetails = await callWithRetry(async () => await getEventBroadcastDetails(eventId));
    } catch (e) {
        console.error("Error retrieving Vonage broadcast details for event", e);
        return;
    }

    const existingSessionBroadcasts = await callWithRetry(
        async () =>
            await Vonage.listBroadcasts({
                sessionId: broadcastDetails.vonageSessionId,
            })
    );

    if (!existingSessionBroadcasts) {
        console.error("Could not retrieve existing session broadcasts.", broadcastDetails.vonageSessionId);
        return;
    }

    const startedSessionBroadcasts = existingSessionBroadcasts?.filter((broadcast) => broadcast.status === "started");

    console.log(
        `Vonage session has ${startedSessionBroadcasts.length} existing live broadcasts`,
        broadcastDetails.vonageSessionId,
        startedSessionBroadcasts
    );

    if (startedSessionBroadcasts.length > 1) {
        console.warn(
            "Found more than one live broadcast for session - which is not allowed. Stopping them.",
            broadcastDetails.vonageSessionId
        );
        for (const broadcast of startedSessionBroadcasts) {
            try {
                await Vonage.stopBroadcast(broadcast.id);
            } catch (e) {
                console.error(
                    "Error while stopping invalid broadcast",
                    broadcastDetails.vonageSessionId,
                    broadcast.status,
                    e
                );
            }
        }
    }

    const existingBroadcast = startedSessionBroadcasts.find((broadcast) =>
        broadcast.broadcastUrls.rtmp?.find(
            (destination) =>
                destination.serverUrl === broadcastDetails.rtmpServerUrl &&
                destination.streamName === broadcastDetails.rtmpStreamName
        )
    );

    if (!existingBroadcast) {
        const rtmpId = shortId();
        console.log(
            "Starting a broadcast from session to event room",
            broadcastDetails.vonageSessionId,
            eventId,
            rtmpId
        );
        try {
            await Vonage.startBroadcast(broadcastDetails.vonageSessionId, {
                layout: { type: "bestFit" },
                outputs: {
                    rtmp: [
                        {
                            id: rtmpId,
                            serverUrl: broadcastDetails.rtmpServerUrl,
                            streamName: broadcastDetails.rtmpStreamName,
                        },
                    ],
                },
                resolution: "1280x720",
            });
        } catch (e) {
            console.error("Failed to start broadcast", broadcastDetails.vonageSessionId, eventId, e);
            return;
        }
    } else {
        console.log(
            "There is already an existing RTMP broadcast from the session to the ongoing event.",
            broadcastDetails.vonageSessionId,
            eventId
        );
    }
}

export async function stopEventBroadcasts(eventId: string): Promise<void> {
    let broadcastDetails: EventBroadcastDetails;
    try {
        broadcastDetails = await callWithRetry(async () => await getEventBroadcastDetails(eventId));
    } catch (e) {
        console.error("Error retrieving Vonage broadcast details for event", e);
        return;
    }

    const existingSessionBroadcasts = await callWithRetry(
        async () =>
            await Vonage.listBroadcasts({
                sessionId: broadcastDetails.vonageSessionId,
            })
    );

    if (!existingSessionBroadcasts) {
        console.error("Could not retrieve existing session broadcasts.", broadcastDetails.vonageSessionId);
        return;
    }

    for (const existingBroadcast of existingSessionBroadcasts) {
        try {
            if (existingBroadcast.status === "started") {
                await callWithRetry(async () => await Vonage.stopBroadcast(existingBroadcast.id));
            }
        } catch (e) {
            console.error("Could not stop existing session broadcast", eventId, existingBroadcast.id);
        }
    }
}

gql`
    query GetRoomParticipantDetails($roomId: uuid!, $attendeeId: uuid!) {
        RoomParticipant(where: { roomId: { _eq: $roomId }, attendeeId: { _eq: $attendeeId } }) {
            id
            room {
                id
                publicVonageSessionId
            }
            vonageConnectionId
        }
    }
`;

export async function kickAttendeeFromRoom(roomId: string, attendeeId: string): Promise<void> {
    const participantResult = await apolloClient.query({
        query: GetRoomParticipantDetailsDocument,
        variables: {
            attendeeId,
            roomId,
        },
    });

    if (participantResult.error || participantResult.errors) {
        console.error(
            "Error while retrieving participant to be kicked",
            roomId,
            attendeeId,
            participantResult.error,
            participantResult.errors
        );
        throw new Error("Error while retrieving participant to be kicked");
    }

    if (participantResult.data.RoomParticipant.length !== 1) {
        console.error("Could not find a room participant to kick", roomId, attendeeId);
        throw new Error("Could not find a room participant to kick");
    }

    if (!participantResult.data.RoomParticipant[0].room.publicVonageSessionId) {
        console.error("Could not find Vonage session to kick participant from", roomId, attendeeId);
        throw new Error("Could not find Vonage session to kick participant from");
    }

    await Vonage.forceDisconnect(
        participantResult.data.RoomParticipant[0].room.publicVonageSessionId,
        participantResult.data.RoomParticipant[0].vonageConnectionId
    );

    await removeRoomParticipant(
        participantResult.data.RoomParticipant[0].room.publicVonageSessionId,
        attendeeId,
        participantResult.data.RoomParticipant[0].vonageConnectionId
    );
}

gql`
    query GetRoomBySessionId($sessionId: String!) {
        Room(where: { publicVonageSessionId: { _eq: $sessionId } }) {
            id
            conferenceId
        }
    }

    mutation CreateRoomParticipant(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $roomId: uuid!
        $vonageConnectionId: String!
    ) {
        insert_RoomParticipant_one(
            object: {
                attendeeId: $attendeeId
                conferenceId: $conferenceId
                roomId: $roomId
                vonageConnectionId: $vonageConnectionId
            }
        ) {
            id
        }
    }
`;

export async function addRoomParticipant(
    sessionId: string,
    vonageConnectionId: string,
    attendeeId: string
): Promise<void> {
    const roomResult = await apolloClient.query({
        query: GetRoomBySessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (roomResult.error || roomResult.errors) {
        console.error("Could not retrieve room from Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not retrieve room from Vonage session ID");
    }

    if (roomResult.data.Room.length !== 1) {
        console.log("No room matching this session, skipping participant addition.", sessionId, attendeeId);
        return;
    }

    try {
        await apolloClient.mutate({
            mutation: CreateRoomParticipantDocument,
            variables: {
                attendeeId,
                conferenceId: roomResult.data.Room[0].conferenceId,
                roomId: roomResult.data.Room[0].id,
                vonageConnectionId,
            },
        });
    } catch (e) {
        // If there is already a row for this room, kick the previous connection before recording the new one
        console.log(
            "Attendee is already in the room, kicking from previous session",
            roomResult.data.Room[0].id,
            attendeeId
        );
        await kickAttendeeFromRoom(roomResult.data.Room[0].id, attendeeId);

        await apolloClient.mutate({
            mutation: CreateRoomParticipantDocument,
            variables: {
                attendeeId,
                conferenceId: roomResult.data.Room[0].conferenceId,
                roomId: roomResult.data.Room[0].id,
                vonageConnectionId,
            },
        });
    }
}

gql`
    mutation RemoveRoomParticipant(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $roomId: uuid!
        $vonageConnectionId: String!
    ) {
        delete_RoomParticipant(
            where: {
                attendeeId: { _eq: $attendeeId }
                conferenceId: { _eq: $conferenceId }
                _or: [{ roomId: { _eq: $roomId } }, { vonageConnectionId: { _eq: $vonageConnectionId } }]
            }
        ) {
            affected_rows
        }
    }
`;

export async function removeRoomParticipant(
    sessionId: string,
    attendeeId: string,
    vonageConnectionId: string
): Promise<void> {
    const result = await apolloClient.query({
        query: GetRoomBySessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (result.error || result.errors) {
        console.log("Could not retrieve room from Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not retrieve room from Vonage session ID");
    }

    if (result.data.Room.length !== 1) {
        console.log("No room matching this session, skipping participant removal.", sessionId, attendeeId);
        return;
    }

    const removeResult = await apolloClient.mutate({
        mutation: RemoveRoomParticipantDocument,
        variables: {
            attendeeId,
            conferenceId: result.data.Room[0].conferenceId,
            roomId: result.data.Room[0].id,
            vonageConnectionId,
        },
    });

    if (
        !removeResult.data?.delete_RoomParticipant?.affected_rows ||
        removeResult.data.delete_RoomParticipant.affected_rows === 0
    ) {
        console.warn("Could not find participant to remove for room", sessionId, attendeeId);
    }
}

gql`
    query GetEventByVonageSessionId($sessionId: String!) {
        Event(where: { eventVonageSession: { sessionId: { _eq: $sessionId } } }) {
            id
            conferenceId
        }
    }

    mutation CreateEventParticipantStream(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $eventId: uuid!
        $vonageConnectionId: String!
        $vonageStreamId: String!
        $vonageStreamType: String!
    ) {
        insert_EventParticipantStream_one(
            object: {
                attendeeId: $attendeeId
                conferenceId: $conferenceId
                eventId: $eventId
                vonageConnectionId: $vonageConnectionId
                vonageStreamId: $vonageStreamId
                vonageStreamType: $vonageStreamType
            }
        ) {
            id
        }
    }
`;

export async function addEventParticipantStream(
    sessionId: string,
    attendeeId: string,
    stream: StreamData
): Promise<void> {
    const eventResult = await apolloClient.query({
        query: GetEventByVonageSessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (eventResult.error || eventResult.errors) {
        console.error("Error while retrieving event from Vonage session ID", sessionId, attendeeId);
        throw new Error("Error while retrieving event from Vonage session ID");
    }

    if (eventResult.data.Event.length !== 1) {
        console.log("No event matching this session, skipping participant addition.", sessionId, attendeeId);
        return;
    }

    try {
        await apolloClient.mutate({
            mutation: CreateEventParticipantStreamDocument,
            variables: {
                attendeeId,
                conferenceId: eventResult.data.Event[0].conferenceId,
                eventId: eventResult.data.Event[0].id,
                vonageConnectionId: stream.connection.id,
                vonageStreamId: stream.id,
                vonageStreamType: stream.videoType ?? "camera",
            },
        });
    } catch (e) {
        // If there is already a row for this event, kick the previous connection before recording the new one
        console.error(
            "Error while adding event participant stream",
            eventResult.data.Event[0].id,
            attendeeId,
            stream.id
        );
        throw new Error("Error while adding event participant stream");
    }
}

gql`
    mutation RemoveEventParticipantStream(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $eventId: uuid!
        $vonageConnectionId: String!
        $vonageStreamId: String!
    ) {
        delete_EventParticipantStream(
            where: {
                attendeeId: { _eq: $attendeeId }
                conferenceId: { _eq: $conferenceId }
                eventId: { _eq: $eventId }
                vonageConnectionId: { _eq: $vonageConnectionId }
                vonageStreamId: { _eq: $vonageStreamId }
            }
        ) {
            affected_rows
        }
    }
`;

export async function removeEventParticipantStream(
    sessionId: string,
    attendeeId: string,
    stream: StreamData
): Promise<void> {
    const eventResult = await apolloClient.query({
        query: GetEventByVonageSessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (eventResult.error || eventResult.errors) {
        console.log("Could not retrieve event from Vonage session ID", sessionId, attendeeId);
        throw new Error("Could not retrieve event from Vonage session ID");
    }

    if (eventResult.data.Event.length !== 1) {
        console.log("No event matching this session, skipping participant stream removal.", sessionId, attendeeId);
        return;
    }

    const removeResult = await apolloClient.mutate({
        mutation: RemoveEventParticipantStreamDocument,
        variables: {
            attendeeId,
            conferenceId: eventResult.data.Event[0].conferenceId,
            eventId: eventResult.data.Event[0].id,
            vonageConnectionId: stream.connection.id,
            vonageStreamId: stream.id,
        },
    });

    if (
        !removeResult.data?.delete_EventParticipantStream?.affected_rows ||
        removeResult.data.delete_EventParticipantStream.affected_rows === 0
    ) {
        console.warn("Could not find participant stream to remove for event", sessionId, attendeeId, stream.id);
    }
}
