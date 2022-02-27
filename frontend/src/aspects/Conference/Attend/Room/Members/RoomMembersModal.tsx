import { DeleteIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    ButtonGroup,
    Heading,
    HStack,
    IconButton,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Tag,
    Text,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useCallback, useContext, useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import {
    Room_ManagementMode_Enum,
    Room_PersonRole_Enum,
    useRemoveRegistrantFromRoomMutation,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { useRegistrants } from "../../../RegistrantsContext";
import { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import { AddRoomPersonModal } from "./AddRoomPersonModal";
import { RoomMembersContext, RoomMembersProvider } from "./RoomMembersContext";

export function RoomMembersModal({
    isOpen,
    onClose,
    roomDetails,
}: {
    isOpen: boolean;
    onClose: () => void;
    roomDetails: RoomPage_RoomDetailsFragment;
}): JSX.Element {
    return (
        <Modal scrollBehavior="inside" isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Room details <ModalCloseButton />
                </ModalHeader>
                <ModalBody>
                    <RoomMembersProvider roomId={roomDetails.id}>
                        <RoomMembersModalInner roomDetails={roomDetails} />
                    </RoomMembersProvider>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

gql`
    mutation RemoveRegistrantFromRoom($registrantId: uuid!, $roomId: uuid!) {
        delete_room_RoomMembership(where: { registrantId: { _eq: $registrantId }, roomId: { _eq: $roomId } }) {
            affected_rows
        }
    }
`;

function RoomMembersModalInner({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const { roomMembers, loading, canAddMembersAs } = useContext(RoomMembersContext);
    const { conferencePath } = useAuthParameters();
    const mRegistrant = useMaybeCurrentRegistrant();
    const addMemberModal = useDisclosure();
    const toast = useToast();

    const memberRegistrantIds = useMemo(
        () => (roomMembers ? roomMembers.map((x) => ({ registrant: x.registrantId as string })) : []),
        [roomMembers]
    );
    const registrants = useRegistrants(memberRegistrantIds);
    const sortedRegistrants = useMemo(
        () =>
            R.sortWith(
                [
                    R.descend((x) =>
                        Boolean(
                            roomMembers?.some(
                                (m) => m.registrantId === x.id && m.personRoleName === Room_PersonRole_Enum.Admin
                            )
                        )
                    ),
                    R.ascend((x) => x.displayName),
                ],
                registrants
            ),
        [registrants, roomMembers]
    );

    const removeRegistrantsContext = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: canAddMembersAs,
                [AuthHeader.RoomId]: roomDetails.id,
            }),
        [canAddMembersAs, roomDetails.id]
    );
    const [, removeRegistrant] = useRemoveRegistrantFromRoomMutation();

    const deleteMember = useCallback(
        async (registrantId: string) => {
            const result = await removeRegistrant(
                {
                    registrantId,
                    roomId: roomDetails.id,
                },
                { ...removeRegistrantsContext, additionalTypenames: ["room_RoomMembership"] }
            );
            if (result.error || result.data?.delete_room_RoomMembership?.affected_rows === 0) {
                toast({
                    status: "error",
                    title: "Failed to remove member from room",
                });
            }
        },
        [removeRegistrant, removeRegistrantsContext, roomDetails.id, toast]
    );

    const canControlMembers = useMemo(
        () =>
            canAddMembersAs &&
            [Room_ManagementMode_Enum.Private, Room_ManagementMode_Enum.Public].includes(
                roomDetails.managementModeName
            ),
        [canAddMembersAs, roomDetails.managementModeName]
    );

    const roomMembersList = useMemo(
        () => (
            <section>
                <Heading as="header" size="sm" textAlign="left">
                    {roomDetails.managementModeName === Room_ManagementMode_Enum.Public ? "Admins" : "Members"}
                </Heading>
                <List my={2} spacing={2} maxH="40vh" overflowY="auto">
                    {sortedRegistrants.length ? (
                        sortedRegistrants.map((registrant) => (
                            <ListItem key={registrant.id} whiteSpace="normal">
                                <ButtonGroup as={HStack} isAttached={true} w="100%">
                                    <LinkButton
                                        justifyContent="flex-start"
                                        to={`${conferencePath}/profile/view/${registrant.id}`}
                                        size="sm"
                                        linkProps={{ width: "100%" }}
                                        w="100%"
                                        leftIcon={<FAIcon icon="user" iconStyle="s" mr={5} />}
                                        flexGrow={1}
                                    >
                                        <Text>{registrant.displayName}</Text>
                                        {roomMembers?.find(
                                            (r) =>
                                                r.registrantId === registrant.id &&
                                                r.personRoleName === Room_PersonRole_Enum.Admin
                                        ) ? (
                                            <Tag ml={2} colorScheme="SecondaryActionButton" size="sm">
                                                Admin
                                            </Tag>
                                        ) : undefined}
                                    </LinkButton>
                                    {canControlMembers ? (
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            aria-label="Delete member"
                                            onClick={() => deleteMember(registrant.id)}
                                            isDisabled={registrant.id === mRegistrant?.id}
                                            size="sm"
                                            colorScheme="DestructiveActionButton"
                                        />
                                    ) : undefined}
                                </ButtonGroup>
                            </ListItem>
                        ))
                    ) : (
                        <ListItem>
                            No{" "}
                            {roomDetails.managementModeName === Room_ManagementMode_Enum.Public ? "admins" : "members"}{" "}
                            have been added to this room.
                        </ListItem>
                    )}
                </List>
            </section>
        ),
        [
            canControlMembers,
            conferencePath,
            deleteMember,
            mRegistrant?.id,
            roomDetails.managementModeName,
            roomMembers,
            sortedRegistrants,
        ]
    );

    return (loading || sortedRegistrants.length !== roomMembers?.length) ?? 0 ? (
        <Spinner label="Loading members" size="sm" />
    ) : (
        <>
            {roomMembersList}
            {canControlMembers ? (
                <>
                    <AddRoomPersonModal
                        roomId={roomDetails.id}
                        managementModeName={roomDetails.managementModeName}
                        isOpen={addMemberModal.isOpen}
                        onClose={addMemberModal.onClose}
                    />
                    <Box textAlign="right" mb={2}>
                        <Button
                            mt={2}
                            size="sm"
                            colorScheme="PrimaryActionButton"
                            aria-label="Add people to room"
                            title="Add people to room"
                            onClick={addMemberModal.onOpen}
                        >
                            <FAIcon icon="plus" iconStyle="s" mr={3} />
                            Add people
                        </Button>
                    </Box>
                </>
            ) : undefined}
        </>
    );
}
