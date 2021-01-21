import { assertType } from "typescript-is";
import { OngoingBroadcastableVideoRoomEventsDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { CustomConnectionData, WebhookReqBody } from "../../types/vonage";
import { callWithRetry } from "../../utils";
import {
    addEventParticipantStream,
    addRoomParticipant,
    removeEventParticipantStream,
    removeRoomParticipant,
    startEventBroadcast,
} from "./vonageTools";

export async function startBroadcastIfOngoingEvent(payload: WebhookReqBody): Promise<boolean> {
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

    if (ongoingMatchingEvents.data.Event.length === 0) {
        console.log("No ongoing broadcast events connected to this session.", payload.sessionId);
        return true;
    }

    if (ongoingMatchingEvents.data.Event.length > 1) {
        console.error(
            "Unexpectedly found multiple ongoing broadcast events connected to this session. Aborting.",
            payload.sessionId
        );
        return false;
    }

    const ongoingMatchingEvent = ongoingMatchingEvents.data.Event[0];

    console.log("Vonage session has ongoing matching event, ensuring broadcast is started", payload.sessionId);
    await startEventBroadcast(ongoingMatchingEvent.id);

    return true;
}

export async function addAndRemoveRoomParticipants(payload: WebhookReqBody): Promise<boolean> {
    let success = true;

    if (payload.event === "connectionCreated") {
        try {
            console.log(
                "connectionCreated: adding participant to room if necessary",
                payload.sessionId,
                payload.connection.data
            );
            const data = JSON.parse(payload.connection.data);
            const { attendeeId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await addRoomParticipant(payload.sessionId, payload.connection.id, attendeeId)
            );
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
            const { attendeeId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await removeRoomParticipant(payload.sessionId, attendeeId, payload.connection.id)
            );
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

export async function addAndRemoveEventParticipantStreams(payload: WebhookReqBody): Promise<boolean> {
    let success = true;

    if (payload.event === "streamCreated") {
        try {
            console.log(
                "streamCreated: adding participant stream to event if necessary",
                payload.sessionId,
                payload.stream.id
            );
            const data = JSON.parse(payload.stream.connection.data);
            const { attendeeId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await addEventParticipantStream(payload.sessionId, attendeeId, payload.stream)
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
            const { attendeeId } = assertType<CustomConnectionData>(data);
            await callWithRetry(
                async () => await removeEventParticipantStream(payload.sessionId, attendeeId, payload.stream)
            );
        } catch (e) {
            console.error("Failed to handle Vonage streamDestroyed event", payload.sessionId, payload.stream.id, e);
            success = false;
        }
    }

    return success;
}
