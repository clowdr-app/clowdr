import { gql } from "@apollo/client/core";
import { GetEventTimingsDocument, RoomMode_Enum } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createEventEndTrigger, createEventStartTrigger } from "../lib/event";
import { sendFailureEmail } from "../lib/logging/failureEmails";
import { startEventBroadcast, stopEventBroadcasts } from "../lib/vonage/vonageTools";
import { EventData, Payload } from "../types/hasura/event";

export async function handleEventUpdated(payload: Payload<EventData>): Promise<void> {
    const oldRow = payload.event.data.old;
    const newRow = payload.event.data.new;

    if (!newRow) {
        console.error("handleEventUpdated: new content was empty");
        return;
    }

    if (![RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(newRow.intendedRoomModeName)) {
        // No need to insert scheduled events for other kinds of room modes, as there
        // is no RTMP broadcast to be triggered
        return;
    }

    try {
        if (oldRow) {
            // Event was updated
            if (oldRow.startTime !== newRow.startTime) {
                await createEventStartTrigger(newRow.id, newRow.startTime);
            }

            if (oldRow.endTime !== newRow.endTime && newRow.endTime) {
                await createEventEndTrigger(newRow.id, newRow.endTime);
            }
        } else {
            // Event was inserted
            await createEventStartTrigger(newRow.id, newRow.startTime);
            if (newRow.endTime) {
                await createEventEndTrigger(newRow.id, newRow.endTime);
            }
        }
    } catch (e) {
        await sendFailureEmail("Could not insert event start/end triggers", e);
        throw e;
    }
}

gql`
    query GetEventTimings($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            startTime
            endTime
        }
    }
`;

export async function handleEventStartNotification(eventId: string, startTime: string): Promise<void> {
    const result = await apolloClient.query({
        query: GetEventTimingsDocument,
        variables: {
            eventId,
        },
    });

    if (result.data.Event_by_pk?.startTime && result.data.Event_by_pk.startTime === startTime) {
        const nowMillis = new Date().getTime();
        const startTimeMillis = Date.parse(startTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(startTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.Event_by_pk.id;

        setTimeout(async () => await startEventBroadcast(eventId), waitForMillis);
    } else {
        console.log("Event start notification did not match current event start time, skipping.", eventId, startTime);
    }
}

export async function handleEventEndNotification(eventId: string, endTime: string): Promise<void> {
    const result = await apolloClient.query({
        query: GetEventTimingsDocument,
        variables: {
            eventId,
        },
    });

    if (result.data.Event_by_pk?.endTime && result.data.Event_by_pk.endTime === endTime) {
        const nowMillis = new Date().getTime();
        const endTimeMillis = Date.parse(endTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(endTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.Event_by_pk.id;

        setTimeout(async () => await stopEventBroadcasts(eventId), waitForMillis);
    } else {
        console.log("Event stop notification did not match current event end time, skipping.", eventId, endTime);
    }
}
