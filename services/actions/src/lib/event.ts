import { gql } from "@apollo/client/core";
import type { P } from "pino";
import { GetEventVonageSessionDocument, Room_Mode_Enum, SetEventVonageSessionIdDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { hasura } from "./hasura/hasuraMetadata";

export async function createEventStartTrigger(
    logger: P.Logger,
    eventId: string,
    startTime: string,
    updatedAt: number
): Promise<void> {
    const startTimeMillis = Date.parse(startTime);

    if (startTimeMillis < new Date().getTime()) {
        logger.info({ eventId, startTime }, "Start time of event is in the past, skipping.");
        return;
    }
    logger.info({ eventId, startTime }, "Creating new start time trigger for event");
    await hasura.createScheduledEvent({
        schedule_at: new Date(startTimeMillis - 70000).toISOString(),
        webhook: "{{ACTION_BASE_URL}}/event/notifyStart",
        comment: `Event ${eventId} starts at ${startTime}`,
        headers: [{ name: "x-hasura-event-secret", value_from_env: "EVENT_SECRET" }],
        payload: {
            eventId,
            startTime,
            updatedAt,
        },
    });
}

export async function createEventEndTrigger(
    logger: P.Logger,
    eventId: string,
    endTime: string,
    updatedAt: number
): Promise<void> {
    const endTimeMillis = Date.parse(endTime);

    if (endTimeMillis < new Date().getTime()) {
        logger.info({ eventId, endTime }, "End time of event is in the past, skipping.");
        return;
    }
    logger.info({ eventId, endTime }, "Creating new end time trigger for event");
    await hasura.createScheduledEvent({
        schedule_at: new Date(endTimeMillis - 70000).toISOString(),
        webhook: "{{ACTION_BASE_URL}}/event/notifyEnd",
        comment: `Event ${eventId} ends at ${endTime}`,
        headers: [{ name: "x-hasura-event-secret", value_from_env: "EVENT_SECRET" }],
        payload: {
            eventId,
            endTime,
            updatedAt,
        },
    });
}

export async function eventHasVonageSession(eventId: string): Promise<boolean> {
    gql`
        query GetEventVonageSession($eventId: uuid!) {
            video_EventVonageSession(where: { eventId: { _eq: $eventId } }) {
                id
            }
        }
    `;

    const result = await apolloClient.query({
        query: GetEventVonageSessionDocument,
        variables: {
            eventId,
        },
    });

    return !!result.data.video_EventVonageSession.length;
}

export async function createEventVonageSession(logger: P.Logger, eventId: string, conferenceId: string): Promise<void> {
    logger.info({ eventId, conferenceId }, "Creating EventVonageSession for event");
    const sessionResult = await Vonage.createSession({ mediaMode: "routed" });

    if (!sessionResult) {
        throw new Error("No session ID returned from Vonage");
    }

    gql`
        mutation SetEventVonageSessionId($eventId: uuid!, $conferenceId: uuid!, $sessionId: String!) {
            insert_video_EventVonageSession_one(
                object: { eventId: $eventId, conferenceId: $conferenceId, sessionId: $sessionId }
                on_conflict: { constraint: EventVonageSession_eventId_key, update_columns: sessionId }
            ) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: SetEventVonageSessionIdDocument,
        variables: {
            eventId,
            conferenceId,
            sessionId: sessionResult.sessionId,
        },
    });
}

export function isLive(roomModeName: Room_Mode_Enum): boolean {
    return [Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(roomModeName);
}
