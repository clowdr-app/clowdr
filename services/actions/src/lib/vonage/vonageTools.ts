import { gql } from "@apollo/client/core";
import { DeleteAttendeeCommand } from "@aws-sdk/client-chime";
import {
    CreateEventParticipantStreamDocument,
    GetEventBroadcastDetailsDocument,
    GetEventByVonageSessionIdDocument,
    GetRoomArchiveDetailsDocument,
    RemoveEventParticipantStreamDocument,
    Video_RtmpInput_Enum,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { StreamData } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import { Chime, shortId } from "../aws/awsClient";
import { getRoomParticipantDetails, removeRoomParticipant } from "../roomParticipant";
import Vonage from "./vonageClient";

gql`
    query GetEventBroadcastDetails($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            room {
                id
                channelStack {
                    rtmpAInputUri
                    rtmpBInputUri
                    id
                }
            }
            eventVonageSession {
                sessionId
                id
                rtmpInputName
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

    if (!eventResult.data.schedule_Event_by_pk) {
        throw new Error("Could not find event");
    }

    if (!eventResult.data.schedule_Event_by_pk.eventVonageSession) {
        throw new Error("Could not find event Vonage session");
    }

    if (!eventResult.data.schedule_Event_by_pk.room.channelStack) {
        throw new Error("Could not find MediaLive channel for event");
    }

    const rtmpUri =
        eventResult.data.schedule_Event_by_pk.eventVonageSession.rtmpInputName === Video_RtmpInput_Enum.RtmpB
            ? eventResult.data.schedule_Event_by_pk.room.channelStack?.rtmpBInputUri ??
              eventResult.data.schedule_Event_by_pk.room.channelStack.rtmpAInputUri
            : eventResult.data.schedule_Event_by_pk.room.channelStack.rtmpAInputUri;

    const rtmpUriParts = rtmpUri.split("/");
    if (rtmpUriParts.length < 2) {
        throw new Error("RTMP Push URI has unexpected format");
    }
    const streamName = rtmpUriParts[rtmpUriParts.length - 1];
    const serverUrl = rtmpUri.substring(0, rtmpUri.length - streamName.length);

    if (!eventResult.data.schedule_Event_by_pk.eventVonageSession?.sessionId) {
        throw new Error("Could not find Vonage session ID for event");
    }

    return {
        rtmpServerUrl: serverUrl,
        rtmpStreamName: streamName,
        vonageSessionId: eventResult.data.schedule_Event_by_pk.eventVonageSession.sessionId,
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

    if (existingSessionBroadcasts === undefined) {
        console.error("Could not retrieve existing session broadcasts.", broadcastDetails.vonageSessionId);
        return;
    }

    let startedSessionBroadcasts = existingSessionBroadcasts?.filter((broadcast) => broadcast.status === "started");

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

        startedSessionBroadcasts = [];
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
            const broadcast = await Vonage.startBroadcast(broadcastDetails.vonageSessionId, {
                layout: {
                    type: "bestFit",
                    screenshareType: "verticalPresentation",
                },
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
            console.log("Started Vonage RTMP broadcast", broadcast.id, broadcastDetails.vonageSessionId, eventId);
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
            console.error("Could not stop existing session broadcast", eventId, existingBroadcast.id, e);
        }
    }
}

gql`
    query GetRoomArchiveDetails($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            publicVonageSessionId
            id
        }
    }
`;

interface RoomArchiveDetails {
    vonageSessionId: string;
}

export async function getRoomArchiveDetails(roomId: string): Promise<RoomArchiveDetails> {
    const eventResult = await apolloClient.query({
        query: GetRoomArchiveDetailsDocument,
        variables: {
            roomId,
        },
    });

    if (!eventResult.data.room_Room_by_pk) {
        throw new Error("Could not find room");
    }

    if (!eventResult.data.room_Room_by_pk.publicVonageSessionId) {
        throw new Error("Could not find Vonage session ID for room");
    }

    return {
        vonageSessionId: eventResult.data.room_Room_by_pk.publicVonageSessionId,
    };
}

export async function startRoomVonageArchiving(roomId: string, eventId: string | undefined): Promise<void> {
    let archiveDetails: RoomArchiveDetails;
    try {
        archiveDetails = await callWithRetry(async () => await getRoomArchiveDetails(roomId));
    } catch (e) {
        console.error("Error retrieving Vonage broadcast details for room", e);
        return;
    }

    const existingSessionArchives = await callWithRetry(
        async () =>
            await Vonage.listArchives({
                sessionId: archiveDetails.vonageSessionId,
            })
    );

    if (existingSessionArchives === undefined) {
        console.error("Could not retrieve existing session archives.", archiveDetails.vonageSessionId);
        return;
    }

    let startedSessionArchives = existingSessionArchives?.filter(
        (archive) => archive.status === "started" || archive.status === "paused"
    );

    console.log(
        `Vonage session has ${startedSessionArchives.length} existing live archives`,
        archiveDetails.vonageSessionId,
        startedSessionArchives
    );

    if (
        startedSessionArchives.filter(
            (archive) => !archive.name.startsWith(roomId) || archive.name.split("/")[1] !== eventId
        ).length > 0
    ) {
        console.warn("Stopping previous archives of the session.", archiveDetails.vonageSessionId);

        for (const archive of startedSessionArchives) {
            try {
                await Vonage.stopArchive(archive.id);
            } catch (e) {
                console.error(
                    "Error while stopping previous archive",
                    archiveDetails.vonageSessionId,
                    archive.status,
                    e
                );
            }
        }

        startedSessionArchives = [];
    }

    const existingArchive = startedSessionArchives.find(
        (archive) => archive.name.startsWith(roomId) && archive.name.split("/")[1] === eventId
    );
    if (!existingArchive) {
        console.log("Starting archive for session", archiveDetails.vonageSessionId, roomId);
        try {
            const archive = await Vonage.startArchive(archiveDetails.vonageSessionId, {
                name: roomId + (eventId ? "/" + eventId : ""),
                resolution: "1280x720",
                outputMode: "composed",
                hasAudio: true,
                hasVideo: true,
                layout: {
                    type: "bestFit",
                    screenshareType: "verticalPresentation",
                },
            });

            if (archive) {
                console.log("Started Vonage archive", archive.id, archiveDetails.vonageSessionId, roomId);
            } else {
                throw new Error("No archive returned by Vonage");
            }
        } catch (e) {
            console.error("Failed to start archive", archiveDetails.vonageSessionId, roomId, e);
            return;
        }
    } else {
        console.log("There is already an existing archive for the session.", archiveDetails.vonageSessionId, roomId);
    }
}

export async function stopRoomVonageArchiving(roomId: string, eventId: string | undefined): Promise<void> {
    let archiveDetails: RoomArchiveDetails;
    try {
        archiveDetails = await callWithRetry(async () => await getRoomArchiveDetails(roomId));
    } catch (e) {
        console.error("Error retrieving Vonage archive details for room", e);
        return;
    }

    const existingSessionArchives = await callWithRetry(
        async () =>
            await Vonage.listArchives({
                sessionId: archiveDetails.vonageSessionId,
            })
    );

    if (!existingSessionArchives) {
        console.error("Could not retrieve existing session archives.", archiveDetails.vonageSessionId);
        return;
    }

    for (const existingArchive of existingSessionArchives) {
        try {
            if (existingArchive.status === "started" || existingArchive.status === "paused") {
                if (existingArchive.name.startsWith(roomId) && existingArchive.name.split("/")[1] === eventId) {
                    await callWithRetry(async () => await Vonage.stopArchive(existingArchive.id));
                }
            }
        } catch (e) {
            console.error("Could not stop existing session archive", roomId, existingArchive.id, e);
        }
    }
}

export async function kickRegistrantFromRoom(roomId: string, registrantId: string): Promise<void> {
    const roomParticipants = await getRoomParticipantDetails(roomId, registrantId);

    if (roomParticipants.length !== 1) {
        console.error("Could not find a room participant to kick", roomId, registrantId);
        throw new Error("Could not find a room participant to kick");
    }

    const roomParticipant = roomParticipants[0];

    if (roomParticipant.vonageConnectionId) {
        if (!roomParticipant.room.publicVonageSessionId) {
            console.warn("Could not find Vonage session to kick participant from", { roomId, registrantId });
        } else {
            console.log("Forcing Vonage disconnection of registrant", { roomId, registrantId });
            try {
                await Vonage.forceDisconnect(
                    roomParticipant.room.publicVonageSessionId,
                    roomParticipant.vonageConnectionId
                );
            } catch (err) {
                console.error("Failed to force Vonage disconnection of registrant", { roomId, registrantId, err });
                throw new Error("Failed to force Vonage disconnection of registrant");
            }
        }

        await removeRoomParticipant(roomId, roomParticipant.room.conferenceId, registrantId);
    } else if (roomParticipant.chimeRegistrantId) {
        if (!roomParticipant.room.chimeMeeting) {
            console.warn("Could not find Chime session to kick participant from", { roomId, registrantId });
        } else {
            console.log("Forcing Chime disconnection of registrant", { roomId, registrantId });
            try {
                await Chime.send(
                    new DeleteAttendeeCommand({
                        AttendeeId: roomParticipant.chimeRegistrantId,
                        MeetingId: roomParticipant.room.chimeMeeting.chimeMeetingId,
                    })
                );
            } catch (err) {
                console.error("Failed to force Chime disconnection of registrant", { roomId, registrantId, err });
                throw new Error("Failed to force Chime disconnection of registrant");
            }
        }

        await removeRoomParticipant(roomId, roomParticipant.room.conferenceId, registrantId);
    }
}

gql`
    query GetEventByVonageSessionId($sessionId: String!) {
        schedule_Event(where: { eventVonageSession: { sessionId: { _eq: $sessionId } } }) {
            id
            conferenceId
        }
    }

    mutation CreateEventParticipantStream(
        $registrantId: uuid!
        $conferenceId: uuid!
        $eventId: uuid!
        $vonageConnectionId: String!
        $vonageStreamId: String!
        $vonageStreamType: String!
    ) {
        insert_video_EventParticipantStream_one(
            object: {
                registrantId: $registrantId
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
    registrantId: string,
    stream: StreamData
): Promise<void> {
    const eventResult = await apolloClient.query({
        query: GetEventByVonageSessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (eventResult.error || eventResult.errors) {
        console.error("Error while retrieving event from Vonage session ID", sessionId, registrantId);
        throw new Error("Error while retrieving event from Vonage session ID");
    }

    if (eventResult.data.schedule_Event.length !== 1) {
        console.log("No event matching this session, skipping participant addition.", sessionId, registrantId);
        return;
    }

    try {
        await apolloClient.mutate({
            mutation: CreateEventParticipantStreamDocument,
            variables: {
                registrantId,
                conferenceId: eventResult.data.schedule_Event[0].conferenceId,
                eventId: eventResult.data.schedule_Event[0].id,
                vonageConnectionId: stream.connection.id,
                vonageStreamId: stream.id,
                vonageStreamType: stream.videoType ?? "camera",
            },
        });
    } catch (e) {
        // If there is already a row for this event, kick the previous connection before recording the new one
        console.error(
            "Error while adding event participant stream",
            eventResult.data.schedule_Event[0].id,
            registrantId,
            stream.id,
            e
        );
        throw new Error("Error while adding event participant stream");
    }
}

gql`
    mutation RemoveEventParticipantStream(
        $registrantId: uuid!
        $conferenceId: uuid!
        $eventId: uuid!
        $vonageConnectionId: String!
        $vonageStreamId: String!
    ) {
        delete_video_EventParticipantStream(
            where: {
                registrantId: { _eq: $registrantId }
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
    registrantId: string,
    stream: StreamData
): Promise<void> {
    const eventResult = await apolloClient.query({
        query: GetEventByVonageSessionIdDocument,
        variables: {
            sessionId,
        },
    });

    if (eventResult.error || eventResult.errors) {
        console.log("Could not retrieve event from Vonage session ID", sessionId, registrantId);
        throw new Error("Could not retrieve event from Vonage session ID");
    }

    if (eventResult.data.schedule_Event.length !== 1) {
        console.log("No event matching this session, skipping participant stream removal.", sessionId, registrantId);
        return;
    }

    const removeResult = await apolloClient.mutate({
        mutation: RemoveEventParticipantStreamDocument,
        variables: {
            registrantId,
            conferenceId: eventResult.data.schedule_Event[0].conferenceId,
            eventId: eventResult.data.schedule_Event[0].id,
            vonageConnectionId: stream.connection.id,
            vonageStreamId: stream.id,
        },
    });

    if (
        !removeResult.data?.delete_video_EventParticipantStream?.affected_rows ||
        removeResult.data.delete_video_EventParticipantStream.affected_rows === 0
    ) {
        console.warn("Could not find participant stream to remove for event", sessionId, registrantId, stream.id);
    }
}
