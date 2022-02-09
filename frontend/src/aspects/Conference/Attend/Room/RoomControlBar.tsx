import {
    Box,
    Button,
    HStack,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import * as R from "ramda";
import React, { useMemo } from "react";
import { gql } from "urql";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";
import { Registrant_RegistrantRole_Enum, useRoomPage_IsAdminQuery } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";
import RoomMembersProvider from "../../../Room/RoomMembersProvider";
import useRoomMembers from "../../../Room/useRoomMembers";
import { useRegistrants } from "../../RegistrantsContext";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import { AddRoomPersonModal } from "./AddRoomPersonModal";

export function RoomControlBar({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const listModal = useDisclosure();

    return (
        <HStack justifyContent="flex-end">
            <Button aria-label="Members of this room" title="Members of this room" onClick={listModal.onOpen} size="sm">
                <>
                    <FAIcon icon="users" iconStyle="s" mr={3} />
                    <Text>Members</Text>
                </>
            </Button>
            <RoomMembersModal isOpen={listModal.isOpen} onClose={listModal.onClose} roomDetails={roomDetails} />
        </HStack>
    );
}

gql`
    mutation AddParticipantToRoom($registrantId: uuid!, $roomId: uuid!) {
        insert_room_RoomMembership_one(
            object: { registrantId: $registrantId, roomId: $roomId, personRoleName: PARTICIPANT }
        ) {
            id
        }
    }
`;

function RoomMembersModal({
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
                    Room members <ModalCloseButton />
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

function RoomMembersModalInner({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const registrant = useCurrentRegistrant();
    const roomMembers = useRoomMembers();
    const { conferencePath } = useAuthParameters();
    const addMemberModal = useDisclosure();

    const memberRegistrantIds = useMemo(
        () => (roomMembers ? roomMembers.map((x) => ({ registrant: x.registrantId as string })) : []),
        [roomMembers]
    );
    const registrants = useRegistrants(memberRegistrantIds);
    const sortedRegistrants = useMemo(() => R.sortBy((x) => x.displayName, registrants), [registrants]);

    const roomMembersList = useMemo(
        () => (
            <List mb={2} spacing={2} maxH="40vh" overflowY="auto">
                {sortedRegistrants.map((registrant) => (
                    <ListItem key={registrant.id} whiteSpace="normal">
                        <LinkButton
                            justifyContent="flex-start"
                            to={`${conferencePath}/profile/view/${registrant.id}`}
                            size="sm"
                            linkProps={{ width: "100%" }}
                            w="100%"
                        >
                            <FAIcon icon="user" iconStyle="s" mr={5} />
                            <Text>{registrant.displayName}</Text>
                        </LinkButton>
                    </ListItem>
                ))}
            </List>
        ),
        [conferencePath, sortedRegistrants]
    );
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.RoomMember,
                [AuthHeader.RoomId]: roomDetails.id,
            }),
        [roomDetails.id]
    );
    const [selfIsAdminResponse] = useRoomPage_IsAdminQuery({
        variables: {
            roomId: roomDetails.id,
            registrantId: registrant.id,
        },
        context,
    });

    return (
        <>
            {!roomMembers || sortedRegistrants.length !== roomMembers.length ? (
                <Spinner label="Loading members" size="sm" />
            ) : (
                roomMembersList
            )}
            {selfIsAdminResponse.data?.room_RoomMembership.length ||
            registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ? (
                <>
                    <AddRoomPersonModal
                        roomId={roomDetails.id}
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
            ) : (
                <></>
            )}
        </>
    );
}
