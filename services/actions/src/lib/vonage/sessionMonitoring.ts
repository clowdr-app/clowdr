import { assertType } from "typescript-is";
import {
    AddVonageRoomRecordingToUserListDocument,
    OngoingArchivableVideoRoomEventsDocument,
    OngoingBroadcastableVideoRoomEventsDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { CustomConnectionData, SessionMonitoringWebhookReqBody } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import { getRoomByVonageSessionId } from "../room";
import { addRoomParticipant, removeRoomParticipant } from "../roomParticipant";
import {
    addEventParticipantStream,
    removeEventParticipantStream,
    startEventBroadcast,
    startRoomVonageArchiving,
} from "./vonageTools";

export async function startBroadcastIfOngoingEvent(payload: SessionMonitoringWebhookReqBody): Promise<boolean> {
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
        return false;
    }

    if (ongoingMatchingEvents.data.schedule_Event.length === 0) {
        console.log("No ongoing broadcast events connected to this session.", payload.sessionId);
        return true;
    }

    if (ongoingMatchingEvents.data.schedule_Event.length > 1) {
        console.error(
            "Unexpectedly found multiple ongoing broadcast events connected to this session. Aborting.",
            payload.sessionId
        );
        return false;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.schedule_Event[0];

    console.log("Vonage session has ongoing matching event, ensuring broadcast is started", payload.sessionId);
    await startEventBroadcast(ongoingMatchingEvent.id);

    return true;
}

export async function startArchiveIfOngoingEvent(payload: SessionMonitoringWebhookReqBody): Promise<boolean> {
    const ongoingMatchingEvents = await apolloClient.query({
        query: OngoingArchivableVideoRoomEventsDocument,
        variables: {
            sessionId: payload.sessionId,
            time: new Date().toISOString(),
        },
    });

    if (ongoingMatchingEvents.error || ongoingMatchingEvents.errors) {
        console.error(
            "Error while retrieving ongoing archivable events related to a Vonage session.",
            payload.sessionId,
            ongoingMatchingEvents.error,
            ongoingMatchingEvents.errors
        );
        return false;
    }

    if (ongoingMatchingEvents.data.schedule_Event.length === 0) {
        console.log("No ongoing archivable events connected to this session.", payload.sessionId);
        return true;
    }

    if (ongoingMatchingEvents.data.schedule_Event.length > 1) {
        console.error(
            "Unexpectedly found multiple ongoing archivable events connected to this session. Aborting.",
            payload.sessionId
        );
        return false;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.schedule_Event[0];

    console.log("Vonage session has ongoing matching event, ensuring archive is started", payload.sessionId);
    const recordingId = await startRoomVonageArchiving(ongoingMatchingEvent.roomId, ongoingMatchingEvent.id);
    if (recordingId) {
        console.log(
            "Archive just started, adding to registrant's saved recordings (because join session might not have).",
            payload.sessionId
        );

        try {
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
            console.error("Could not save Vonage recording to registrant's list of recordings!", {
                sessionId: payload.sessionId,
                roomId: ongoingMatchingEvent.roomId,
                eventId: ongoingMatchingEvent.id,
                error,
            });
        }
    }

    return true;
}

export async function addAndRemoveRoomParticipants(payload: SessionMonitoringWebhookReqBody): Promise<boolean> {
    let success = true;

    if (payload.event === "connectionCreated") {
        try {
            console.log(
                "connectionCreated: adding participant to room if necessary",
                payload.sessionId,
                payload.connection.data
            );
            const data = JSON.parse(payload.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);

            const room = await getRoomByVonageSessionId(payload.sessionId);

            if (!room) {
                console.log("No room matching this Vonage session, skipping participant addition.", {
                    sessionId: payload.sessionId,
                    registrantId,
                });
                success = false;
            } else {
                await callWithRetry(
                    async () =>
                        await addRoomParticipant(
                            room.roomId,
                            room.conferenceId,
                            { vonageConnectionId: payload.connection.id },
                            registrantId
                        )
                );
            }
        } catch (e) {
            console.error(
                "Failed to handle Vonage connectionCreated event",
                payload.sessionId,
                payload.connection.data,
                e
            );
            success = false;
        }
    }

    if (payload.event === "connectionDestroyed") {
        try {
            console.log(
                "connectionDestroyed: removing participant from room if necessary",
                payload.sessionId,
                payload.connection.data
            );
            const data = JSON.parse(payload.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);
            const room = await getRoomByVonageSessionId(payload.sessionId);

            if (!room) {
                console.log("No room matching this Vonage session, skipping participant removal.", {
                    sessionId: payload.sessionId,
                    registrantId,
                });
                success = false;
            } else {
                await callWithRetry(
                    async () => await removeRoomParticipant(room.roomId, room.conferenceId, registrantId)
                );
            }
        } catch (e) {
            console.error(
                "Failed to handle Vonage connectionDestroyed event",
                payload.sessionId,
                payload.connection.data,
                e
            );
            success = false;
        }
    }

    return success;
}

export async function addAndRemoveEventParticipantStreams(payload: SessionMonitoringWebhookReqBody): Promise<boolean> {
    let success = true;

    if (payload.event === "streamCreated") {
        try {
            console.log(
                "streamCreated: adding participant stream to event if necessary",
                payload.sessionId,
                payload.stream.id
            );
            const data = JSON.parse(payload.stream.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await addEventParticipantStream(payload.sessionId, registrantId, payload.stream)
            );
        } catch (e) {
            console.error("Failed to handle Vonage streamCreated event", payload.sessionId, payload.stream.id, e);
            success = false;
        }
    }

    if (payload.event === "streamDestroyed") {
        try {
            console.log(
                "streamCreated: removing participant stream from event if necessary",
                payload.sessionId,
                payload.stream.id
            );
            const data = JSON.parse(payload.stream.connection.data);
            const { registrantId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await removeEventParticipantStream(payload.sessionId, registrantId, payload.stream)
            );
        } catch (e) {
            console.error("Failed to handle Vonage streamDestroyed event", payload.sessionId, payload.stream.id, e);
            success = false;
        }
    }

    return success;
}
