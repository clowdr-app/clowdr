import { gql } from "@apollo/client/core";
import { Meeting } from "@aws-sdk/client-chime";
import { is } from "typescript-is";
import {
    ContentGroup_CreateRoomDocument,
    CreateContentGroupRoom_GetContentGroupDocument,
    CreateRoomChimeMeetingDocument,
    DeleteRoomChimeMeetingDocument,
    GetRoomChimeMeetingDocument,
    GetRoomConferenceIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createChimeMeeting, doesChimeMeetingExist } from "./aws/chime";

export async function createContentGroupBreakoutRoom(contentGroupId: string, conferenceId: string): Promise<string> {
    gql`
        query CreateContentGroupRoom_GetContentGroup($id: uuid!) {
            ContentGroup_by_pk(id: $id) {
                id
                chatId
                conferenceId
                rooms(where: { originatingEventId: { _is_null: true } }, order_by: { created_at: asc }, limit: 1) {
                    id
                }
                title
            }
        }
    `;

    const contentGroupResult = await apolloClient.query({
        query: CreateContentGroupRoom_GetContentGroupDocument,
        variables: {
            id: contentGroupId,
        },
    });

    if (contentGroupResult.data.ContentGroup_by_pk?.conferenceId !== conferenceId) {
        throw new Error("Could not find specified content group in the conference");
    }

    if (contentGroupResult.data.ContentGroup_by_pk.rooms.length > 0) {
        return contentGroupResult.data.ContentGroup_by_pk.rooms[0].id;
    }

    gql`
        mutation ContentGroup_CreateRoom(
            $chatId: uuid = null
            $conferenceId: uuid!
            $name: String!
            $originatingContentGroupId: uuid!
        ) {
            insert_Room_one(
                object: {
                    capacity: 50
                    chatId: $chatId
                    conferenceId: $conferenceId
                    currentModeName: BREAKOUT
                    name: $name
                    originatingContentGroupId: $originatingContentGroupId
                    roomPrivacyName: PUBLIC
                }
            ) {
                id
            }
        }
    `;

    console.log("Creating new breakout room for content group", contentGroupId, conferenceId);

    const createResult = await apolloClient.mutate({
        mutation: ContentGroup_CreateRoomDocument,
        variables: {
            conferenceId: conferenceId,
            name: `${contentGroupResult.data.ContentGroup_by_pk.title}`,
            originatingContentGroupId: contentGroupId,
            chatId: contentGroupResult.data.ContentGroup_by_pk.chatId,
        },
    });
    return createResult.data?.insert_Room_one?.id;
}

export async function getRoomConferenceId(roomId: string): Promise<string> {
    gql`
        query GetRoomConferenceId($roomId: uuid!) {
            Room_by_pk(id: $roomId) {
                id
                conferenceId
            }
        }
    `;

    const room = await apolloClient.query({
        query: GetRoomConferenceIdDocument,
        variables: {
            roomId,
        },
    });

    if (!room.data.Room_by_pk) {
        throw new Error("Could not find room");
    }

    return room.data.Room_by_pk.conferenceId;
}

export async function canUserJoinRoom(_attendeeId: string, _roomId: string): Promise<boolean> {
    // todo: write logic
    return false;
}

export async function createRoomChimeMeeting(roomId: string, conferenceId: string): Promise<Meeting> {
    const chimeMeetingData = await createChimeMeeting(roomId);

    gql`
        mutation CreateRoomChimeMeeting($conferenceId: uuid!, $chimeMeetingData: jsonb!, $roomId: uuid!) {
            insert_room_RoomChimeMeeting_one(
                object: { conferenceId: $conferenceId, chimeMeetingData: $chimeMeetingData, roomId: $roomId }
            ) {
                id
            }
        }
    `;

    try {
        await apolloClient.mutate({
            mutation: CreateRoomChimeMeetingDocument,
            variables: {
                conferenceId,
                roomId,
                chimeMeetingData,
            },
        });
    } catch (e) {
        console.error("Failed to create a room Chime meeting", { err: e, roomId, conferenceId });
        throw e;
    }

    return chimeMeetingData;
}

export async function getExistingRoomChimeMeeting(roomId: string): Promise<Meeting | null> {
    gql`
        query GetRoomChimeMeeting($roomId: uuid!) {
            room_RoomChimeMeeting(where: { roomId: { _eq: $roomId } }) {
                id
                chimeMeetingData
            }
        }
    `;

    const result = await apolloClient.query({
        query: GetRoomChimeMeetingDocument,
        variables: {
            roomId,
        },
    });

    if (result.data.room_RoomChimeMeeting.length === 1) {
        const roomChimeMeetingId = result.data.room_RoomChimeMeeting[0].id;
        const chimeMeetingData: Meeting = result.data.room_RoomChimeMeeting[0].chimeMeetingData;
        if (!is<Meeting>(chimeMeetingData)) {
            console.warn("Retrieved Chime meeting data could not be validated, deleting record", {
                chimeMeetingData,
                roomId,
            });
            await deleteRoomChimeMeeting(roomChimeMeetingId);
            return null;
        }

        if (!chimeMeetingData.MeetingId || typeof chimeMeetingData.MeetingId !== "string") {
            console.warn("Retrieved Chime meeting data could not be validated, deleting record", {
                chimeMeetingData,
                roomId,
            });
            await deleteRoomChimeMeeting(roomChimeMeetingId);
            return null;
        }

        const exists = await doesChimeMeetingExist(chimeMeetingData.MeetingId);

        if (!exists) {
            console.warn("Chime meeting no longer exists, deleting record", {
                chimeMeetingData,
                roomId,
            });
            await deleteRoomChimeMeeting(roomChimeMeetingId);
            return null;
        }

        return chimeMeetingData;
    }

    return null;
}

export async function deleteRoomChimeMeeting(roomChimeMeetingId: string): Promise<void> {
    gql`
        mutation DeleteRoomChimeMeeting($roomChimeMeetingId: uuid!) {
            delete_room_RoomChimeMeeting_by_pk(id: $roomChimeMeetingId) {
                id
            }
        }
    `;
    await apolloClient.mutate({
        mutation: DeleteRoomChimeMeetingDocument,
        variables: {
            roomChimeMeetingId: roomChimeMeetingId,
        },
    });
}

export async function getRoomChimeMeeting(roomId: string, conferenceId: string): Promise<Meeting> {
    const existingChimeMeetingData = await getExistingRoomChimeMeeting(roomId);

    if (existingChimeMeetingData) {
        return existingChimeMeetingData;
    }

    try {
        const chimeMeetingData = await createRoomChimeMeeting(roomId, conferenceId);
        return chimeMeetingData;
    } catch (e) {
        const existingChimeMeetingId = await getExistingRoomChimeMeeting(roomId);
        if (existingChimeMeetingId) {
            return existingChimeMeetingId;
        }

        throw new Error("Could not get Chime meeting id");
    }
}
