import { gql } from "@apollo/client/core";
import R from "ramda";
import {
    ContentType_Enum,
    CreateTransitionDocument,
    DeleteTransitionsForConferenceDocument,
    GetEventsForRoomDocument,
    GetRoomIdsDocument,
    InputType_Enum,
    RoomMode_Enum,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function createTransitions(conferenceId: string): Promise<void> {
    gql`
        mutation DeleteTransitionsForConference($conferenceId: uuid!) {
            delete_Transitions(where: { conferenceId: { _eq: $conferenceId } }) {
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

    console.log("Cleared existing transitions", conferenceId, deleteResult.data?.delete_Transitions?.affected_rows);

    gql`
        query GetRoomIds($conferenceId: uuid!) {
            Room(where: { conferenceId: { _eq: $conferenceId } }) {
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

    await Promise.all(roomsResult.data.Room.map(async (room) => await createTransitionsForRoom(conferenceId, room.id)));
}

export async function createTransitionsForRoom(conferenceId: string, roomId: string): Promise<void> {
    gql`
        query GetEventsForRoom($roomId: uuid!) {
            Room_by_pk(id: $roomId) {
                events(order_by: { startTime: asc }) {
                    contentGroup {
                        id
                        contentItems {
                            id
                            contentTypeName
                            broadcastContentItem {
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
                }
                broadcastContentItem {
                    id
                    inputTypeName
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

    if (!eventsResult.data.Room_by_pk) {
        throw new Error(`Could not find room ${roomId}`);
    }

    for (const event of eventsResult.data.Room_by_pk.events) {
        const startTimeMillis = Date.parse(event.startTime);

        switch (event.intendedRoomModeName) {
            case RoomMode_Enum.Prerecorded:
                {
                    console.log("Creating transitions for prerecorded event", event.id);
                    const titleContentItem = event.contentGroup?.contentItems.find(
                        (contentItem) => contentItem.contentTypeName === ContentType_Enum.VideoTitles
                    );

                    if (titleContentItem && titleContentItem.broadcastContentItem) {
                        await createTransition(
                            titleContentItem.broadcastContentItem.id,
                            event.id,
                            roomId,
                            conferenceId,
                            new Date(startTimeMillis - 10000)
                        );
                    } else {
                        console.warn("No titles found for event", event.id, event.contentGroup?.id);
                    }

                    const broadcastContentItem = event.contentGroup?.contentItems.find(
                        (contentItem) => contentItem.contentTypeName === ContentType_Enum.VideoBroadcast
                    );

                    if (broadcastContentItem && broadcastContentItem.broadcastContentItem) {
                        await createTransition(
                            broadcastContentItem.broadcastContentItem.id,
                            event.id,
                            roomId,
                            conferenceId,
                            new Date(startTimeMillis)
                        );
                    } else {
                        console.warn("No broadcast video found for event", event.id, event.contentGroup?.id);
                    }
                }
                break;
            case RoomMode_Enum.Presentation:
            case RoomMode_Enum.QAndA: {
                console.log("Creating transitions for live event", event.id);
                const broadcastContentItem = eventsResult.data.Room_by_pk.broadcastContentItem;

                if (broadcastContentItem && broadcastContentItem.inputTypeName === InputType_Enum.VonageSession) {
                    await createTransition(
                        broadcastContentItem.id,
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

    R.aperture(2)(eventsResult.data.Room_by_pk.events).filter(([event1, event2]) => {
        const event1Start = Date.parse(event1.startTime);
        const event2Start = Date.parse(event2.startTime);
        const maxGap = 2 * 60 * 60 * 1000;
        return event1Start + event1.durationSeconds * 1000 + maxGap < event2Start;
    });
}

async function createTransition(
    broadcastContentItemId: string,
    eventId: string,
    roomId: string,
    conferenceId: string,
    dateTime: Date
) {
    gql`
        mutation CreateTransition(
            $broadcastContentId: uuid!
            $conferenceId: uuid!
            $eventId: uuid
            $roomId: uuid!
            $time: timestamptz!
        ) {
            insert_Transitions_one(
                object: {
                    broadcastContentId: $broadcastContentId
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

    apolloClient.mutate({
        mutation: CreateTransitionDocument,
        variables: {
            broadcastContentId: broadcastContentItemId,
            eventId,
            roomId,
            conferenceId,
            time: dateTime.toISOString(),
        },
    });
}
