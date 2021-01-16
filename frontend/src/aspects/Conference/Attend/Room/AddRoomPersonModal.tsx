import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import { useAddParticipantToRoomMutation } from "../../../../generated/graphql";
import useRoomMembers from "../../../Room/useRoomMembers";
import { AttendeeSearch } from "./AttendeeSearch";

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

    const selectedAttendeeIds = useMemo(
        () =>
            members
                ? [...members.roomPeople]
                      .sort((x, y) => x.attendee.displayName.localeCompare(y.attendee.displayName))
                      .map((person) => person.attendee.id)
                : [],
        [members]
    );

    const addMember = useCallback(
        async (attendeeId: string) => {
            await addParticipantToRoomMutation({
                variables: {
                    attendeeId,
                    roomId,
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
                    <AttendeeSearch selectedAttendeeIds={selectedAttendeeIds} onSelect={addMember} />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
