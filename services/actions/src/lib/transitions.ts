import { gql } from "@apollo/client/core";
import R from "ramda";
import {
    Content_ElementType_Enum,
    CreateTransitionDocument,
    DeleteTransitionsForConferenceDocument,
    GetEventsForRoomDocument,
    GetRoomIdsDocument,
    Room_Mode_Enum,
    Video_InputType_Enum,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function createTransitions(conferenceId: string): Promise<void> {
    gql`
        mutation DeleteTransitionsForConference($conferenceId: uuid!) {
            delete_video_Transitions(where: { conferenceId: { _eq: $conferenceId } }) {
                affected_rows
            }
        }
    `;

    const deleteResult = await apolloClient.mutate({
        mutation: DeleteTransitionsForConferenceDocument,
        variables: {
            conferenceId,
        },
    });

    if (deleteResult.errors) {
        console.error("Failed to clear existing transitions", conferenceId);
        throw new Error(`Failed to clear existing transitions for conference ${conferenceId}`);
    }

    console.log(
        "Cleared existing transitions",
        conferenceId,
        deleteResult.data?.delete_video_Transitions?.affected_rows
    );

    gql`
        query GetRoomIds($conferenceId: uuid!) {
            room_Room(where: { conferenceId: { _eq: $conferenceId } }) {
                id
            }
        }
    `;

    const roomsResult = await apolloClient.query({
        query: GetRoomIdsDocument,
        variables: {
            conferenceId,
        },
    });

    await Promise.all(
        roomsResult.data.room_Room.map(async (room) => await createTransitionsForRoom(conferenceId, room.id))
    );
}

export async function createTransitionsForRoom(conferenceId: string, roomId: string): Promise<void> {
    gql`
        query GetEventsForRoom($roomId: uuid!) {
            room_Room_by_pk(id: $roomId) {
                id
                events(order_by: { startTime: asc }) {
                    item {
                        id
                        elements {
                            id
                            typeName
                            broadcastElement {
                                id
                                input
                                inputTypeName
                            }
                            name
                            updatedAt
                        }
                    }
                    id
                    durationSeconds
                    startTime
                    intendedRoomModeName
                    name
                    broadcastElement {
                        id
                        inputTypeName
                    }
                }
            }
        }
    `;

    const eventsResult = await apolloClient.query({
        query: GetEventsForRoomDocument,
        variables: {
            roomId,
        },
    });

    if (!eventsResult.data.room_Room_by_pk) {
        throw new Error(`Could not find room ${roomId}`);
    }

    for (const event of eventsResult.data.room_Room_by_pk.events) {
        const startTimeMillis = Date.parse(event.startTime);

        switch (event.intendedRoomModeName) {
            case Room_Mode_Enum.Prerecorded:
                {
                    // console.log("Creating transitions for prerecorded event", event.id);
                    // const titleElement = event.item?.elements.find(
                    //     (element) => element.typeName === Content_ElementType_Enum.VideoTitles
                    // );

                    // if (titleElement && titleElement.broadcastElement) {
                    //     await createTransition(
                    //         titleElement.broadcastElement.id,
                    //         event.id,
                    //         roomId,
                    //         conferenceId,
                    //         new Date(startTimeMillis - 10000)
                    //     );
                    // } else {
                    //     console.warn("No titles found for event", event.id, event.item?.id);
                    // }

                    const broadcastElement = event.item?.elements.find(
                        (element) => element.typeName === Content_ElementType_Enum.VideoBroadcast
                    );

                    if (broadcastElement && broadcastElement.broadcastElement) {
                        await createTransition(
                            broadcastElement.broadcastElement.id,
                            event.id,
                            roomId,
                            conferenceId,
                            new Date(startTimeMillis)
                        );
                    } else {
                        console.warn("No broadcast video found for event", event.id, event.item?.id);
                    }
                }
                break;
            case Room_Mode_Enum.Presentation:
            case Room_Mode_Enum.QAndA: {
                console.log("Creating transitions for live event", event.id);
                const broadcastElement = event.broadcastElement;

                if (broadcastElement && broadcastElement.inputTypeName === Video_InputType_Enum.VonageSession) {
                    await createTransition(
                        broadcastElement.id,
                        event.id,
                        roomId,
                        conferenceId,
                        new Date(startTimeMillis)
                    );
                }
                break;
            }
        }
    }

    R.aperture(2)(eventsResult.data.room_Room_by_pk.events).filter(([event1, event2]) => {
        const event1Start = Date.parse(event1.startTime);
        const event2Start = Date.parse(event2.startTime);
        const maxGap = 2 * 60 * 60 * 1000;
        return event1Start + event1.durationSeconds * 1000 + maxGap < event2Start;
    });
}

async function createTransition(
    broadcastElementId: string,
    eventId: string,
    roomId: string,
    conferenceId: string,
    dateTime: Date
) {
    gql`
        mutation CreateTransition(
            $broadcastElementId: uuid!
            $conferenceId: uuid!
            $eventId: uuid
            $roomId: uuid!
            $time: timestamptz!
        ) {
            insert_video_Transitions_one(
                object: {
                    broadcastElementId: $broadcastElementId
                    conferenceId: $conferenceId
                    eventId: $eventId
                    roomId: $roomId
                    time: $time
                }
            ) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: CreateTransitionDocument,
        variables: {
            broadcastElementId,
            eventId,
            roomId,
            conferenceId,
            time: dateTime.toISOString(),
        },
    });
}
