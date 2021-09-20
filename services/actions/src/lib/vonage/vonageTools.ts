import { gql } from "@apollo/client/core";
import { DeleteAttendeeCommand } from "@aws-sdk/client-chime";
import {
    CreateVonageParticipantStreamDocument,
    CreateVonageRoomRecordingDocument,
    GetEventBroadcastDetailsDocument,
    GetRoomArchiveDetailsDocument,
    RemoveVonageParticipantStreamDocument,
    Video_RtmpInput_Enum,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { StreamData } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import { getRegistrantDetails } from "../authorisation";
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

    mutation CreateVonageRoomRecording($object: video_VonageRoomRecording_insert_input!) {
        insert_video_VonageRoomRecording_one(object: $object) {
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

export async function startRoomVonageArchiving(
    roomId: string,
    eventId: string | undefined,
    initiatedBy?: string
): Promise<string | null> {
    let archiveDetails: RoomArchiveDetails;
    try {
        archiveDetails = await callWithRetry(async () => await getRoomArchiveDetails(roomId));
    } catch (e) {
        console.error("Error retrieving Vonage broadcast details for room", e);
        return null;
    }

    const existingSessionArchives = await callWithRetry(() =>
        Vonage.listArchives({
            sessionId: archiveDetails.vonageSessionId,
        })
    );

    if (existingSessionArchives === undefined) {
        console.error("Could not retrieve existing session archives.", archiveDetails.vonageSessionId);
        return null;
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
                await callWithRetry(() => Vonage.stopArchive(archive.id));
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
            const recordingResponse = await apolloClient.mutate({
                mutation: CreateVonageRoomRecordingDocument,
                variables: {
                    object: {
                        roomId,
                        startedAt: new Date().toISOString(),
                        vonageSessionId: archiveDetails.vonageSessionId,
                        initiatedBy,
                    },
                },
            });

            const archive = await callWithRetry(() =>
                Vonage.startArchive(archiveDetails.vonageSessionId, {
                    name: roomId + (eventId ? "/" + eventId : ""),
                    resolution: "1280x720",
                    outputMode: "composed",
                    hasAudio: true,
                    hasVideo: true,
                    layout: {
                        type: "bestFit",
                        screenshareType: "verticalPresentation",
                    },
                })
            );

            if (archive) {
                console.log("Started Vonage archive", archive.id, archiveDetails.vonageSessionId, roomId);
            } else {
                console.error("No archive returned by Vonage", archiveDetails.vonageSessionId, roomId);
            }

            const recordingId = recordingResponse.data?.insert_video_VonageRoomRecording_one?.id ?? null;

            if (recordingId) {
                await Vonage.signal(archiveDetails.vonageSessionId, null, {
                    type: "recordingId",
                    data: recordingId,
                });
            }

            return recordingId;
        } catch (e) {
            console.error("Failed to start archive", archiveDetails.vonageSessionId, roomId, e);
            return null;
        }
    } else {
        console.log("There is already an existing archive for the session.", archiveDetails.vonageSessionId, roomId);
        return null;
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

    mutation CreateVonageParticipantStream(
        $registrantId: uuid!
        $conferenceId: uuid!
        $vonageSessionId: String!
        $vonageConnectionId: String!
        $vonageStreamId: String!
        $vonageStreamType: String!
    ) {
        insert_video_VonageParticipantStream_one(
            object: {
                registrantId: $registrantId
                conferenceId: $conferenceId
                vonageSessionId: $vonageSessionId
                vonageConnectionId: $vonageConnectionId
                vonageStreamId: $vonageStreamId
                vonageStreamType: $vonageStreamType
            }
        ) {
            id
        }
    }
`;

export async function addVonageParticipantStream(
    sessionId: string,
    registrantId: string,
    stream: StreamData
): Promise<void> {
    try {
        const registrant = await getRegistrantDetails(registrantId);
        if (!registrant) {
            throw new Error("Could not find registrant!");
        }

        await apolloClient.mutate({
            mutation: CreateVonageParticipantStreamDocument,
            variables: {
                registrantId,
                conferenceId: registrant.conferenceId,
                vonageSessionId: sessionId,
                vonageConnectionId: stream.connection.id,
                vonageStreamId: stream.id,
                vonageStreamType: stream.videoType ?? "camera",
            },
        });
    } catch (e) {
        // If there is already a row for this event, kick the previous connection before recording the new one
        console.error("Error while adding vonage participant stream", registrantId, stream.id, e);
        throw new Error("Error while adding vonage participant stream");
    }
}

gql`
    mutation RemoveVonageParticipantStream(
        $registrantId: uuid!
        $conferenceId: uuid!
        $vonageSessionId: String!
        $vonageConnectionId: String!
        $vonageStreamId: String!
    ) {
        delete_video_VonageParticipantStream(
            where: {
                registrantId: { _eq: $registrantId }
                conferenceId: { _eq: $conferenceId }
                vonageSessionId: { _eq: $vonageSessionId }
                vonageConnectionId: { _eq: $vonageConnectionId }
                vonageStreamId: { _eq: $vonageStreamId }
            }
        ) {
            affected_rows
        }
    }
`;

export async function removeVonageParticipantStream(
    sessionId: string,
    registrantId: string,
    stream: StreamData
): Promise<void> {
    const registrant = await getRegistrantDetails(registrantId);
    if (!registrant) {
        throw new Error("Could not find registrant!");
    }

    const removeResult = await apolloClient.mutate({
        mutation: RemoveVonageParticipantStreamDocument,
        variables: {
            registrantId,
            conferenceId: registrant.conferenceId,
            vonageSessionId: sessionId,
            vonageConnectionId: stream.connection.id,
            vonageStreamId: stream.id,
        },
    });

    if (
        !removeResult.data?.delete_video_VonageParticipantStream?.affected_rows ||
        removeResult.data.delete_video_VonageParticipantStream.affected_rows === 0
    ) {
        console.warn(
            "Could not find participant stream to remove for vonage session",
            sessionId,
            registrantId,
            stream.id
        );
    }
}
