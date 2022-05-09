import { gql } from "@apollo/client/core";
import { DeleteAttendeeCommand } from "@aws-sdk/client-chime";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { VonageSessionLayoutData } from "@midspace/shared-types/vonage";
import { VonageSessionLayoutType } from "@midspace/shared-types/vonage";
import type OpenTok from "opentok";
import type { P } from "pino";
import {
    CreateVonageParticipantStreamDocument,
    CreateVonageRoomRecordingDocument,
    DisableEventRecordingFlagDocument,
    GetEventBroadcastDetailsDocument,
    GetRoomArchiveDetailsDocument,
    GetVonageSessionLayoutDocument,
    RemoveVonageParticipantStreamDocument,
    Video_RtmpInput_Enum,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import type { StreamData } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import { getRegistrantDetails } from "../authorisation";
import { Chime, shortId } from "../aws/awsClient";
import { removeAllRoomParticipants, removeRoomParticipant } from "../roomParticipant";
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

export async function startEventBroadcast(logger: P.Logger, eventId: string): Promise<void> {
    let broadcastDetails: EventBroadcastDetails;
    try {
        broadcastDetails = await callWithRetry(async () => await getEventBroadcastDetails(eventId));
    } catch (err) {
        logger.error({ eventId, err }, "Error retrieving Vonage broadcast details for event");
        return;
    }

    const existingSessionBroadcasts = await callWithRetry(
        async () =>
            await Vonage.listBroadcasts({
                sessionId: broadcastDetails.vonageSessionId,
            })
    );

    if (existingSessionBroadcasts === undefined) {
        logger.error(
            { vonageSessionId: broadcastDetails.vonageSessionId },
            "Could not retrieve existing session broadcasts."
        );
        return;
    }

    let startedSessionBroadcasts = existingSessionBroadcasts?.filter(
        (broadcast) => broadcast.status === "started" || broadcast.status === "paused"
    );

    logger.info(
        { vonageSessionId: broadcastDetails.vonageSessionId, startedSessionBroadcasts },
        `Vonage session has ${startedSessionBroadcasts.length} existing live broadcasts`
    );

    if (startedSessionBroadcasts.length > 1) {
        logger.warn(
            {
                vonageSessionId: broadcastDetails.vonageSessionId,
                startedSessionBroadcastsCount: startedSessionBroadcasts.length,
            },
            "Found more than one live broadcast for session - which is not allowed. Stopping them."
        );
        for (const broadcast of startedSessionBroadcasts) {
            try {
                await Vonage.stopBroadcast(broadcast.id);
            } catch (e: any) {
                logger.error(
                    { err: e, vonageSessionId: broadcastDetails.vonageSessionId, status: broadcast.status },
                    "Error while stopping invalid broadcast"
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
        logger.info(
            { vonageSessionId: broadcastDetails.vonageSessionId, eventId, rtmpId },
            "Starting a broadcast from session to event room"
        );
        try {
            const dirtyLayoutData = await getVonageLayout(broadcastDetails.vonageSessionId);
            const dirtyLayout = dirtyLayoutData ? convertLayout(dirtyLayoutData) : null;
            const cleanLayout = dirtyLayout
                ? await sanitizeLayout(logger, broadcastDetails.vonageSessionId, dirtyLayout)
                : null;

            const broadcast = await Vonage.startBroadcast(broadcastDetails.vonageSessionId, {
                layout: cleanLayout?.layout?.layout ?? {
                    type: "bestFit",
                    screenshareType: "verticalPresentation",
                    stylesheet: null,
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

            logger.info(
                { broadcastId: broadcast.id, vonageSessionId: broadcastDetails.vonageSessionId, eventId },
                `Started Vonage RTMP broadcast. Setting layout... (${
                    cleanLayout ? "User-configured layout" : "Default layout"
                })`
            );

            await applyVonageSessionLayout(
                logger,
                broadcastDetails.vonageSessionId,
                dirtyLayout ?? {
                    streamClasses: {},
                    layout: {
                        type: "bestFit",
                        screenshareType: "verticalPresentation",
                        stylesheet: null,
                    },
                }
            );

            logger.info(
                { broadcastId: broadcast.id, vonageSessionId: broadcastDetails.vonageSessionId, eventId },
                "Set newly-started Vonage broadcast layout."
            );
        } catch (e: any) {
            logger.error(
                { vonageSessionId: broadcastDetails.vonageSessionId, eventId, err: e },
                "Failed to start broadcast"
            );
            return;
        }
    } else {
        logger.info(
            { vonageSessionId: broadcastDetails.vonageSessionId, eventId },
            "There is already an existing RTMP broadcast from the session to the ongoing event."
        );
    }
}

export async function stopEventBroadcasts(logger: P.Logger, eventId: string): Promise<void> {
    let broadcastDetails: EventBroadcastDetails;
    try {
        broadcastDetails = await callWithRetry(async () => await getEventBroadcastDetails(eventId));
    } catch (e: any) {
        logger.error({ err: e, eventId }, "Error retrieving Vonage broadcast details for event");
        return;
    }

    const existingSessionBroadcasts = await callWithRetry(
        async () =>
            await Vonage.listBroadcasts({
                sessionId: broadcastDetails.vonageSessionId,
            })
    );

    if (!existingSessionBroadcasts) {
        logger.error(
            { vonageSessionId: broadcastDetails.vonageSessionId },
            "Could not retrieve existing session broadcasts."
        );
        return;
    }

    for (const existingBroadcast of existingSessionBroadcasts) {
        try {
            if (existingBroadcast.status === "started" || existingBroadcast.status === "paused") {
                await callWithRetry(async () => await Vonage.stopBroadcast(existingBroadcast.id));
            }
        } catch (e: any) {
            logger.error(
                { eventId, existingBroadcastId: existingBroadcast.id, err: e },
                "Could not stop existing session broadcast"
            );
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
    logger: P.Logger,
    roomId: string,
    eventId: string | undefined,
    initiatedBy?: string
): Promise<string | null> {
    let archiveDetails: RoomArchiveDetails;
    try {
        archiveDetails = await callWithRetry(async () => await getRoomArchiveDetails(roomId));
    } catch (e: any) {
        logger.error({ roomId, err: e }, "Error retrieving Vonage broadcast details for room");
        return null;
    }

    const existingSessionArchives = await callWithRetry(() =>
        Vonage.listArchives({
            sessionId: archiveDetails.vonageSessionId,
        })
    );

    if (existingSessionArchives === undefined) {
        logger.error(
            { vonageSessionId: archiveDetails.vonageSessionId },
            "Could not retrieve existing session archives."
        );
        return null;
    }

    let startedSessionArchives = existingSessionArchives?.filter(
        (archive) => archive.status === "started" || archive.status === "paused"
    );

    logger.info(
        { vonageSessionId: archiveDetails.vonageSessionId, startedSessionArchives },
        `Vonage session has ${startedSessionArchives.length} existing live archives`
    );

    if (
        startedSessionArchives.filter(
            (archive) => !archive.name.startsWith(roomId) || archive.name.split("/")[1] !== eventId
        ).length > 0
    ) {
        logger.warn({ vonageSessionId: archiveDetails.vonageSessionId }, "Stopping previous archives of the session.");

        for (const archive of startedSessionArchives) {
            try {
                await callWithRetry(() => Vonage.stopArchive(archive.id));
            } catch (e: any) {
                logger.error(
                    { vonageSessionId: archiveDetails.vonageSessionId, status: archive.status, err: e },
                    "Error while stopping previous archive"
                );
            }
        }

        startedSessionArchives = [];
    }

    const existingArchive = startedSessionArchives.find(
        (archive) => archive.name.startsWith(roomId) && archive.name.split("/")[1] === eventId
    );
    if (!existingArchive) {
        logger.info({ vonageSessionId: archiveDetails.vonageSessionId, roomId }, "Starting archive for session");
        try {
            const dirtyLayoutData = await getVonageLayout(archiveDetails.vonageSessionId);
            const dirtyLayout = dirtyLayoutData ? convertLayout(dirtyLayoutData) : null;
            const cleanLayout = dirtyLayout
                ? await sanitizeLayout(logger, archiveDetails.vonageSessionId, dirtyLayout)
                : null;

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
                })
            );

            if (archive) {
                logger.info(
                    { archiveId: archive.id, vonageSessionId: archiveDetails.vonageSessionId, roomId },
                    `Started Vonage archive. Setting layout... (${
                        cleanLayout ? "User-configured layout" : "Default layout"
                    })`
                );

                await applyVonageSessionLayout(
                    logger,
                    archiveDetails.vonageSessionId,
                    dirtyLayout ?? {
                        streamClasses: {},
                        layout: {
                            type: "bestFit",
                            screenshareType: "verticalPresentation",
                            stylesheet: null,
                        },
                    }
                );

                logger.info(
                    { archiveId: archive.id, vonageSessionId: archiveDetails.vonageSessionId, roomId },
                    "Set newly-started Vonage archive layout."
                );
            } else {
                logger.error(
                    { vonageSessionId: archiveDetails.vonageSessionId, roomId },
                    "No archive returned by Vonage"
                );
            }

            const recordingId = recordingResponse.data?.insert_video_VonageRoomRecording_one?.id ?? null;

            if (recordingId) {
                await Vonage.signal(archiveDetails.vonageSessionId, null, {
                    type: "recordingId",
                    data: recordingId,
                });
            }

            return recordingId;
        } catch (e: any) {
            logger.error(
                { vonageSessionId: archiveDetails.vonageSessionId, roomId, err: e },
                "Failed to start archive"
            );
            return null;
        }
    } else {
        logger.info(
            { vonageSessionId: archiveDetails.vonageSessionId, roomId },
            "There is already an existing archive for the session."
        );
        return null;
    }
}

gql`
    mutation DisableEventRecordingFlag($eventId: uuid!) {
        update_schedule_Event_by_pk(pk_columns: { id: $eventId }, _set: { enableRecording: false }) {
            id
        }
    }
`;

export async function stopRoomVonageArchiving(
    logger: P.Logger,
    roomId: string,
    eventId: string | undefined,
    disableRecording = false
): Promise<void> {
    let archiveDetails: RoomArchiveDetails;
    try {
        archiveDetails = await callWithRetry(async () => await getRoomArchiveDetails(roomId));
    } catch (e: any) {
        logger.error({ err: e }, "Error retrieving Vonage archive details for room");
        return;
    }

    const existingSessionArchives = await callWithRetry(
        async () =>
            await Vonage.listArchives({
                sessionId: archiveDetails.vonageSessionId,
            })
    );

    if (!existingSessionArchives) {
        logger.error(
            { vonageSessionId: archiveDetails.vonageSessionId },
            "Could not retrieve existing session archives."
        );
        return;
    }

    for (const existingArchive of existingSessionArchives) {
        if (eventId && disableRecording) {
            try {
                await callWithRetry(() =>
                    apolloClient.mutate({
                        mutation: DisableEventRecordingFlagDocument,
                        variables: {
                            eventId,
                        },
                    })
                );
            } catch (e: any) {
                logger.error({ roomId, eventId, err: e }, "Could not disable recording for event");
            }
        }

        try {
            if (existingArchive.status === "started" || existingArchive.status === "paused") {
                if (existingArchive.name.startsWith(roomId) && existingArchive.name.split("/")[1] === eventId) {
                    await callWithRetry(() => Vonage.stopArchive(existingArchive.id));
                }
            }
        } catch (e: any) {
            logger.error(
                { roomId, existingArchiveId: existingArchive.id, err: e },
                "Could not stop existing session archive"
            );
        }
    }
}

export async function kickAllRegistrantsFromVonageRoom(logger: P.Logger, roomId: string, vonageSessionId: string) {
    try {
        const redisClient = await redisClientPool.acquire("lib/roomParticipant");
        try {
            const connectionIds = await redisClientP.zmembers(redisClient)(`VonageConnections:${vonageSessionId}`);
            await Promise.all(
                connectionIds.map((connectionId) =>
                    callWithRetry(() => Vonage.forceDisconnect(vonageSessionId, connectionId))
                )
            );
            await removeAllRoomParticipants(logger, roomId, vonageSessionId);
        } finally {
            await redisClientPool.release("lib/roomParticipant", redisClient);
        }
    } catch (error: any) {
        logger.error({ error, roomId, vonageSessionId }, "Failed to kick all registrants from vonage room");
    }
}

export async function kickRegistrantFromRoom(
    logger: P.Logger,
    roomId: string,
    registrantId: string,
    identifier:
        | { vonageConnectionId: string; vonageSessionId: string }
        | { chimeRegistrantId: string; chimeMeetingId: string },
    isRemovingDuplicate: boolean
): Promise<void> {
    if ("vonageConnectionId" in identifier) {
        await removeRoomParticipant(
            logger,
            roomId,
            undefined,
            undefined,
            registrantId,
            {
                connectionId: identifier.vonageConnectionId,
                sessionId: identifier.vonageSessionId,
            },
            isRemovingDuplicate
        );

        logger.info({ roomId, identifier }, "Forcing Vonage disconnection of registrant");
        try {
            await callWithRetry(() =>
                Vonage.forceDisconnect(identifier.vonageSessionId, identifier.vonageConnectionId)
            );
        } catch (err) {
            logger.error({ roomId, identifier, err }, "Failed to force Vonage disconnection of registrant");
            throw new Error("Failed to force Vonage disconnection of registrant");
        }
    } else if ("chimeRegistrantId" in identifier) {
        await removeRoomParticipant(logger, roomId, undefined, undefined, registrantId, undefined, isRemovingDuplicate);

        logger.info({ roomId, identifier }, "Forcing Chime disconnection of registrant");
        try {
            await callWithRetry(() =>
                Chime.send(
                    new DeleteAttendeeCommand({
                        AttendeeId: identifier.chimeRegistrantId,
                        MeetingId: identifier.chimeMeetingId,
                    })
                )
            );
        } catch (err) {
            logger.error({ roomId, identifier, err }, "Failed to force Chime disconnection of registrant");
            throw new Error("Failed to force Chime disconnection of registrant");
        }
    }
}

gql`
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
    logger: P.Logger,
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
    } catch (e: any) {
        // If there is already a row for this event, kick the previous connection before recording the new one
        logger.error({ err: e, registrantId, streamId: stream.id }, "Error while adding vonage participant stream");
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
        $now: timestamptz!
    ) {
        update_video_VonageParticipantStream(
            where: {
                registrantId: { _eq: $registrantId }
                conferenceId: { _eq: $conferenceId }
                vonageSessionId: { _eq: $vonageSessionId }
                vonageConnectionId: { _eq: $vonageConnectionId }
                vonageStreamId: { _eq: $vonageStreamId }
                stopped_at: { _is_null: true }
            }
            _set: { stopped_at: $now }
        ) {
            affected_rows
        }
    }
`;

export async function removeVonageParticipantStream(
    logger: P.Logger,
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
            now: new Date().toISOString(),
        },
    });

    if (
        !removeResult.data?.update_video_VonageParticipantStream?.affected_rows ||
        removeResult.data.update_video_VonageParticipantStream.affected_rows === 0
    ) {
        logger.warn(
            { sessionId, registrantId, streamId: stream.id },
            "Could not find participant stream to remove for vonage session"
        );
    }
}

///////////////////////////////////////////////////////

gql`
    query GetVonageSessionLayout($vonageSessionId: String!) {
        video_VonageSessionLayout(
            where: { vonageSessionId: { _eq: $vonageSessionId } }
            order_by: { created_at: desc }
            limit: 1
        ) {
            id
            layoutData
        }
    }
`;

export async function getVonageLayout(vonageSessionId: string): Promise<VonageSessionLayoutData | null> {
    const response = await apolloClient.query({
        query: GetVonageSessionLayoutDocument,
        variables: {
            vonageSessionId,
        },
    });

    return response.data.video_VonageSessionLayout[0]?.layoutData ?? null;
}

export interface VonageLayout {
    streamClasses: {
        [streamId: string]: string[];
    };
    layout: VonageLayoutCustom | VonageLayoutBuiltin;
}

export interface VonageLayoutCustom {
    type: "custom";
    stylesheet: string;
}

export interface VonageLayoutBuiltin {
    type: "bestFit";
    screenshareType: "verticalPresentation" | "horizontalPresentation";
    stylesheet: null;
}

async function getOngoingBroadcastIds(logger: P.Logger, vonageSessionId: string): Promise<string[]> {
    logger.info({ vonageSessionId }, "Getting list of Vonage broadcasts");
    const broadcasts = await Vonage.listBroadcasts({
        sessionId: vonageSessionId,
    });

    return (
        broadcasts
            ?.filter((broadcast) => broadcast.status === "started" || broadcast.status === "paused")
            .map((broadcast) => broadcast.id) ?? []
    );
}

async function getOngoingArchiveIds(logger: P.Logger, vonageSessionId: string): Promise<string[]> {
    logger.info({ vonageSessionId }, "Getting list of Vonage archives");
    const archives = await Vonage.listArchives({
        sessionId: vonageSessionId,
    });

    return (
        archives
            ?.filter((archive) => archive.status === "started" || archive.status === "paused")
            .map((archive) => archive.id) ?? []
    );
}

export async function applyVonageSessionLayout(
    logger: P.Logger,
    vonageSessionId: string,
    dirtyLayout: VonageLayout
): Promise<number> {
    const { streams, layout } = await sanitizeLayout(logger, vonageSessionId, dirtyLayout);
    const laidOutStreamIds = Object.keys(layout.streamClasses);
    const streamsToClear = streams
        .filter((stream) => !laidOutStreamIds.includes(stream.id))
        .map((stream) => ({
            id: stream.id,
            layoutClassList: [] as string[],
        }));
    const streamsToSet = Object.entries(layout.streamClasses).map(([streamId, classes]) => ({
        id: streamId,
        layoutClassList: classes,
    }));

    try {
        const allStreamsTransform = streamsToClear.concat(streamsToSet);
        if (allStreamsTransform.length > 0) {
            logger.info({ vonageSessionId, classListArray: allStreamsTransform }, "Setting Vonage stream class list");

            await Vonage.setStreamClassLists(vonageSessionId, allStreamsTransform);
        }
    } catch (err) {
        logger.error(
            {
                vonageSessionId,
                streamsToClear,
                streamsToSet,
                err,
            },
            "Error setting Vonage stream class list"
        );
        throw err;
    }

    // Update broadcasts
    const startedBroadcastIds = await getOngoingBroadcastIds(logger, vonageSessionId);
    if (startedBroadcastIds.length > 0) {
        logger.info({ vonageSessionId, startedBroadcastIds }, "Setting layout of Vonage broadcasts");
        for (const startedBroadcastId of startedBroadcastIds) {
            try {
                switch (layout.layout.type) {
                    case "bestFit":
                        await Vonage.setBroadcastLayout(
                            startedBroadcastId,
                            "bestFit",
                            null,
                            layout.layout.screenshareType
                        );
                        break;
                    case "custom":
                        await Vonage.setBroadcastLayout(startedBroadcastId, "custom", layout.layout.stylesheet, null);
                        break;
                }
            } catch (err) {
                logger.error(
                    {
                        vonageSessionId,
                        startedBroadcastId,
                        err,
                    },
                    "Failed to set layout for Vonage broadcast"
                );
            }
        }
    }

    // Update archives
    const startedArchiveIds = await getOngoingArchiveIds(logger, vonageSessionId);
    if (startedArchiveIds.length > 0) {
        logger.info({ vonageSessionId, startedArchiveIds }, "Setting layout of Vonage archives");
        for (const startedArchiveId of startedArchiveIds) {
            try {
                switch (layout.layout.type) {
                    case "bestFit":
                        await Vonage.setArchiveLayout(startedArchiveId, "bestFit", null, layout.layout.screenshareType);
                        break;
                    case "custom":
                        await Vonage.setArchiveLayout(startedArchiveId, "custom", layout.layout.stylesheet, null);
                        break;
                }
            } catch (err) {
                logger.error(
                    {
                        vonageSessionId,
                        startedBroadcastId: startedArchiveId,
                        err,
                    },
                    "Failed to set layout for Vonage archive"
                );
            }
        }
    }

    return streams.length;
}

export async function sanitizeLayout(
    logger: P.Logger,
    vonageSessionId: string,
    layout: VonageLayout
): Promise<{ streams: OpenTok.Stream[]; layout: VonageLayout }> {
    const result: VonageLayout = {
        layout: { ...layout.layout },
        streamClasses: { ...layout.streamClasses },
    };

    const streams = await Vonage.listStreams(vonageSessionId);
    if (!streams) {
        logger.error({ vonageSessionId }, "Could not retrieve list of streams from Vonage");
        throw new Error("Could not retrieve list of streams from Vonage");
    }

    Object.keys(result.streamClasses).forEach((streamId) => {
        if (!streams.some((s) => s.id === streamId)) {
            delete result.streamClasses[streamId];
        }
    });

    return { streams, layout: result };
}

export function convertLayout(layoutData: VonageSessionLayoutData): VonageLayout {
    switch (layoutData.type) {
        case VonageSessionLayoutType.BestFit:
            return {
                layout: {
                    type: "bestFit",
                    screenshareType: layoutData.screenShareType,
                    stylesheet: null,
                },
                streamClasses: {},
            };
        case VonageSessionLayoutType.Single: {
            const streamClasses: Record<string, Array<string>> = {};
            if (layoutData.position1 && "streamId" in layoutData.position1) {
                streamClasses[layoutData.position1.streamId] = ["stream1"];
            }
            return {
                layout: {
                    type: "custom",
                    stylesheet:
                        "stream.stream1 { position: absolute; width: 100%; height: 100%; left: 0px; top: 0px; }",
                },
                streamClasses,
            };
        }
        case VonageSessionLayoutType.Pair: {
            const streamClasses: Record<string, Array<string>> = {};
            if (layoutData.position1 && "streamId" in layoutData.position1) {
                streamClasses[layoutData.position1.streamId] = ["stream1"];
            }
            if (layoutData.position2 && "streamId" in layoutData.position2) {
                streamClasses[layoutData.position2.streamId] = ["stream2"];
            }
            return {
                layout: {
                    type: "custom",
                    stylesheet: `
                        stream.stream1 { position: absolute; width: 50%; height: 100%; left: 0px; top: 0px; }
                        stream.stream2 { position: absolute; width: 50%; height: 100%; right: 0px; top: 0px; }
                    `,
                },
                streamClasses,
            };
        }
        case VonageSessionLayoutType.PictureInPicture: {
            const streamClasses: Record<string, Array<string>> = {};
            if (layoutData.position1 && "streamId" in layoutData.position1) {
                streamClasses[layoutData.position1.streamId] = ["stream1"];
            }
            if (layoutData.position2 && "streamId" in layoutData.position2) {
                streamClasses[layoutData.position2.streamId] = ["stream2"];
            }
            return {
                layout: {
                    type: "custom",
                    stylesheet: `
                        stream.stream1 { position: absolute; width: 100%; height: 100%; left: 0px; top: 0px; z-index: 100;}
                        stream.stream2 { position: absolute; width: 200px; height: 200px; right: 20px; bottom: 20px; z-index: 200; object-fit: cover; }
                    `,
                },
                streamClasses,
            };
        }
        case VonageSessionLayoutType.Fitted4: {
            const streamClasses: Record<string, Array<string>> = {};
            if (layoutData.position1 && "streamId" in layoutData.position1) {
                streamClasses[layoutData.position1.streamId] = ["stream1"];
            }
            if (layoutData.position2 && "streamId" in layoutData.position2) {
                streamClasses[layoutData.position2.streamId] = ["stream2"];
            }
            if (layoutData.position3 && "streamId" in layoutData.position3) {
                streamClasses[layoutData.position3.streamId] = ["stream3"];
            }
            if (layoutData.position4 && "streamId" in layoutData.position4) {
                streamClasses[layoutData.position4.streamId] = ["stream4"];
            }
            if (layoutData.position5 && "streamId" in layoutData.position5) {
                streamClasses[layoutData.position5.streamId] = ["stream5"];
            }
            return {
                layout: {
                    type: "custom",
                    stylesheet:
                        layoutData.side === "left"
                            ? `
                                stream.stream1 { position: absolute; width: 85.9375%; height: 100%; left: 14.0625%; top: 0px; z-index: 100;}
                                stream.stream2 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 0%; z-index: 200; object-fit: cover; }
                                stream.stream3 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 25%; z-index: 200; object-fit: cover; }
                                stream.stream4 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 50%; z-index: 200; object-fit: cover; }
                                stream.stream5 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 75%; z-index: 200; object-fit: cover; }
                            `
                            : `
                                stream.stream1 { position: absolute; width: 100%; height: 75%; left: 0px; top: 0px; z-index: 100;}
                                stream.stream2 { position: absolute; width: 14.0625%; height: 25%; left: 21.875%; bottom: 0px; z-index: 200; object-fit: cover; }
                                stream.stream3 { position: absolute; width: 14.0625%; height: 25%; left: 35.9375%; bottom: 0px; z-index: 200; object-fit: cover; }
                                stream.stream4 { position: absolute; width: 14.0625%; height: 25%; left: 50%; bottom: 0px; z-index: 200; object-fit: cover; }
                                stream.stream5 { position: absolute; width: 14.0625%; height: 25%; left: 64.0625%; bottom: 0px; z-index: 200; object-fit: cover; }
                            `,
                },
                streamClasses,
            };
        }
        case VonageSessionLayoutType.DualScreen: {
            const sideStreams =
                layoutData.splitDirection === "horizontal"
                    ? `
                        stream.stream3 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 0%; z-index: 200; object-fit: cover; }
                        stream.stream4 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 25%; z-index: 200; object-fit: cover; }
                        stream.stream5 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 50%; z-index: 200; object-fit: cover; }
                        stream.stream6 { position: absolute; width: 14.0625%; height: 25%; left: 0px; top: 75%; z-index: 200; object-fit: cover; }
                    `
                    : `
                        stream.stream3 { position: absolute; width: 14.0625%; height: 25%; left: 21.875%; bottom: 0px; z-index: 200; object-fit: cover; }
                        stream.stream4 { position: absolute; width: 14.0625%; height: 25%; left: 35.9375%; bottom: 0px; z-index: 200; object-fit: cover; }
                        stream.stream5 { position: absolute; width: 14.0625%; height: 25%; left: 50%; bottom: 0px; z-index: 200; object-fit: cover; }
                        stream.stream6 { position: absolute; width: 14.0625%; height: 25%; left: 64.0625%; bottom: 0px; z-index: 200; object-fit: cover; }
                    `;
            const streamClasses: Record<string, Array<string>> = {};
            if (layoutData.position1 && "streamId" in layoutData.position1) {
                streamClasses[layoutData.position1.streamId] = ["stream1"];
            }
            if (layoutData.position2 && "streamId" in layoutData.position2) {
                streamClasses[layoutData.position2.streamId] = ["stream2"];
            }
            if (layoutData.position3 && "streamId" in layoutData.position3) {
                streamClasses[layoutData.position3.streamId] = ["stream3"];
            }
            if (layoutData.position4 && "streamId" in layoutData.position4) {
                streamClasses[layoutData.position4.streamId] = ["stream4"];
            }
            if (layoutData.position5 && "streamId" in layoutData.position5) {
                streamClasses[layoutData.position5.streamId] = ["stream5"];
            }
            if (layoutData.position6 && "streamId" in layoutData.position6) {
                streamClasses[layoutData.position6.streamId] = ["stream6"];
            }
            return {
                layout: {
                    type: "custom",
                    stylesheet:
                        layoutData.splitDirection === "horizontal"
                            ? layoutData.narrowStream === 1
                                ? `
                                    stream.stream1 { position: absolute; width: 85.9375%; height: 25%; left: 14.0625%; top: 0%; z-index: 100; }
                                    stream.stream2 { position: absolute; width: 85.9375%; height: 75%; left: 14.0625%; top: 25%; z-index: 100; }
                                    ${sideStreams}
                                `
                                : layoutData.narrowStream === 2
                                ? `
                                    stream.stream1 { position: absolute; width: 85.9375%; height: 75%; left: 14.0625%; top: 0%; z-index: 100; }
                                    stream.stream2 { position: absolute; width: 85.9375%; height: 25%; left: 14.0625%; top: 75%; z-index: 100; }
                                    ${sideStreams}
                                `
                                : `
                                    stream.stream1 { position: absolute; width: 85.9375%; height: 50%; left: 14.0625%; top: 0%; z-index: 100; }
                                    stream.stream2 { position: absolute; width: 85.9375%; height: 50%; left: 14.0625%; top: 50%; z-index: 100; }
                                    ${sideStreams}
                                `
                            : layoutData.narrowStream === 1
                            ? `
                                stream.stream1 { position: absolute; width: 25%; height: 75%; left: 0%; top: 0px; z-index: 100; }
                                stream.stream2 { position: absolute; width: 75%; height: 75%; left: 25%; top: 0px; z-index: 100; }
                                ${sideStreams}
                            `
                            : layoutData.narrowStream === 2
                            ? `
                                stream.stream1 { position: absolute; width: 75%; height: 75%; left: 0%; top: 0px; z-index: 100; }
                                stream.stream2 { position: absolute; width: 25%; height: 75%; left: 75%; top: 0px; z-index: 100; }
                                ${sideStreams}
                            `
                            : `
                                stream.stream1 { position: absolute; width: 50%; height: 75%; left: 0%; top: 0px; z-index: 100; }
                                stream.stream2 { position: absolute; width: 50%; height: 75%; left: 50%; top: 0px; z-index: 100; }
                                ${sideStreams}
                            `,
                },
                streamClasses,
            };
        }
    }
}
