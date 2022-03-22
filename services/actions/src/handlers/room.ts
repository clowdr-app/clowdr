import { gql } from "@apollo/client/core";
import type {
    createContentGroupRoomArgs,
    CreateContentGroupRoomOutput,
    createRoomDmArgs,
    CreateRoomDmOutput,
} from "@midspace/hasura/action-types";
import type { EventPayload } from "@midspace/hasura/event";
import type { RoomData } from "@midspace/hasura/event-data";
import assert from "assert";
import { sub } from "date-fns";
import type { P } from "pino";
import * as R from "ramda";
import {
    AddRegistrantToRoomMembershipsDocument,
    CreateDmRoomDocument,
    CreateDmRoom_GetExistingRoomsDocument,
    CreateDmRoom_GetRegistrantsDocument,
    GetRegistrantsForRoomAndUserDocument,
    Room_PersonRole_Enum,
    SetRoomVonageSessionIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getRegistrant } from "../lib/authorisation";
import { createItemVideoChatRoom } from "../lib/room";
import { deleteRoomParticipantsCreatedBefore } from "../lib/roomParticipant";
import Vonage from "../lib/vonage/vonageClient";

export async function handleRoomCreated(logger: P.Logger, payload: EventPayload<RoomData>): Promise<void> {
    assert(payload.event.data.new, "Expected new row data");

    if (!payload.event.data.new.publicVonageSessionId) {
        await createRoomVonageSession(payload.event.data.new.id);
    }

    // If room was created by a user, add them as an admin
    if (payload.event.session_variables && "x-hasura-user-id" in payload.event.session_variables) {
        await addUserToRoomMemberships(
            logger,
            payload.event.session_variables["x-hasura-user-id"],
            payload.event.data.new.id,
            Room_PersonRole_Enum.Admin
        );
    }
}

async function createRoomVonageSession(roomId: string): Promise<string> {
    const sessionResult = await Vonage.createSession({ mediaMode: "routed", archiveMode: "manual" });

    if (!sessionResult) {
        throw new Error("No session ID returned from Vonage");
    }

    gql`
        mutation SetRoomVonageSessionId($roomId: uuid!, $sessionId: String!) {
            update_room_Room_by_pk(pk_columns: { id: $roomId }, _set: { publicVonageSessionId: $sessionId }) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: SetRoomVonageSessionIdDocument,
        variables: {
            roomId: roomId,
            sessionId: sessionResult.sessionId,
        },
    });

    return sessionResult.sessionId;
}

export async function addUserToRoomMemberships(
    logger: P.Logger,
    userId: string,
    roomId: string,
    role: Room_PersonRole_Enum
): Promise<void> {
    gql`
        query GetRegistrantsForRoomAndUser($roomId: uuid!, $userId: String!) {
            registrant_Registrant(
                where: { conference: { rooms: { id: { _eq: $roomId } } }, userId: { _eq: $userId } }
            ) {
                id
            }
        }
    `;

    const result = await apolloClient.query({
        query: GetRegistrantsForRoomAndUserDocument,
        variables: {
            roomId,
            userId,
        },
    });

    if (!result.data.registrant_Registrant?.length) {
        logger.error({ userId, roomId }, "Could not find an registrant to be added to the room people list");
        throw new Error("Could not find an registrant to be added to the room people list");
    }

    const registrantId = result.data.registrant_Registrant[0].id;

    gql`
        mutation AddRegistrantToRoomMemberships(
            $registrantId: uuid!
            $roomId: uuid!
            $roomPersonRoleName: room_PersonRole_enum!
        ) {
            insert_room_RoomMembership_one(
                object: { registrantId: $registrantId, roomId: $roomId, personRoleName: $roomPersonRoleName }
            ) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: AddRegistrantToRoomMembershipsDocument,
        variables: {
            registrantId,
            roomId,
            roomPersonRoleName: role,
        },
    });
}

export async function handleCreateDmRoom(params: createRoomDmArgs, userId: string): Promise<CreateRoomDmOutput> {
    const myRegistrant = await getRegistrant(userId, params.conferenceId);

    gql`
        query CreateDmRoom_GetRegistrants($registrantIds: [uuid!], $conferenceId: uuid!) {
            registrant_Registrant(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $registrantIds } }) {
                id
                displayName
            }
        }
    `;

    const filteredRegistrants = R.union(
        params.registrantIds.filter((registrantId) => registrantId !== myRegistrant.id),
        []
    );

    if (filteredRegistrants.length < 1) {
        throw new Error("Must have at least one other registrant in the DM");
    }

    // Check that the other registrants also attend the conference
    const otherRegistrantsResult = await apolloClient.query({
        query: CreateDmRoom_GetRegistrantsDocument,
        variables: {
            registrantIds: filteredRegistrants,
            conferenceId: params.conferenceId,
        },
    });

    if (otherRegistrantsResult.data.registrant_Registrant.length !== filteredRegistrants.length) {
        throw new Error("Registrants must all be part of the specified conference");
    }

    // Check for an existing DM with these participants
    gql`
        query CreateDmRoom_GetExistingRooms($conferenceId: uuid!, $registrantIds: [uuid!]) {
            room_Room(
                where: {
                    conferenceId: { _eq: $conferenceId }
                    roomMemberships: {
                        registrantId: { _in: $registrantIds }
                        _not: { registrantId: { _nin: $registrantIds } }
                    }
                    managementModeName: { _eq: DM }
                }
            ) {
                id
                chatId
                roomMemberships {
                    registrantId
                    id
                }
            }
        }
    `;

    const existingRoomsResult = await apolloClient.query({
        query: CreateDmRoom_GetExistingRoomsDocument,
        variables: {
            conferenceId: params.conferenceId,
            registrantIds: filteredRegistrants,
        },
    });

    const fullMatch = existingRoomsResult.data.room_Room.find((room) =>
        R.isEmpty(
            R.symmetricDifference(
                room.roomMemberships.map((person) => person.registrantId),
                [...filteredRegistrants, myRegistrant.id]
            )
        )
    );

    if (fullMatch) {
        return {
            message: "DM already exists",
            roomId: fullMatch.id,
            chatId: fullMatch.chatId,
        };
    }

    // Otherwise, create a new room and add the participants
    gql`
        mutation CreateDmRoom(
            $capacity: Int!
            $conferenceId: uuid!
            $name: String!
            $data: [room_RoomMembership_insert_input!]!
        ) {
            insert_room_Room_one(
                object: {
                    capacity: $capacity
                    conferenceId: $conferenceId
                    subconferenceId: null
                    name: $name
                    managementModeName: DM
                    roomMemberships: { data: $data }
                }
            ) {
                id
                chatId
            }
        }
    `;

    const result = await apolloClient.mutate({
        mutation: CreateDmRoomDocument,
        variables: {
            capacity: filteredRegistrants.length + 1,
            conferenceId: params.conferenceId,
            data: [
                { registrantId: myRegistrant.id, personRoleName: Room_PersonRole_Enum.Participant },
                ...filteredRegistrants.map((registrantId) => ({
                    registrantId: registrantId,
                    personRoleName: Room_PersonRole_Enum.Participant,
                })),
            ],
            name: [
                myRegistrant.displayName,
                ...otherRegistrantsResult.data.registrant_Registrant.map((registrant) => registrant.displayName),
            ].join(", "),
        },
    });

    if (!result.data?.insert_room_Room_one?.id) {
        throw new Error("Failed to create room");
    }

    return {
        roomId: result.data.insert_room_Room_one.id,
        chatId: result.data.insert_room_Room_one.chatId,
        message: "Created new DM",
    };
}

export async function handleCreateForItem(
    logger: P.Logger,
    params: createContentGroupRoomArgs,
    userId: string
): Promise<CreateContentGroupRoomOutput> {
    try {
        // TODO: verify user role here. It's not critically important though.
        getRegistrant(userId, params.conferenceId);
    } catch (e: any) {
        logger.error({ err: e }, "Could not find registrant at conference when creating breakout room");
        return {
            message: "Registrant is not a member of the conference",
        };
    }

    try {
        const roomId = await createItemVideoChatRoom(
            logger,
            params.itemId,
            params.conferenceId,
            params.subconferenceId
        );
        return {
            roomId,
        };
    } catch (e: any) {
        logger.error({ err: e }, "Failed to create content group breakout room");
        return {
            message: "Could not create room",
        };
    }
}

export async function handleRemoveOldRoomParticipants(logger: P.Logger): Promise<void> {
    logger.info("Removing room participants created more than 6 hours ago");
    const deleted = await deleteRoomParticipantsCreatedBefore(sub(new Date(), { hours: 6 }));
    logger.info({ count: deleted }, `Removed ${deleted} room participants created more than 6 hours ago`);
}
