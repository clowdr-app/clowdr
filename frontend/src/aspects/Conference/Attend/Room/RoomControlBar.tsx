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
    Spinner,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import RoomMembersProvider from "../../../Room/RoomMembersProvider";
import useRoomMembers from "../../../Room/useRoomMembers";
import { useRegistrants } from "../../RegistrantsContext";
import { useConference } from "../../useConference";
import { useConferenceCurrentUserActivePermissions } from "../../useConferenceCurrentUserActivePermissions";
import { AddRoomPersonModal } from "./AddRoomPersonModal";
import { FormattedMessage, useIntl } from "react-intl";

export function RoomControlBar({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const intl = useIntl();
    const listModal = useDisclosure();

    return (
        <HStack justifyContent="flex-end">
            <Button
                aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.RoomControlBar.MembersOfThisRoom', defaultMessage: "Members of this room" })}
                title={intl.formatMessage({ id: 'Conference.Attend.Room.RoomControlBar.MembersOfThisRoom', defaultMessage: "Members of this room" })}
                onClick={listModal.onOpen}
                size="sm"
            >
                <>
                    <FAIcon icon="users" iconStyle="s" mr={3} />
                    <Text>
                        <FormattedMessage
                            id="Conference.Attend.Room.RoomControlBar.Members"
                            defaultMessage="Members"
                        />
                    </Text>
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
    const intl = useIntl();
    return (
        <Modal scrollBehavior="inside" isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {intl.formatMessage({ id: 'Conference.Attend.Room.RoomControlBar.RoomMembers', defaultMessage: "Room members" }) + " "}<ModalCloseButton />
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
    const intl = useIntl();
    const roomMembers = useRoomMembers();
    const conference = useConference();
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
                            to={`/conference/${conference.slug}/profile/view/${registrant.id}`}
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
        [conference.slug, sortedRegistrants]
    );
    const activePermissions = useConferenceCurrentUserActivePermissions();

    return (
        <>
            <AddRoomPersonModal
                roomId={roomDetails.id}
                isOpen={addMemberModal.isOpen}
                onClose={addMemberModal.onClose}
            />
            {!roomMembers || sortedRegistrants.length !== roomMembers.length ? (
                <Spinner label="Loading members" size="sm" />
            ) : (
                roomMembersList
            )}
            {roomDetails.selfAdminPerson?.length ||
            activePermissions.has(Permissions_Permission_Enum.ConferenceManageSchedule) ? (
                <Box textAlign="right" mb={2}>
                    <Button
                        mt={2}
                        size="sm"
                        colorScheme="PrimaryActionButton"
                        aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.RoomControlBar.AddPeopleToRoom', defaultMessage: "Add people to room" })}
                        title={intl.formatMessage({ id: 'Conference.Attend.Room.RoomControlBar.AddPeopleToRoom', defaultMessage: "Add people to room" })}
                        onClick={addMemberModal.onOpen}
                    >
                        <FAIcon icon="plus" iconStyle="s" mr={3} />
                        <FormattedMessage
                            id="Conference.Attend.Room.RoomControlBar.AddPeople"
                            defaultMessage="Add people"
                        />
                    </Button>
                </Box>
            ) : (
                <></>
            )}
        </>
    );
}
