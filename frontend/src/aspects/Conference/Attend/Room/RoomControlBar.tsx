import { gql } from "@apollo/client";
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
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { RoomPage_RoomDetailsFragment, RoomPersonRole_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import RoomMembersProvider from "../../../Room/RoomMembersProvider";
import useRoomMembers from "../../../Room/useRoomMembers";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { maybeCompare } from "../../../Utils/maybeSort";
import { useConference } from "../../useConference";
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
        insert_room_RoomPerson_one(
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
    const roomMembers = useRoomMembers();
    const conference = useConference();
    const addMemberModal = useDisclosure();
    const user = useCurrentUser();

    const roomMembersList = useMemo(
        () => (
            <List mb={2} spacing={2} maxH="40vh" overflowY="auto">
                {roomMembers ? (
                    roomMembers
                        .sort((x, y) =>
                            maybeCompare(x.registrant, y.registrant, (a, b) =>
                                a.displayName.localeCompare(b.displayName)
                            )
                        )
                        .map((person) => (
                            <ListItem key={person.member.id} whiteSpace="normal">
                                <LinkButton
                                    justifyContent="flex-start"
                                    to={`/conference/${conference.slug}/profile/view/${person.registrant?.id}`}
                                    size="sm"
                                    linkProps={{ width: "100%" }}
                                    w="100%"
                                >
                                    <>
                                        <FAIcon icon="user" iconStyle="s" mr={5} />
                                        <Text>{person.registrant?.displayName ?? "<Loading name>"}</Text>
                                    </>
                                </LinkButton>
                            </ListItem>
                        ))
                ) : (
                    <></>
                )}
            </List>
        ),
        [conference.slug, roomMembers]
    );

    return (
        <>
            <AddRoomPersonModal
                roomId={roomDetails.id}
                isOpen={addMemberModal.isOpen}
                onClose={addMemberModal.onClose}
            />
            {roomMembersList}
            {roomDetails.roomPeople.find(
                (person) =>
                    user.user.registrants.find((myRegistrant) => myRegistrant.id === person.registrantId) &&
                    person.personRoleName === RoomPersonRole_Enum.Admin
            ) ? (
                <Box textAlign="right" mb={2}>
                    <Button
                        mt={2}
                        size="sm"
                        colorScheme="green"
                        aria-label="Add people to room"
                        title="Add people to room"
                        onClick={addMemberModal.onOpen}
                    >
                        <FAIcon icon="plus" iconStyle="s" mr={3} />
                        Add people
                    </Button>
                </Box>
            ) : (
                <></>
            )}
        </>
    );
}
