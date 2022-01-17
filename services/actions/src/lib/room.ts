import { gql } from "@apollo/client/core";
import type { Meeting } from "@aws-sdk/client-chime";
import assert from "assert";
import type { P } from "pino";
import { is } from "typescript-is";
import {
    CreateItemRoom_GetItemDocument,
    CreateRoomChimeMeetingDocument,
    GetRoomByChimeMeetingIdDocument,
    GetRoomBySessionIdDocument,
    GetRoomChimeMeetingDocument,
    GetRoomConferenceIdDocument,
    GetRoomThatRegistrantCanJoinDocument,
    GetRoomVonageMeetingDocument,
    Item_CreateRoomDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { callWithRetry } from "../utils";
import { createChimeMeeting, doesChimeMeetingExist } from "./aws/chime";
import { deleteRoomChimeMeeting } from "./roomChimeMeeting";

export async function createItemVideoChatRoom(logger: P.Logger, itemId: string, conferenceId: string): Promise<string> {
    gql`
        query CreateItemRoom_GetItem($id: uuid!) {
            content_Item_by_pk(id: $id) {
                id
                chatId
                conferenceId
                subconferenceId
                room {
                    id
                }
                title
            }
        }
    `;

    const itemResult = await (
        await apolloClient
    ).query({
        query: CreateItemRoom_GetItemDocument,
        variables: {
            id: itemId,
        },
    });

    if (itemResult.data.content_Item_by_pk?.conferenceId !== conferenceId) {
        throw new Error("Could not find specified content group in the conference");
    }

    if (itemResult.data.content_Item_by_pk.room) {
        return itemResult.data.content_Item_by_pk.room.id;
    }

    gql`
        mutation Item_CreateRoom(
            $chatId: uuid = null
            $conferenceId: uuid!
            $name: String!
            $itemId: uuid!
            $subconferenceId: uuid = null
        ) {
            insert_room_Room_one(
                object: {
                    capacity: 50
                    chatId: $chatId
                    conferenceId: $conferenceId
                    currentModeName: VIDEO_CHAT
                    name: $name
                    itemId: $itemId
                    managementModeName: PUBLIC
                    subconferenceId: $subconferenceId
                }
            ) {
                id
            }
        }
    `;

    logger.info({ itemId, conferenceId }, "Creating new breakout room for content group");

    const createResult = await (
        await apolloClient
    ).mutate({
        mutation: Item_CreateRoomDocument,
        variables: {
            conferenceId: conferenceId,
            name: `${itemResult.data.content_Item_by_pk.title}`,
            itemId,
            chatId: itemResult.data.content_Item_by_pk.chatId,
        },
    });
    return createResult.data?.insert_room_Room_one?.id;
}

export async function getRoomConferenceId(
    roomId: string
): Promise<{ conferenceId: string; subconferenceId: string | null }> {
    gql`
        query GetRoomConferenceId($roomId: uuid!) {
            room_Room_by_pk(id: $roomId) {
                id
                conferenceId
                subconferenceId
            }
        }
    `;

    const room = await (
        await apolloClient
    ).query({
        query: GetRoomConferenceIdDocument,
        variables: {
            roomId,
        },
    });

    if (!room.data.room_Room_by_pk) {
        throw new Error("Could not find room");
    }

    return {
        conferenceId: room.data.room_Room_by_pk.conferenceId,
        subconferenceId: room.data.room_Room_by_pk.subconferenceId ?? null,
    };
}

export async function canUserJoinRoom(registrantId: string, roomId: string, conferenceId: string): Promise<boolean> {
    gql`
        query GetRoomThatRegistrantCanJoin($roomId: uuid, $registrantId: uuid, $conferenceId: uuid) {
            room_Room(
                where: {
                    id: { _eq: $roomId }
                    conference: { registrants: { id: { _eq: $registrantId } }, id: { _eq: $conferenceId } }
                    _or: [
                        { roomMemberships: { registrant: { id: { _eq: $registrantId } } } }
                        { managementModeName: { _eq: PUBLIC } }
                    ]
                }
            ) {
                id
                publicVonageSessionId
                conference {
                    registrants(where: { id: { _eq: $registrantId } }) {
                        id
                    }
                }
            }
        }
    `;
    const result = await callWithRetry(async () =>
        (
            await apolloClient
        ).query({
            query: GetRoomThatRegistrantCanJoinDocument,
            variables: {
                roomId,
                registrantId,
                conferenceId,
            },
        })
    );
    return result.data.room_Room.length > 0;
}

export async function createRoomChimeMeeting(logger: P.Logger, roomId: string, conferenceId: string): Promise<Meeting> {
    const chimeMeetingData = await createChimeMeeting(roomId);

    gql`
        mutation CreateRoomChimeMeeting(
            $conferenceId: uuid!
            $chimeMeetingData: jsonb!
            $chimeMeetingId: String!
            $roomId: uuid!
        ) {
            insert_room_ChimeMeeting_one(
                object: {
                    conferenceId: $conferenceId
                    chimeMeetingData: $chimeMeetingData
                    chimeMeetingId: $chimeMeetingId
                    roomId: $roomId
                }
            ) {
                id
            }
        }
    `;

    try {
        assert(chimeMeetingData.MeetingId);
        await (
            await apolloClient
        ).mutate({
            mutation: CreateRoomChimeMeetingDocument,
            variables: {
                conferenceId,
                roomId,
                chimeMeetingData,
                chimeMeetingId: chimeMeetingData.MeetingId,
            },
        });
    } catch (e: any) {
        logger.error({ err: e, roomId, conferenceId }, "Failed to create a room Chime meeting");
        throw e;
    }

    return chimeMeetingData;
}

export async function getExistingRoomChimeMeeting(logger: P.Logger, roomId: string): Promise<Meeting | null> {
    gql`
        query GetRoomChimeMeeting($roomId: uuid!) {
            room_ChimeMeeting(where: { roomId: { _eq: $roomId } }) {
                id
                chimeMeetingData
            }
        }
    `;

    const result = await (
        await apolloClient
    ).query({
        query: GetRoomChimeMeetingDocument,
        variables: {
            roomId,
        },
    });

    if (result.data.room_ChimeMeeting.length === 1) {
        const chimeMeetingId = result.data.room_ChimeMeeting[0].id;
        const chimeMeetingData: Meeting = result.data.room_ChimeMeeting[0].chimeMeetingData;
        if (!is<Meeting>(chimeMeetingData)) {
            logger.warn(
                {
                    chimeMeetingData,
                    roomId,
                },
                "Retrieved Chime meeting data could not be validated, deleting record"
            );
            await deleteRoomChimeMeeting(chimeMeetingId);
            return null;
        }

        if (!chimeMeetingData.MeetingId || typeof chimeMeetingData.MeetingId !== "string") {
            logger.warn(
                {
                    chimeMeetingData,
                    roomId,
                },
                "Retrieved Chime meeting data could not be validated, deleting record"
            );
            await deleteRoomChimeMeeting(chimeMeetingId);
            return null;
        }

        const exists = await doesChimeMeetingExist(chimeMeetingData.MeetingId);

        if (!exists) {
            logger.warn(
                {
                    chimeMeetingData,
                    roomId,
                },
                "Chime meeting no longer exists, deleting record"
            );
            await deleteRoomChimeMeeting(chimeMeetingId);
            return null;
        }

        return chimeMeetingData;
    }

    return null;
}

export async function getExistingRoomVonageMeeting(roomId: string): Promise<string | null> {
    gql`
        query GetRoomVonageMeeting($roomId: uuid!) {
            room_Room_by_pk(id: $roomId) {
                id
                publicVonageSessionId
            }
        }
    `;

    const result = await (
        await apolloClient
    ).query({
        query: GetRoomVonageMeetingDocument,
        variables: {
            roomId,
        },
    });

    return result.data.room_Room_by_pk?.publicVonageSessionId ?? null;
}

export async function getRoomChimeMeeting(logger: P.Logger, roomId: string): Promise<Meeting> {
    const existingChimeMeetingData = await getExistingRoomChimeMeeting(logger, roomId);

    if (existingChimeMeetingData) {
        return existingChimeMeetingData;
    }

    try {
        const { conferenceId } = await getRoomConferenceId(roomId);
        const chimeMeetingData = await createRoomChimeMeeting(logger, roomId, conferenceId);
        return chimeMeetingData;
    } catch (e: any) {
        const existingChimeMeetingData = await getExistingRoomChimeMeeting(logger, roomId);
        if (existingChimeMeetingData) {
            return existingChimeMeetingData;
        }

        logger.error({ err: e, roomId }, "Could not get Chime meeting data");
        throw new Error("Could not get Chime meeting data");
    }
}

export async function getRoomVonageMeeting(roomId: string): Promise<string | null> {
    const existingVonageMeetingId = await getExistingRoomVonageMeeting(roomId);

    if (existingVonageMeetingId) {
        return existingVonageMeetingId;
    }

    // todo: create session if appropriate

    return null;
}

export async function getRoomByVonageSessionId(
    sessionId: string
): Promise<{ roomId: string; conferenceId: string } | null> {
    gql`
        query GetRoomBySessionId($sessionId: String!) {
            room_Room(where: { publicVonageSessionId: { _eq: $sessionId } }) {
                id
                conferenceId
            }
        }
    `;

    const roomResult = await (
        await apolloClient
    ).query({
        query: GetRoomBySessionIdDocument,
        variables: {
            sessionId,
        },
    });

    return roomResult.data.room_Room.length === 1
        ? { roomId: roomResult.data.room_Room[0].id, conferenceId: roomResult.data.room_Room[0].conferenceId }
        : null;
}

export async function getRoomByChimeMeetingId(
    meetingId: string
): Promise<{ roomId: string; conferenceId: string } | null> {
    gql`
        query GetRoomByChimeMeetingId($meetingId: String!) {
            room_Room(where: { chimeMeeting: { chimeMeetingId: { _eq: $meetingId } } }) {
                id
                conferenceId
            }
        }
    `;

    const roomResult = await (
        await apolloClient
    ).query({
        query: GetRoomByChimeMeetingIdDocument,
        variables: {
            meetingId,
        },
    });

    return roomResult.data.room_Room.length === 1
        ? { roomId: roomResult.data.room_Room[0].id, conferenceId: roomResult.data.room_Room[0].conferenceId }
        : null;
}
