import { gql } from "@apollo/client/core";
import { CreateEventBreakoutRoomDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { hasura } from "./hasura/hasuraMetadata";

export async function createEventStartTrigger(eventId: string, startTime: string): Promise<void> {
    const startTimeMillis = Date.parse(startTime);

    if (startTimeMillis < new Date().getTime()) {
        console.log("Start time of event is in the past, skipping.", eventId, startTime);
        return;
    }
    console.log("Creating new start time trigger for event", eventId, startTime);
    await hasura.createScheduledEvent({
        schedule_at: new Date(startTimeMillis - 70000).toISOString(),
        webhook: "{{ACTION_BASE_URL}}/event/notifyStart",
        comment: `Event ${eventId} starts at ${startTime}`,
        headers: [{ name: "x-hasura-event-secret", value_from_env: "EVENT_SECRET" }],
        payload: {
            eventId,
            startTime,
        },
    });
}

export async function createEventEndTrigger(eventId: string, endTime: string): Promise<void> {
    const endTimeMillis = Date.parse(endTime);

    if (endTimeMillis < new Date().getTime()) {
        console.log("End time of event is in the past, skipping.", eventId, endTime);
        return;
    }
    console.log("Creating new end time trigger for event", eventId, endTime);
    await hasura.createScheduledEvent({
        schedule_at: new Date(endTimeMillis - 70000).toISOString(),
        webhook: "{{ACTION_BASE_URL}}/event/notifyEnd",
        comment: `Event ${eventId} ends at ${endTime}`,
        headers: [{ name: "x-hasura-event-secret", value_from_env: "EVENT_SECRET" }],
        payload: {
            eventId,
            endTime,
        },
    });
}

gql`
    mutation CreateEventBreakoutRoom(
        $name: String!
        $publicVonageSessionId: String!
        $originatingEventId: uuid!
        $conferenceId: uuid!
        $chatId: uuid = null
    ) {
        insert_Room_one(
            object: {
                currentModeName: BREAKOUT
                name: $name
                publicVonageSessionId: $publicVonageSessionId
                originatingEventId: $originatingEventId
                roomPrivacyName: PUBLIC
                conferenceId: $conferenceId
                chatId: $chatId
            }
        ) {
            id
        }
    }
`;

export async function createEventBreakoutRoom(
    conferenceId: string,
    eventId: string,
    eventName: string,
    startTime: string,
    vonageSessionId: string,
    _contentGroupId?: string,
    contentGroupTitle?: string,
    contentGroupChatId?: string
): Promise<void> {
    const startTimeD = new Date(startTime);
    // e.g. toUTCString() == "Wed, 14 Jun 2017 07:00:00 GMT"
    const startTimeParts = startTimeD.toUTCString().split(",")[1].split(" ");
    // e.g. ["14", "Jun", "2017", "07:00:00", "GMT"]
    //        0      1       2         3
    const startTimeStr = `${startTimeParts[0]} ${startTimeParts[1]} ${startTimeParts[3].slice(
        0,
        startTimeParts[3].length - 3
    )}`;
    // Results in: "14 Jun 07:00"

    await apolloClient.mutate({
        mutation: CreateEventBreakoutRoomDocument,
        variables: {
            conferenceId,
            name: contentGroupTitle ? `${eventName}: ${contentGroupTitle} ${startTimeStr}` : `${eventName} ${startTimeStr}`,
            originatingEventId: eventId,
            publicVonageSessionId: vonageSessionId,
            chatId: contentGroupChatId,
        },
    });
}
