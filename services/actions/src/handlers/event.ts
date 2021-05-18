import { gql } from "@apollo/client/core";
import {
    EndChatDuplicationDocument,
    EndChatDuplicationMutationVariables,
    Event_GetEventVonageSessionDocument,
    GetEventChatInfoDocument,
    GetEventTimingsDocument,
    NotifyRealtimeEventEndedDocument,
    Room_Mode_Enum,
    StartChatDuplicationDocument,
    StartChatDuplicationMutationVariables,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import {
    createEventEndTrigger,
    createEventStartTrigger,
    createEventVonageSession,
    eventHasVonageSession,
    isLive,
} from "../lib/event";
import { sendFailureEmail } from "../lib/logging/failureEmails";
import { createItemBreakoutRoom } from "../lib/room";
import Vonage from "../lib/vonage/vonageClient";
import { startEventBroadcast, stopEventBroadcasts } from "../lib/vonage/vonageTools";
import { EventData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";
import { createMediaPackageHarvestJob } from "./recording";

export async function handleEventUpdated(payload: Payload<EventData>): Promise<void> {
    const newRow = payload.event.data.new;

    if (!newRow) {
        console.error("handleEventUpdated: new content was empty");
        return;
    }

    try {
        if (newRow) {
            await createEventStartTrigger(newRow.id, newRow.startTime, Date.parse(newRow.timings_updated_at));
            if (newRow.endTime) {
                await createEventEndTrigger(newRow.id, newRow.endTime, Date.parse(newRow.timings_updated_at));
            } else {
                console.error(
                    "Event does not have end time (this should never happen). Didn't create event end trigger.",
                    { eventId: newRow.id }
                );
                throw new Error("Event does not have end time.");
            }
        }
    } catch (err) {
        console.error("Could not insert event start/end triggers", { eventId: newRow.id, err });
        await sendFailureEmail("Could not insert event start/end triggers", JSON.stringify(err));
    }

    try {
        const hasVonageSession = await eventHasVonageSession(newRow.id);
        if (!hasVonageSession && isLive(newRow.intendedRoomModeName)) {
            await createEventVonageSession(newRow.id, newRow.conferenceId);
        }
    } catch (err) {
        console.error("Could not create Vonage session for event", { eventId: newRow.id, err });
        await sendFailureEmail("Could not create Vonage session for event", JSON.stringify(err));
    }
}

gql`
    query GetEventChatInfo($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            startTime
            durationSeconds
            room {
                id
                name
                chatId
            }
            item {
                id
                title
                chatId
            }
        }
    }

    mutation StartChatDuplication(
        $chatId1: uuid!
        $chatId2: uuid! # $data: jsonb! # $message: String! # $systemId1: String!
    ) {
        update_chat1: update_chat_Chat_by_pk(pk_columns: { id: $chatId1 }, _set: { duplicateToId: $chatId2 }) {
            id
        }
        update_chat2: update_chat_Chat_by_pk(pk_columns: { id: $chatId2 }, _set: { duplicateToId: $chatId1 }) {
            id
        }
        # insert_chat_Message(
        #     objects: [
        #         {
        #             chatId: $chatId1
        #             data: $data
        #             isPinned: false
        #             message: $message
        #             senderId: null
        #             type: DUPLICATION_MARKER
        #             systemId: $systemId1
        #         }
        #     ]
        #     on_conflict: { constraint: Message_systemId_key, update_columns: [] }
        # ) {
        #     affected_rows
        # }
    }

    mutation EndChatDuplication(
        $chatId1: uuid!
        $chatId2: uuid! # $data: jsonb! # $message: String! # $systemId1: String! # $systemId2: String!
    ) {
        update_chat1: update_chat_Chat_by_pk(pk_columns: { id: $chatId1 }, _set: { duplicateToId: null }) {
            id
        }
        update_chat2: update_chat_Chat_by_pk(pk_columns: { id: $chatId2 }, _set: { duplicateToId: null }) {
            id
        }
        # insert_chat_Message(
        #     objects: [
        #         {
        #             chatId: $chatId1
        #             data: $data
        #             isPinned: false
        #             message: $message
        #             senderId: null
        #             type: DUPLICATION_MARKER
        #             systemId: $systemId1
        #         }
        #         {
        #             chatId: $chatId2
        #             data: $data
        #             isPinned: false
        #             message: $message
        #             senderId: null
        #             type: DUPLICATION_MARKER
        #             systemId: $systemId2
        #         }
        #     ]
        #     on_conflict: { constraint: Message_systemId_key, update_columns: [] }
        # ) {
        #     affected_rows
        # }
    }

    mutation NotifyRealtimeEventEnded($eventId: uuid!) {
        notifyEventEnded(eventId: $eventId) {
            ok
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

    if (chatInfo.data.schedule_Event_by_pk) {
        if (chatInfo.data.schedule_Event_by_pk.item) {
            const chatId1 = chatInfo.data.schedule_Event_by_pk.item.chatId;
            const chatId2 = chatInfo.data.schedule_Event_by_pk.room.chatId;
            if (chatId1 && chatId2) {
                await apolloClient.mutate({
                    mutation: isStart ? StartChatDuplicationDocument : EndChatDuplicationDocument,
                    variables: {
                        chatId1,
                        chatId2,
                        // systemId1:
                        //     chatId1 +
                        //     "::" +
                        //     (isStart ? "start" : "end") +
                        //     "::" +
                        //     (Date.parse(chatInfo.data.schedule_Event_by_pk.startTime) +
                        //         (isStart ? 0 : chatInfo.data.schedule_Event_by_pk.durationSeconds)),
                        // systemId2: !isStart
                        //     ? chatId2 +
                        //       "::" +
                        //       (isStart ? "start" : "end") +
                        //       "::" +
                        //       (Date.parse(chatInfo.data.schedule_Event_by_pk.startTime) +
                        //           (isStart ? 0 : chatInfo.data.schedule_Event_by_pk.durationSeconds))
                        //     : undefined,
                        // message: "<<<Duplication marker>>>",
                        // data: {
                        //     type: isStart ? "start" : "end",
                        //     event: {
                        //         id: eventId,
                        //         startTime: Date.parse(chatInfo.data.schedule_Event_by_pk.startTime),
                        //         durationSeconds: chatInfo.data.schedule_Event_by_pk.durationSeconds,
                        //     },
                        //     room: {
                        //         id: chatInfo.data.schedule_Event_by_pk.room.id,
                        //         name: chatInfo.data.schedule_Event_by_pk.room.name,
                        //         chatId: chatInfo.data.schedule_Event_by_pk.room.chatId,
                        //     },
                        //     item: {
                        //         id: chatInfo.data.schedule_Event_by_pk.item.id,
                        //         title: chatInfo.data.schedule_Event_by_pk.item.title,
                        //         chatId: chatInfo.data.schedule_Event_by_pk.item.chatId,
                        //     },
                        // },
                    } as StartChatDuplicationMutationVariables | EndChatDuplicationMutationVariables,
                });
            }
        }
    }
}

async function notifyRealtimeServiceEventEnded(eventId: string): Promise<void> {
    await apolloClient.mutate({
        mutation: NotifyRealtimeEventEndedDocument,
        variables: {
            eventId,
        },
    });
}

gql`
    query GetEventTimings($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            name
            timingsUpdatedAt
            startTime
            endTime
            conferenceId
            intendedRoomModeName
            eventVonageSession {
                id
                sessionId
            }
            item {
                id
                title
                chatId
            }
        }
    }
`;

export async function handleEventStartNotification(
    eventId: string,
    startTime: string,
    updatedAt: number | null
): Promise<void> {
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

    if (
        result.data.schedule_Event_by_pk &&
        result.data.schedule_Event_by_pk.startTime === startTime &&
        (!updatedAt || Date.parse(result.data.schedule_Event_by_pk.timingsUpdatedAt) === updatedAt)
    ) {
        console.log("Handling event start: matched expected startTime", result.data.schedule_Event_by_pk.id, startTime);
        const nowMillis = new Date().getTime();
        const startTimeMillis = Date.parse(startTime);
        const preloadMillis = 10000;
        const waitForMillis = Math.max(startTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.schedule_Event_by_pk.id;
        const intendedRoomModeName = result.data.schedule_Event_by_pk.intendedRoomModeName;

        setTimeout(async () => {
            if (![Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(intendedRoomModeName)) {
                // No RTMP broadcast to be started
                return;
            }

            await startEventBroadcast(eventId);
        }, waitForMillis);

        setTimeout(async () => {
            try {
                await insertChatDuplicationMarkers(eventId, true);
            } catch (e) {
                console.error("Failed to insert chat duplication start markers", eventId, e);
            }
        }, startTimeMillis - nowMillis + 500);

        if (
            [Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(intendedRoomModeName) &&
            result.data.schedule_Event_by_pk.item
        ) {
            try {
                await createItemBreakoutRoom(
                    result.data.schedule_Event_by_pk.item.id,
                    result.data.schedule_Event_by_pk.conferenceId
                );
            } catch (e) {
                console.error("Failed to create content group breakout room", eventId, e);
            }
        }
    } else {
        console.log("Event start notification did not match current event start time, skipping.", {
            eventId,
            startTime,
            updatedAt,
        });
    }
}

export async function handleEventEndNotification(
    eventId: string,
    endTime: string,
    updatedAt: number | null
): Promise<void> {
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

    if (
        result.data.schedule_Event_by_pk &&
        result.data.schedule_Event_by_pk.endTime === endTime &&
        (!updatedAt || Date.parse(result.data.schedule_Event_by_pk.timingsUpdatedAt) === updatedAt)
    ) {
        console.log("Handling event end: matched expected endTime", result.data.schedule_Event_by_pk.id, endTime);
        const nowMillis = new Date().getTime();
        const endTimeMillis = Date.parse(endTime);
        const preloadMillis = 1000;
        const waitForMillis = Math.max(endTimeMillis - nowMillis - preloadMillis, 0);
        const eventId = result.data.schedule_Event_by_pk.id;
        const conferenceId = result.data.schedule_Event_by_pk.conferenceId;
        const intendedRoomModeName = result.data.schedule_Event_by_pk.intendedRoomModeName;

        setTimeout(() => {
            if ([Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(intendedRoomModeName)) {
                stopEventBroadcasts(eventId).catch((e) => {
                    console.error("Failed to stop event broadcasts", { eventId, e });
                });
            }

            notifyRealtimeServiceEventEnded(eventId).catch((e) => {
                console.error("Failed to notify real-time service event ended", { eventId, e });
            });
        }, waitForMillis);

        setTimeout(() => {
            insertChatDuplicationMarkers(eventId, false).catch((e) => {
                console.error("Failed to insert chat duplication end markers", { eventId, e });
            });
        }, endTimeMillis - nowMillis - 500);

        const harvestJobWaitForMillis = Math.max(endTimeMillis - nowMillis + 5000, 0);

        setTimeout(() => {
            if ([Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(intendedRoomModeName)) {
                createMediaPackageHarvestJob(eventId, conferenceId).catch((e) => {
                    console.error("Failed to create MediaPackage harvest job", { eventId, e });
                });
            }
        }, harvestJobWaitForMillis);
    } else {
        console.log("Event stop notification did not match current event, skipping.", { eventId, endTime, updatedAt });
    }
}

gql`
    query Event_GetEventVonageSession($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
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

    if (!eventDetails.data.schedule_Event_by_pk) {
        console.error("Could not retrieve event", params.eventId);
        throw new Error("Could not retrieve event");
    }

    if (!eventDetails.data.schedule_Event_by_pk.eventVonageSession) {
        console.log("Event has no associated Vonage session", params.eventId);
        return { broadcastsStopped: 0 };
    }

    const broadcasts = await Vonage.listBroadcasts({
        sessionId: eventDetails.data.schedule_Event_by_pk.eventVonageSession.sessionId,
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
