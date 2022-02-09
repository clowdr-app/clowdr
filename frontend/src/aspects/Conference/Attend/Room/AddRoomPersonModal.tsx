import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import React, { useCallback, useMemo } from "react";
import { useAddParticipantToRoomMutation } from "../../../../generated/graphql";
import { makeContext } from "../../../GQL/make-context";
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
    const [, addParticipantToRoomMutation] = useAddParticipantToRoomMutation();
    const members = useRoomMembers();

    const selectedRegistrantIds = useMemo(
        () => (members ? members.filter((person) => !!person.registrantId).map((person) => person.registrantId) : []),
        [members]
    );

    const addMember = useCallback(
        async (registrantId: string) => {
            await addParticipantToRoomMutation(
                {
                    registrantId,
                    roomId,
                },
                makeContext({
                    [AuthHeader.RoomId]: roomId,
                    [AuthHeader.Role]: "room-admin",
                })
            );
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
