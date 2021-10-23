import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import { useAddParticipantToRoomMutation } from "../../../../generated/graphql";
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
            await addParticipantToRoomMutation({
                registrantId,
                roomId,
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
