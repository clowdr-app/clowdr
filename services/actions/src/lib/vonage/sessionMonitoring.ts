import { assertType } from "typescript-is";
import { OngoingBroadcastableVideoRoomEventsDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { CustomConnectionData, WebhookReqBody } from "../../types/vonage";
import { addRoomParticipant, removeRoomParticipant, startEventBroadcast } from "./vonageTools";

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

    await startEventBroadcast(ongoingMatchingEvent.id);

    return true;
}

export async function addAndRemoveRoomParticipants(payload: WebhookReqBody): Promise<boolean> {
    let success = true;

    if (payload.event === "connectionCreated") {
        try {
            console.log("connectionCreated: adding participant to room", payload.sessionId, payload.connection.data);
            const data = JSON.parse(payload.connection.data);
            const { attendeeId } = assertType<CustomConnectionData>(data);
            await addRoomParticipant(payload.sessionId, payload.connection.id, attendeeId);
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
                "connectionDestroyed: removing participant from room",
                payload.sessionId,
                payload.connection.data
            );
            const data = JSON.parse(payload.connection.data);
            const { attendeeId } = assertType<CustomConnectionData>(data);
            await removeRoomParticipant(payload.sessionId, attendeeId, payload.connection.id);
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
