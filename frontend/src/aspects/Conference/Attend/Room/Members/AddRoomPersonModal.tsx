import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    useToast,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import {
    Room_ManagementMode_Enum,
    Room_PersonRole_Enum,
    useAddRegistrantToRoomMutation,
} from "../../../../../generated/graphql";
import { makeContext } from "../../../../GQL/make-context";
import { RegistrantSearch } from "./RegistrantSearch";
import { RoomMembersContext } from "./RoomMembersContext";

gql`
    mutation AddRegistrantToRoom($registrantId: uuid!, $roomId: uuid!, $role: room_PersonRole_enum!) {
        insert_room_RoomMembership_one(
            object: { registrantId: $registrantId, roomId: $roomId, personRoleName: $role }
        ) {
            id
        }
    }
`;

export function AddRoomPersonModal({
    roomId,
    managementModeName,
    isOpen,
    onClose,
}: {
    roomId: string;
    managementModeName: Room_ManagementMode_Enum;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const [, addRegistrant] = useAddRegistrantToRoomMutation();
    const { roomMembers } = useContext(RoomMembersContext);
    const toast = useToast();

    const existingRegistrantIds = useMemo(
        () =>
            roomMembers
                ? roomMembers.filter((person) => Boolean(person.registrantId)).map((person) => person.registrantId)
                : [],
        [roomMembers]
    );

    const [registrantIdToAdd, setRegistrantIdToAdd] = useState<string | null>();

    const startAddMember = useCallback(async (registrantId: string) => {
        setRegistrantIdToAdd(registrantId);
    }, []);

    const addMember = useCallback(
        async (registrantId: string, role: Room_PersonRole_Enum) => {
            const result = await addRegistrant(
                {
                    registrantId,
                    roomId,
                    role,
                },
                {
                    ...makeContext({
                        [AuthHeader.RoomId]: roomId,
                        [AuthHeader.Role]: "room-admin",
                    }),
                    additionalTypenames: ["room_RoomMembership"],
                }
            );
            if (result.error) {
                toast({
                    title: "Failed to add member",
                    status: "error",
                });
            } else {
                setRegistrantIdToAdd(null);
            }
        },
        [addRegistrant, roomId, toast]
    );

    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <Modal scrollBehavior="outside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader pb={0}>Add person to room</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <RegistrantSearch excludeRegistrantIds={existingRegistrantIds} onSelect={startAddMember} />
                    </ModalBody>
                </ModalContent>
            </Modal>
            <AlertDialog
                isOpen={Boolean(registrantIdToAdd)}
                leastDestructiveRef={cancelRef}
                onClose={() => setRegistrantIdToAdd(null)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Add to room?
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setRegistrantIdToAdd(null)}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="SecondaryActionButton"
                                onClick={() => {
                                    if (registrantIdToAdd) {
                                        addMember(registrantIdToAdd, Room_PersonRole_Enum.Admin);
                                    }
                                }}
                                ml={3}
                            >
                                Add as admin
                            </Button>
                            {managementModeName === Room_ManagementMode_Enum.Private ? (
                                <Button
                                    colorScheme="PrimaryActionButton"
                                    onClick={() => {
                                        if (registrantIdToAdd) {
                                            addMember(registrantIdToAdd, Room_PersonRole_Enum.Participant);
                                        }
                                    }}
                                    ml={3}
                                >
                                    Add
                                </Button>
                            ) : undefined}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}
