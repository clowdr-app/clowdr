import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import type {
    GetRoomMembersQuery,
    GetRoomMembersQueryVariables,
    RoomMemberFragment,
} from "../../../../generated/graphql";
import {
    GetRoomMembersDocument,
    RoomMemberFragmentDoc,
    Room_PersonRole_Enum,
    useAddParticipantToRoomMutation,
} from "../../../../generated/graphql";
import useRoomMembers from "../../../Room/useRoomMembers";
import { RegistrantSearch } from "./RegistrantSearch";

export function AddRoomPersonModal({
    roomId,
    isOpen,
    onClose,
}: {
    roomId: string;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const [addParticipantToRoomMutation] = useAddParticipantToRoomMutation();
    const members = useRoomMembers();

    const selectedRegistrantIds = useMemo(
        () => (members ? members.filter((person) => !!person.registrantId).map((person) => person.registrantId) : []),
        [members]
    );

    const addMember = useCallback(
        async (registrantId: string) => {
            await addParticipantToRoomMutation({
                variables: {
                    registrantId,
                    roomId,
                },
                update: (cache, result) => {
                    if (result.data?.insert_room_RoomMembership_one) {
                        const data: RoomMemberFragment = {
                            __typename: "room_RoomMembership",
                            id: result.data.insert_room_RoomMembership_one.id,
                            registrantId,
                            personRoleName: Room_PersonRole_Enum.Participant,
                            roomId,
                        };

                        cache.writeFragment<RoomMemberFragment>({
                            data,
                            fragment: RoomMemberFragmentDoc,
                            fragmentName: "RoomMember",
                            broadcast: true,
                        });

                        const query = cache.readQuery<GetRoomMembersQuery, GetRoomMembersQueryVariables>({
                            query: GetRoomMembersDocument,
                            variables: {
                                roomId,
                            },
                        });

                        if (query) {
                            cache.writeQuery<GetRoomMembersQuery, GetRoomMembersQueryVariables>({
                                query: GetRoomMembersDocument,
                                variables: {
                                    roomId,
                                },
                                broadcast: true,
                                data: {
                                    __typename: query.__typename,
                                    room_RoomMembership: [...query.room_RoomMembership, data],
                                },
                            });
                        }
                    }
                },
            });
        },
        [addParticipantToRoomMutation, roomId]
    );

    return (
        <Modal scrollBehavior="outside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={0}>Add person to room</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <RegistrantSearch selectedRegistrantIds={selectedRegistrantIds} onSelect={addMember} />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
