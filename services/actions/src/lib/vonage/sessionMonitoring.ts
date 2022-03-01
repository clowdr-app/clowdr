import { gql } from "@apollo/client/core";
import type { P } from "pino";
import { assertType } from "typescript-is";
import {
    AddVonageRoomRecordingToUserListDocument,
    OngoingArchivableVideoRoomEventsDocument,
    OngoingArchivableVideoRoomEventsWithRoomInfoDocument,
    OngoingBroadcastableVideoRoomEventsDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import type { CustomConnectionData, SessionMonitoringWebhookReqBody } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import { getRoomByVonageSessionId } from "../room";
import { addRoomParticipant, removeRoomParticipant } from "../roomParticipant";
import Vonage from "./vonageClient";
import {
    addVonageParticipantStream,
    removeVonageParticipantStream,
    startEventBroadcast,
    startRoomVonageArchiving,
    stopRoomVonageArchiving,
} from "./vonageTools";

export async function startBroadcastIfOngoingEvent(
    logger: P.Logger,
    payload: SessionMonitoringWebhookReqBody
): Promise<boolean> {
    const ongoingMatchingEvents = await apolloClient.query({
        query: OngoingBroadcastableVideoRoomEventsDocument,
        variables: {
            sessionId: payload.sessionId,
            time: new Date().toISOString(),
        },
    });

    if (ongoingMatchingEvents.data.schedule_Event.length === 0) {
        logger.info({ sessionId: payload.sessionId }, "No ongoing broadcast events connected to this session.");
        return true;
    }

    if (ongoingMatchingEvents.data.schedule_Event.length > 1) {
        logger.error(
            { sessionId: payload.sessionId },
            "Unexpectedly found multiple ongoing broadcast events connected to this session. Aborting."
        );
        return false;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.schedule_Event[0];

    logger.info(
        { sessionId: payload.sessionId },
        "Vonage session has ongoing matching event, ensuring broadcast is started"
    );
    await startEventBroadcast(logger, ongoingMatchingEvent.id);

    return true;
}

export async function startArchiveIfOngoingEvent(
    logger: P.Logger,
    payload: SessionMonitoringWebhookReqBody
): Promise<boolean> {
    const ongoingMatchingEvents = await apolloClient.query({
        query: OngoingArchivableVideoRoomEventsDocument,
        variables: {
            sessionId: payload.sessionId,
            time: new Date().toISOString(),
        },
    });

    if (ongoingMatchingEvents.data.schedule_Event.length === 0) {
        logger.info({ sessionId: payload.sessionId }, "No ongoing archivable events connected to this session.");
        return true;
    }

    if (ongoingMatchingEvents.data.schedule_Event.length > 1) {
        logger.error(
            { sessionId: payload.sessionId },
            "Unexpectedly found multiple ongoing archivable events connected to this session. Aborting."
        );
        return false;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.schedule_Event[0];

    if (ongoingMatchingEvent.enableRecording) {
        logger.info(
            { sessionId: payload.sessionId },
            "Vonage session has ongoing matching event, ensuring archive is started"
        );

        let registrantId: string | undefined;
        if (payload.event === "connectionCreated") {
            const data = JSON.parse(payload.connection.data);
            const { registrantId: _registrantId } = assertType<CustomConnectionData>(data);
            registrantId = _registrantId;
        } else if (payload.event === "streamCreated") {
            const data = JSON.parse(payload.stream.connection.data);
            const { registrantId: _registrantId } = assertType<CustomConnectionData>(data);
            registrantId = _registrantId;
        }
        await startVonageArchive(
            logger,
            ongoingMatchingEvent.roomId,
            ongoingMatchingEvent.id,
            payload.sessionId,
            registrantId
        );
    }

    return true;
}

export async function startVonageArchive(
    logger: P.Logger,
    roomId: string,
    eventId: string | undefined,
    vonageSessionId: string,
    registrantId: string | undefined
): Promise<void> {
    const recordingId = await startRoomVonageArchiving(logger, roomId, eventId, registrantId);
    if (recordingId) {
        logger.info(
            { vonageSessionId },
            "Archive just started, adding to registrant's saved recordings (because join session might not have)."
        );

        try {
            if (registrantId) {
                await apolloClient.mutate({
                    mutation: AddVonageRoomRecordingToUserListDocument,
                    variables: {
                        recordingId,
                        registrantId,
                    },
                });
            }
        } catch (error) {
            logger.error(
                {
                    sessionId: vonageSessionId,
                    roomId,
                    eventId,
                    error,
                },
                "Could not save Vonage recording to registrant's list of recordings!"
            );
        }
    }
}

gql`
    query OngoingArchivableVideoRoomEventsWithRoomInfo($time: timestamptz!, $sessionId: String!) {
        schedule_Event(
            where: {
                room: { publicVonageSessionId: { _eq: $sessionId } }
                intendedRoomModeName: { _eq: VIDEO_CHAT }
                endTime: { _gt: $time }
                startTime: { _lte: $time }
            }
        ) {
            id
            roomId
        }
        room_Room(where: { publicVonageSessionId: { _eq: $sessionId } }) {
            id
        }
    }
`;

export async function stopArchiveIfNoOngoingEvent(
    logger: P.Logger,
    payload: SessionMonitoringWebhookReqBody
): Promise<boolean> {
    try {
        const streams = await callWithRetry(() => Vonage.listStreams(payload.sessionId));
        if (!streams) {
            logger.error(
                { sessionId: payload.sessionId },
                "Error: Unable to retrieve streams for Vonage session. Skipping stop archive check."
            );
            return false;
        }

        if (streams.length > 0) {
            return true;
        }

        const ongoingMatchingEvents = await apolloClient.query({
            query: OngoingArchivableVideoRoomEventsWithRoomInfoDocument,
            variables: {
                sessionId: payload.sessionId,
                time: new Date().toISOString(),
            },
        });

        if (ongoingMatchingEvents.data.schedule_Event.length === 0) {
            if (ongoingMatchingEvents.data.room_Room.length === 1) {
                logger.info(
                    { sessionId: payload.sessionId },
                    "No ongoing archivable events connected to this session. Stopping archiving."
                );
                await stopRoomVonageArchiving(logger, ongoingMatchingEvents.data.room_Room[0].id, undefined);
            } else if (ongoingMatchingEvents.data.room_Room.length > 1) {
                logger.error(
                    { sessionId: payload.sessionId },
                    "Error: Found multiple rooms for the same public Vonage session id! Can't stop archiving."
                );
                return false;
            }
        } else {
            logger.info(
                { sessionId: payload.sessionId },
                "Ongoing archivable events connected to this session. Not stopping archiving."
            );
        }

        return true;
    } catch (e: any) {
        logger.error({ sessionId: payload.sessionId, err: e }, "Error handling stopArchiveIfNoOngoingEvent");
        return false;
    }
}

export async function addAndRemoveRoomParticipants(
    logger: P.Logger,
    payload: SessionMonitoringWebhookReqBody
): Promise<boolean> {
    let success = true;

    if (payload.event === "connectionCreated") {
        try {
            logger.info(
                { sessionId: payload.sessionId, connectionData: payload.connection.data },
                "connectionCreated: adding participant to room if necessary"
            );
            const data = JSON.parse(payload.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);

            const room = await getRoomByVonageSessionId(payload.sessionId);

            if (!room) {
                logger.info(
                    {
                        sessionId: payload.sessionId,
                        registrantId,
                    },
                    "No room matching this Vonage session, skipping participant addition."
                );
                success = false;
            } else {
                await callWithRetry(
                    async () =>
                        await addRoomParticipant(
                            logger,
                            room.roomId,
                            room.conferenceId,
                            { vonageConnectionId: payload.connection.id },
                            registrantId
                        )
                );
            }
        } catch (e: any) {
            logger.error(
                { err: e, sessionId: payload.sessionId, connectionData: payload.connection.data },
                "Failed to handle Vonage connectionCreated event"
            );
            success = false;
        }
    }

    if (payload.event === "connectionDestroyed") {
        try {
            logger.info(
                { sessionId: payload.sessionId, connectionData: payload.connection.data },
                "connectionDestroyed: removing participant from room if necessary"
            );
            const data = JSON.parse(payload.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);
            const room = await getRoomByVonageSessionId(payload.sessionId);

            if (!room) {
                logger.info(
                    {
                        sessionId: payload.sessionId,
                        registrantId,
                    },
                    "No room matching this Vonage session, skipping participant removal."
                );
                success = false;
            } else {
                await callWithRetry(
                    async () =>
                        await removeRoomParticipant(
                            logger,
                            room.roomId,
                            room.conferenceId,
                            registrantId,
                            payload.sessionId
                        )
                );
            }
        } catch (e: any) {
            logger.error(
                { err: e, sessionId: payload.sessionId, connectionData: payload.connection.data },
                "Failed to handle Vonage connectionDestroyed event"
            );
            success = false;
        }
    }

    return success;
}

export async function addAndRemoveVonageParticipantStreams(
    logger: P.Logger,
    payload: SessionMonitoringWebhookReqBody
): Promise<boolean> {
    let success = true;

    if (payload.event === "streamCreated") {
        try {
            logger.info(
                { sessionId: payload.sessionId, streamId: payload.stream.id },
                "streamCreated: adding participant stream to event if necessary"
            );
            const data = JSON.parse(payload.stream.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await addVonageParticipantStream(logger, payload.sessionId, registrantId, payload.stream)
            );
        } catch (e: any) {
            logger.error(
                { sessionId: payload.sessionId, streamId: payload.stream.id, err: e },
                "Failed to handle Vonage streamCreated event"
            );
            success = false;
        }
    }

    if (payload.event === "streamDestroyed") {
        try {
            logger.info(
                { sessionId: payload.sessionId, streamId: payload.stream.id },
                "streamCreated: removing participant stream from event if necessary"
            );
            const data = JSON.parse(payload.stream.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await removeVonageParticipantStream(logger, payload.sessionId, registrantId, payload.stream)
            );
        } catch (e: any) {
            logger.error(
                { sessionId: payload.sessionId, streamId: payload.stream.id, err: e },
                "Failed to handle Vonage streamDestroyed event"
            );
            success = false;
        }
    }

    return success;
}
