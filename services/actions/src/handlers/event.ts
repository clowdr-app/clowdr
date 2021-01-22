import { gql } from "@apollo/client/core";
import {
    EndChatDuplicationDocument,
    EndChatDuplicationMutationVariables,
    Event_GetEventVonageSessionDocument,
    GetEventChatInfoDocument,
    GetEventTimingsDocument,
    RoomMode_Enum,
    StartChatDuplicationDocument,
    StartChatDuplicationMutationVariables,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createEventBreakoutRoom, createEventEndTrigger, createEventStartTrigger } from "../lib/event";
import { sendFailureEmail } from "../lib/logging/failureEmails";
import Vonage from "../lib/vonage/vonageClient";
import { startEventBroadcast, stopEventBroadcasts } from "../lib/vonage/vonageTools";
import { EventData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";
import { createMediaPackageHarvestJob } from "./recording";

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

    mutation StartChatDuplication(
        $chatId1: uuid!
        $chatId2: uuid!
        $data: jsonb!
        $message: String!
        $systemId1: String!
    ) {
        update_chat1: update_chat_Chat_by_pk(pk_columns: { id: $chatId1 }, _set: { duplicateToId: $chatId2 }) {
            id
        }
        update_chat2: update_chat_Chat_by_pk(pk_columns: { id: $chatId2 }, _set: { duplicateToId: $chatId1 }) {
            id
        }
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
            ]
            on_conflict: { constraint: Message_systemId_key, update_columns: [] }
        ) {
            affected_rows
        }
    }

    mutation EndChatDuplication(
        $chatId1: uuid!
        $chatId2: uuid!
        $data: jsonb!
        $message: String!
        $systemId1: String!
        $systemId2: String!
    ) {
        update_chat1: update_chat_Chat_by_pk(pk_columns: { id: $chatId1 }, _set: { duplicateToId: null }) {
            id
        }
        update_chat2: update_chat_Chat_by_pk(pk_columns: { id: $chatId2 }, _set: { duplicateToId: null }) {
            id
        }
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
                    mutation: isStart ? StartChatDuplicationDocument : EndChatDuplicationDocument,
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
                        systemId2: !isStart
                            ? chatId2 +
                              "::" +
                              (isStart ? "start" : "end") +
                              "::" +
                              (Date.parse(chatInfo.data.Event_by_pk.startTime) +
                                  (isStart ? 0 : chatInfo.data.Event_by_pk.durationSeconds))
                            : undefined,
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
                    } as StartChatDuplicationMutationVariables | EndChatDuplicationMutationVariables,
                });
            }
        }
    }
}

gql`
    query GetEventTimings($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            name
            startTime
            endTime
            conferenceId
            intendedRoomModeName
            eventVonageSession {
                id
                sessionId
            }
            contentGroup {
                id
                title
                chatId
            }
        }
    }
`;

export async function handleEventStartNotification(eventId: string, startTime: string): Promise<void> {
    console.log("Handling event start", eventId, startTime);
    const result = await callWithRetry(
        async () =>
            await apolloClient.query({
                query: GetEventTimingsDocument,
                variables: {
                    eventId,
                },
            })
    );

    if (result.data.Event_by_pk && result.data.Event_by_pk.startTime === startTime) {
        console.log("Handling event start: matched expected startTime", result.data.Event_by_pk.id, startTime);
        const nowMillis = new Date().getTime();
        const startTimeMillis = Date.parse(startTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(startTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.Event_by_pk.id;
        const intendedRoomModeName = result.data.Event_by_pk.intendedRoomModeName;

        setTimeout(async () => {
            try {
                insertChatDuplicationMarkers(eventId, true);
            } catch (e) {
                console.error("Failed to insert chat duplication start markers", eventId, e);
            }

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
    console.log("Handling event end", eventId, endTime);
    const result = await callWithRetry(
        async () =>
            await apolloClient.query({
                query: GetEventTimingsDocument,
                variables: {
                    eventId,
                },
            })
    );

    if (result.data.Event_by_pk && result.data.Event_by_pk.endTime === endTime) {
        console.log("Handling event end: matched expected endTime", result.data.Event_by_pk.id, endTime);
        const nowMillis = new Date().getTime();
        const endTimeMillis = Date.parse(endTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(endTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.Event_by_pk.id;
        const conferenceId = result.data.Event_by_pk.conferenceId;
        const intendedRoomModeName = result.data.Event_by_pk.intendedRoomModeName;

        setTimeout(async () => {
            try {
                insertChatDuplicationMarkers(eventId, false);
            } catch (e) {
                console.error("Failed to insert chat duplication end markers", eventId, e);
            }

            try {
                if ([RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(intendedRoomModeName)) {
                    await stopEventBroadcasts(eventId);
                }
            } catch (e) {
                console.error("Failed to stop event broadcasts", eventId, e);
            }
        }, waitForMillis);

        const harvestJobWaitForMillis = Math.max(endTimeMillis - nowMillis + 5000, 0);

        setTimeout(async () => {
            try {
                if ([RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(intendedRoomModeName)) {
                    await createMediaPackageHarvestJob(eventId, conferenceId);
                }
            } catch (e) {
                console.error("Failed to create MediaPackage harvest job", eventId, e);
            }
        }, harvestJobWaitForMillis);

        try {
            if ([RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(intendedRoomModeName)) {
                const event = result.data.Event_by_pk;
                if (!event.eventVonageSession) {
                    throw new Error("Missing event Vonage session");
                }
                await createEventBreakoutRoom(
                    event.conferenceId,
                    event.id,
                    event.name,
                    event.startTime,
                    event.eventVonageSession.sessionId,
                    event.contentGroup?.id,
                    event.contentGroup?.title,
                    event.contentGroup?.chatId
                );
            }
        } catch (e) {
            console.error("Failed to create breakout room at end of event", eventId, e);
        }
    } else {
        console.log("Event stop notification did not match current event end time, skipping.", eventId, endTime);
    }
}

gql`
    query Event_GetEventVonageSession($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            eventVonageSession {
                id
                sessionId
            }
        }
    }
`;

export async function handleStopEventBroadcasts(params: stopEventBroadcastArgs): Promise<StopEventBroadcastOutput> {
    console.log("Stopping broadcasts for event", params.eventId);

    const eventDetails = await apolloClient.query({
        query: Event_GetEventVonageSessionDocument,
        variables: {
            eventId: params.eventId,
        },
    });

    if (!eventDetails.data.Event_by_pk) {
        console.error("Could not retrieve event", params.eventId);
        throw new Error("Could not retrieve event");
    }

    if (!eventDetails.data.Event_by_pk.eventVonageSession) {
        console.log("Event has no associated Vonage session", params.eventId);
        return { broadcastsStopped: 0 };
    }

    const broadcasts = await Vonage.listBroadcasts({
        sessionId: eventDetails.data.Event_by_pk.eventVonageSession.sessionId,
    });

    if (!broadcasts) {
        console.log("No broadcasts return for Vonage session", params.eventId);
        return { broadcastsStopped: 0 };
    }

    let broadcastsStopped = 0;
    for (const broadcast of broadcasts) {
        try {
            console.log("Attempting to stop broadcast", params.eventId, broadcast.id);
            await Vonage.stopBroadcast(broadcast.id);
            broadcastsStopped++;
        } catch (e) {
            console.warn("Failure while trying to stop broadcast", params.eventId, broadcast.id, e);
        }
    }

    return { broadcastsStopped };
}
