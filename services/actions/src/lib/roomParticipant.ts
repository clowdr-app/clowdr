import { gql } from "@apollo/client/core";
import type { VonageSessionLayoutData} from "../../../../shared/build/vonage";
import { VonageSessionLayoutType } from "../../../../shared/build/vonage";
import type {
    RoomParticipantFragment} from "../generated/graphql";
import {
    CountRoomParticipantsDocument,
    CreateRoomParticipantDocument,
    DeleteRoomParticipantsCreatedBeforeDocument,
    GetRoomParticipantDetailsDocument,
    InsertVonageSessionLayoutDocument,
    RemoveRoomParticipantDocument
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { kickRegistrantFromRoom } from "./vonage/vonageTools";

gql`
    mutation CreateRoomParticipant(
        $registrantId: uuid!
        $conferenceId: uuid!
        $roomId: uuid!
        $vonageConnectionId: String
        $chimeRegistrantId: String
    ) {
        insert_room_Participant_one(
            object: {
                registrantId: $registrantId
                conferenceId: $conferenceId
                roomId: $roomId
                vonageConnectionId: $vonageConnectionId
                chimeRegistrantId: $chimeRegistrantId
            }
            on_conflict: { constraint: Participant_roomId_registrantId_key, update_columns: [updatedAt] }
        ) {
            id
        }
    }
`;

export async function addRoomParticipant(
    roomId: string,
    conferenceId: string,
    identifier: { vonageConnectionId: string } | { chimeRegistrantId: string },
    registrantId: string
): Promise<void> {
    const participantIdentifier =
        "vonageConnectionId" in identifier
            ? { vonageConnectionId: identifier.vonageConnectionId }
            : { chimeRegistrantId: identifier.chimeRegistrantId };

    try {
        await apolloClient.mutate({
            mutation: CreateRoomParticipantDocument,
            variables: {
                registrantId,
                conferenceId,
                roomId,
                vonageConnectionId: null,
                chimeRegistrantId: null,
                ...participantIdentifier,
            },
        });
    } catch (err) {
        if ("vonageConnectionId" in identifier) {
            // If there is already a row for this room, kick the previous connection before recording the new one
            console.info("Registrant is already in the Vonage room, kicking from previous session", {
                roomId,
                registrantId,
                conferenceId,
            });
            await kickRegistrantFromRoom(roomId, registrantId);

            await apolloClient.mutate({
                mutation: CreateRoomParticipantDocument,
                variables: {
                    registrantId,
                    conferenceId,
                    roomId,
                    vonageConnectionId: null,
                    chimeRegistrantId: null,
                    ...participantIdentifier,
                },
            });
        } else {
            console.info("Registrant is already in the Chime room, ignoring", {
                roomId,
                registrantId,
                conferenceId,
            });
        }
    }
}

gql`
    mutation RemoveRoomParticipant(
        $registrantId: uuid!
        $conferenceId: uuid!
        $roomId: uuid!
        $vonageConnectionId: String
        $chimeRegistrantId: String
    ) {
        delete_room_Participant(
            where: {
                registrantId: { _eq: $registrantId }
                conferenceId: { _eq: $conferenceId }
                roomId: { _eq: $roomId }
            }
        ) {
            affected_rows
        }
    }

    query CountRoomParticipants($roomId: uuid!) {
        room_Participant_aggregate(where: { roomId: { _eq: $roomId } }) {
            aggregate {
                count
            }
        }
    }

    mutation InsertVonageSessionLayout($object: video_VonageSessionLayout_insert_input!) {
        insert_video_VonageSessionLayout_one(object: $object) {
            id
        }
    }
`;

export async function removeRoomParticipant(
    roomId: string,
    conferenceId: string,
    registrantId: string,
    vonageSessionId?: string
): Promise<void> {
    try {
        const removeResult = await apolloClient.mutate({
            mutation: RemoveRoomParticipantDocument,
            variables: {
                registrantId,
                conferenceId,
                roomId,
            },
        });

        if (
            !removeResult.data?.delete_room_Participant?.affected_rows ||
            removeResult.data.delete_room_Participant.affected_rows === 0
        ) {
            console.warn("Could not find participant to remove for room", { roomId, registrantId });
        } else if (vonageSessionId) {
            const response = await apolloClient.query({
                query: CountRoomParticipantsDocument,
                variables: {
                    roomId,
                },
            });
            if (response.data.room_Participant_aggregate.aggregate?.count === 0) {
                await apolloClient.mutate({
                    mutation: InsertVonageSessionLayoutDocument,
                    variables: {
                        object: {
                            conferenceId,
                            vonageSessionId,
                            layoutData: {
                                type: VonageSessionLayoutType.BestFit,
                                screenShareType: "verticalPresentation",
                            } as VonageSessionLayoutData,
                        },
                    },
                });
            }
        }
    } catch (err) {
        console.error("Failed to remove RoomParticipant record", { roomId, conferenceId, registrantId, err });
        throw new Error("Failed to remove RoomParticipant record");
    }
}

export async function getRoomParticipantDetails(
    roomId: string,
    registrantId: string
): Promise<RoomParticipantFragment[]> {
    gql`
        query GetRoomParticipantDetails($roomId: uuid!, $registrantId: uuid!) {
            room_Participant(where: { roomId: { _eq: $roomId }, registrantId: { _eq: $registrantId } }) {
                ...RoomParticipant
            }
        }

        fragment RoomParticipant on room_Participant {
            id
            room {
                id
                conferenceId
                publicVonageSessionId
                chimeMeeting {
                    id
                    chimeMeetingId
                }
            }
            vonageConnectionId
            chimeRegistrantId
        }
    `;

    const result = await apolloClient.query({
        query: GetRoomParticipantDetailsDocument,
        variables: {
            registrantId,
            roomId,
        },
    });

    return result.data.room_Participant;
}

export async function deleteRoomParticipantsCreatedBefore(date: Date): Promise<number> {
    gql`
        mutation DeleteRoomParticipantsCreatedBefore($before: timestamptz!) {
            delete_room_Participant(where: { createdAt: { _lte: $before } }) {
                affected_rows
            }
        }
    `;

    const result = await apolloClient.mutate({
        mutation: DeleteRoomParticipantsCreatedBeforeDocument,
        variables: {
            before: date.toISOString(),
        },
    });

    return result.data?.delete_room_Participant?.affected_rows ?? 0;
}
