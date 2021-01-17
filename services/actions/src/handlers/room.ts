import { gql } from "@apollo/client/core";
import assert from "assert";
import * as R from "ramda";
import {
    AddAttendeeToRoomPeopleDocument,
    ContentGroup_CreateRoomDocument,
    CreateContentGroupRoom_GetContentGroupDocument,
    CreateDmRoomDocument,
    CreateDmRoom_GetAttendeesDocument,
    CreateDmRoom_GetExistingRoomsDocument,
    GetAttendeesForRoomAndUserDocument,
    RoomPersonRole_Enum,
    SetRoomVonageSessionIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getAttendee } from "../lib/authorisation";
import Vonage from "../lib/vonage/vonageClient";
import { Payload, RoomData } from "../types/hasura/event";

export async function handleRoomCreated(payload: Payload<RoomData>): Promise<void> {
    assert(payload.event.data.new, "Expected new row data");

    if (!payload.event.data.new.publicVonageSessionId) {
        await createRoomVonageSession(payload.event.data.new.id);
    }

    // If room was created by a user, add them as an admin
    if ("x-hasura-user-id" in payload.event.session_variables) {
        await addUserToRoomPeople(
            payload.event.session_variables["x-hasura-user-id"],
            payload.event.data.new.id,
            RoomPersonRole_Enum.Admin
        );
    }
}

async function createRoomVonageSession(roomId: string): Promise<string> {
    const sessionResult = await Vonage.createSession({ mediaMode: "routed" });

    if (!sessionResult) {
        throw new Error("No session ID returned from Vonage");
    }

    gql`
        mutation SetRoomVonageSessionId($roomId: uuid!, $sessionId: String!) {
            update_Room_by_pk(pk_columns: { id: $roomId }, _set: { publicVonageSessionId: $sessionId }) {
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

export async function addUserToRoomPeople(userId: string, roomId: string, role: RoomPersonRole_Enum): Promise<void> {
    gql`
        query GetAttendeesForRoomAndUser($roomId: uuid!, $userId: String!) {
            Room_by_pk(id: $roomId) {
                id
                conference {
                    attendees(where: { userId: { _eq: $userId } }) {
                        userId
                        id
                    }
                    id
                }
            }
        }
    `;

    const result = await apolloClient.query({
        query: GetAttendeesForRoomAndUserDocument,
        variables: {
            roomId,
            userId,
        },
    });

    if (result.error || result.errors) {
        console.error("Failed to get attendee to be added to the room people list", userId, roomId);
        throw new Error("Failed to get attendee to be added to the room people list");
    }

    if (
        !result.data.Room_by_pk?.conference.attendees ||
        result.data.Room_by_pk.conference.attendees.length === 0 ||
        !result.data.Room_by_pk.conference.attendees[0].userId
    ) {
        console.error("Could not find an attendee to be added to the room people list", userId, roomId);
        throw new Error("Could not find an attendee to be added to the room people list");
    }

    const attendeeId = result.data.Room_by_pk.conference.attendees[0].id;

    gql`
        mutation AddAttendeeToRoomPeople(
            $attendeeId: uuid!
            $roomId: uuid!
            $roomPersonRoleName: RoomPersonRole_enum!
        ) {
            insert_RoomPerson_one(
                object: { attendeeId: $attendeeId, roomId: $roomId, roomPersonRoleName: $roomPersonRoleName }
            ) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: AddAttendeeToRoomPeopleDocument,
        variables: {
            attendeeId,
            roomId,
            roomPersonRoleName: role,
        },
    });
}

export async function handleCreateDmRoom(params: createRoomDmArgs, userId: string): Promise<CreateRoomDmOutput> {
    const myAttendee = await getAttendee(userId, params.conferenceId);

    gql`
        query CreateDmRoom_GetAttendees($attendeeIds: [uuid!], $conferenceId: uuid!) {
            Attendee(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $attendeeIds } }) {
                id
                displayName
            }
        }
    `;

    const filteredAttendees = R.union(
        params.attendeeIds.filter((attendeeId) => attendeeId !== myAttendee.id),
        []
    );

    if (filteredAttendees.length < 1) {
        throw new Error("Must have at least one other attendee in the DM");
    }

    // Check that the other attendees also attend the conference
    const otherAttendeesResult = await apolloClient.query({
        query: CreateDmRoom_GetAttendeesDocument,
        variables: {
            attendeeIds: filteredAttendees,
            conferenceId: params.conferenceId,
        },
    });

    if (otherAttendeesResult.data.Attendee.length !== filteredAttendees.length) {
        throw new Error("Attendees must all be part of the specified conference");
    }

    // Check for an existing DM with these participants
    gql`
        query CreateDmRoom_GetExistingRooms($conferenceId: uuid!, $attendeeIds: [uuid!]) {
            Room(
                where: {
                    conferenceId: { _eq: $conferenceId }
                    roomPeople: { attendeeId: { _in: $attendeeIds }, _not: { attendeeId: { _nin: $attendeeIds } } }
                    roomPrivacyName: { _eq: DM }
                }
            ) {
                id
                roomPeople {
                    attendeeId
                    id
                }
            }
        }
    `;

    const existingRoomsResult = await apolloClient.query({
        query: CreateDmRoom_GetExistingRoomsDocument,
        variables: {
            conferenceId: params.conferenceId,
            attendeeIds: filteredAttendees,
        },
    });

    const fullMatch = existingRoomsResult.data.Room.find((room) =>
        R.isEmpty(
            R.symmetricDifference(
                room.roomPeople.map((person) => person.attendeeId),
                [...filteredAttendees, myAttendee.id]
            )
        )
    );

    if (fullMatch) {
        return {
            message: "DM already exists",
            roomId: fullMatch.id,
        };
    }

    // Otherwise, create a new room and add the participants
    gql`
        mutation CreateDmRoom(
            $capacity: Int!
            $conferenceId: uuid!
            $name: String!
            $data: [RoomPerson_insert_input!]!
        ) {
            insert_Room_one(
                object: {
                    capacity: $capacity
                    conferenceId: $conferenceId
                    currentModeName: BREAKOUT
                    name: $name
                    roomPrivacyName: DM
                    roomPeople: { data: $data }
                }
            ) {
                id
            }
        }
    `;

    const result = await apolloClient.mutate({
        mutation: CreateDmRoomDocument,
        variables: {
            capacity: filteredAttendees.length + 1,
            conferenceId: params.conferenceId,
            data: [
                { attendeeId: myAttendee.id, roomPersonRoleName: RoomPersonRole_Enum.Participant },
                ...filteredAttendees.map((attendeeId) => ({
                    attendeeId: attendeeId,
                    roomPersonRoleName: RoomPersonRole_Enum.Participant,
                })),
            ],
            name: [
                myAttendee.displayName,
                ...otherAttendeesResult.data.Attendee.map((attendee) => attendee.displayName),
            ].join(", "),
        },
    });

    if (!result.data?.insert_Room_one?.id) {
        throw new Error("Failed to create room");
    }

    return {
        roomId: result.data.insert_Room_one.id,
        message: "Created new DM",
    };
}

export async function handleCreateForContentGroup(
    params: createContentGroupRoomArgs,
    userId: string
): Promise<CreateContentGroupRoomOutput> {
    try {
        // todo: verify user role here. It's not critically important though.
        getAttendee(userId, params.conferenceId);

        gql`
            query CreateContentGroupRoom_GetContentGroup($id: uuid!) {
                ContentGroup_by_pk(id: $id) {
                    id
                    chatId
                    conferenceId
                    rooms(where: { name: { _like: "Breakout:%" } }, order_by: { created_at: asc }, limit: 1) {
                        id
                    }
                    title
                }
            }
        `;

        const contentGroupResult = await apolloClient.query({
            query: CreateContentGroupRoom_GetContentGroupDocument,
            variables: {
                id: params.contentGroupId,
            },
        });

        if (contentGroupResult.data.ContentGroup_by_pk?.conferenceId !== params.conferenceId) {
            throw new Error("Could not find specified content group in the conference");
        }

        if (contentGroupResult.data.ContentGroup_by_pk.rooms.length > 0) {
            return { roomId: contentGroupResult.data.ContentGroup_by_pk.rooms[0].id };
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

        console.log("Creating new breakout room for content group", params.contentGroupId, params.conferenceId);

        const createResult = await apolloClient.mutate({
            mutation: ContentGroup_CreateRoomDocument,
            variables: {
                conferenceId: params.conferenceId,
                name: `Breakout: ${contentGroupResult.data.ContentGroup_by_pk.title}`,
                originatingContentGroupId: params.contentGroupId,
                chatId: contentGroupResult.data.ContentGroup_by_pk.chatId,
            },
        });
        return {
            roomId: createResult.data?.insert_Room_one?.id,
        };
    } catch (e) {
        console.error("Failed to create room for content group", params.conferenceId, params.contentGroupId, e);
        return {
            message: "Could not create room",
        };
    }
}
