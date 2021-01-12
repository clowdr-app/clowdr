import { gql } from "@apollo/client/core";
import {
    GetEventChatInfoDocument,
    GetEventTimingsDocument,
    InsertChatDuplicationMarkersDocument,
    RoomMode_Enum,
} from "../generated/graphql";
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
    query GetEventChatInfo($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            startTime
            durationSeconds
            room {
                id
                name
                chatId
            }
            contentGroup {
                id
                title
                chatId
            }
        }
    }
    mutation InsertChatDuplicationMarkers(
        $chatId1: uuid!
        $chatId2: uuid!
        $data: jsonb!
        $message: String!
        $systemId1: String!
        $systemId2: String!
    ) {
        insert_chat_Message(
            objects: [
                {
                    chatId: $chatId1
                    data: $data
                    isPinned: false
                    message: $message
                    senderId: null
                    type: DUPLICATION_MARKER
                    systemId: $systemId1
                }
                {
                    chatId: $chatId2
                    data: $data
                    isPinned: false
                    message: $message
                    senderId: null
                    type: DUPLICATION_MARKER
                    systemId: $systemId2
                }
            ]
            on_conflict: { constraint: Message_systemId_key, update_columns: [] }
        ) {
            affected_rows
        }
    }
`;

async function insertChatDuplicationMarkers(eventId: string, isStart: boolean): Promise<void> {
    const chatInfo = await apolloClient.query({
        query: GetEventChatInfoDocument,
        variables: {
            eventId,
        },
    });

    if (chatInfo.data.Event_by_pk) {
        if (chatInfo.data.Event_by_pk.contentGroup) {
            const chatId1 = chatInfo.data.Event_by_pk.contentGroup.chatId;
            const chatId2 = chatInfo.data.Event_by_pk.room.chatId;
            if (chatId1 && chatId2) {
                await apolloClient.mutate({
                    mutation: InsertChatDuplicationMarkersDocument,
                    variables: {
                        chatId1,
                        chatId2,
                        systemId1:
                            chatId1 +
                            "::" +
                            (isStart ? "start" : "end") +
                            "::" +
                            (Date.parse(chatInfo.data.Event_by_pk.startTime) +
                                (isStart ? 0 : chatInfo.data.Event_by_pk.durationSeconds)),
                        systemId2:
                            chatId2 +
                            "::" +
                            (isStart ? "start" : "end") +
                            "::" +
                            (Date.parse(chatInfo.data.Event_by_pk.startTime) +
                                (isStart ? 0 : chatInfo.data.Event_by_pk.durationSeconds)),
                        message: "<<<Duplication marker>>>",
                        data: {
                            type: isStart ? "start" : "end",
                            event: {
                                id: eventId,
                                startTime: Date.parse(chatInfo.data.Event_by_pk.startTime),
                                durationSeconds: chatInfo.data.Event_by_pk.durationSeconds,
                            },
                            room: {
                                id: chatInfo.data.Event_by_pk.room.id,
                                name: chatInfo.data.Event_by_pk.room.name,
                                chatId: chatInfo.data.Event_by_pk.room.chatId,
                            },
                            contentGroup: {
                                id: chatInfo.data.Event_by_pk.contentGroup.id,
                                title: chatInfo.data.Event_by_pk.contentGroup.title,
                                chatId: chatInfo.data.Event_by_pk.contentGroup.chatId,
                            },
                        },
                    },
                });
            }
        }
    }
}

gql`
    query GetEventTimings($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            startTime
            endTime
            intendedRoomModeName
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

    if (result.data.Event_by_pk && result.data.Event_by_pk.startTime === startTime) {
        const nowMillis = new Date().getTime();
        const startTimeMillis = Date.parse(startTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(startTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.Event_by_pk.id;
        const intendedRoomModeName = result.data.Event_by_pk.intendedRoomModeName;

        setTimeout(async () => {
            insertChatDuplicationMarkers(eventId, true);

            if (![RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(intendedRoomModeName)) {
                // No RTMP broadcast to be started
                return;
            }

            await startEventBroadcast(eventId);
        }, waitForMillis);
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

    if (result.data.Event_by_pk && result.data.Event_by_pk.endTime === endTime) {
        const nowMillis = new Date().getTime();
        const endTimeMillis = Date.parse(endTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(endTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.Event_by_pk.id;
        const intendedRoomModeName = result.data.Event_by_pk.intendedRoomModeName;

        setTimeout(async () => {
            insertChatDuplicationMarkers(eventId, false);

            if (![RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(intendedRoomModeName)) {
                // No RTMP broadcast to be stopped
                return;
            }

            await stopEventBroadcasts(eventId);
        }, waitForMillis);
    } else {
        console.log("Event stop notification did not match current event end time, skipping.", eventId, endTime);
    }
}
