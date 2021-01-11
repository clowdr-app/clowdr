import { gql } from "@apollo/client";
import {
    Badge,
    Button,
    HStack,
    List,
    ListItem,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Portal,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { RoomDetailsFragment, RoomPersonRole_Enum, RoomPrivacy_Enum } from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import useRoomMembers from "../../../Room/useRoomMembers";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { AddRoomPersonModal } from "./AddRoomPersonModal";

export function RoomControlBar({
    roomDetails,
    onSetBackstage,
    backstage,
}: {
    roomDetails: RoomDetailsFragment;
    onSetBackstage: (backstage: boolean) => void;
    backstage: boolean;
}): JSX.Element {
    const user = useCurrentUser();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const roomMembers = useRoomMembers();
    const roomParticipants = useRoomParticipants();

    const roomMembersList = useMemo(
        () => (
            <List>
                {roomMembers ? (
                    roomMembers.roomPeople.map((person) => (
                        <ListItem key={person.id}>
                            <FAIcon
                                icon={
                                    roomParticipants &&
                                    roomParticipants.find(
                                        (participant) => person.attendee.id === participant.attendeeId
                                    )
                                        ? "video"
                                        : "user"
                                }
                                iconStyle="s"
                                mr={5}
                            />
                            {person.attendee.displayName}
                        </ListItem>
                    ))
                ) : (
                    <></>
                )}
            </List>
        ),
        [roomMembers, roomParticipants]
    );

    const roomParticipantsList = useMemo(
        () => (
            <List>
                {roomParticipants ? (
                    roomParticipants.map((participant) => (
                        <ListItem key={participant.id}>
                            <FAIcon icon="video" iconStyle="s" mr={5} />
                            {participant.attendee.displayName}
                        </ListItem>
                    ))
                ) : (
                    <></>
                )}
            </List>
        ),
        [roomParticipants]
    );

    return (
        <HStack justifyContent="flex-end" m={4}>
            {backstage ? (
                <Button colorScheme="red" onClick={() => onSetBackstage(false)}>
                    Exit backstage
                </Button>
            ) : (
                <Button colorScheme="green" onClick={() => onSetBackstage(true)}>
                    Go backstage
                </Button>
            )}
            {roomDetails.roomPeople.find(
                (person) =>
                    user.user.attendees.find((myAttendee) => myAttendee.id === person.attendee.id) &&
                    person.roomPersonRoleName === RoomPersonRole_Enum.Admin
            ) ? (
                <Button colorScheme="green" aria-label="Add people to room" title="Add people to room" onClick={onOpen}>
                    <FAIcon icon="plus" iconStyle="s" mr={3} />
                    Add people
                </Button>
            ) : (
                <></>
            )}
            {roomDetails.roomPrivacyName === RoomPrivacy_Enum.Public ? (
                <Popover>
                    <PopoverTrigger>
                        <Button aria-label="Current room participants" title="Current room participants">
                            <FAIcon icon="users" iconStyle="s" />
                            <Badge ml={2}>{roomParticipants ? roomParticipants.length : "0"} </Badge>
                        </Button>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverHeader>Breakout Participants</PopoverHeader>
                            <PopoverCloseButton />
                            <PopoverBody>{roomParticipantsList}</PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
            ) : (
                <Popover>
                    <PopoverTrigger>
                        <Button aria-label="Members of this room" title="Members of this room">
                            <FAIcon icon="users" iconStyle="s" />
                            <Badge ml={2}>{roomMembers ? roomMembers.roomPeople.length : "0"} </Badge>
                        </Button>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverHeader>Room Members</PopoverHeader>
                            <PopoverCloseButton />
                            <PopoverBody>{roomMembersList}</PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
            )}
            <AddRoomPersonModal roomId={roomDetails.id} isOpen={isOpen} onClose={onClose} />
        </HStack>
    );
}

gql`
    mutation AddParticipantToRoom($attendeeId: uuid!, $roomId: uuid!) {
        insert_RoomPerson_one(object: { attendeeId: $attendeeId, roomId: $roomId, roomPersonRoleName: PARTICIPANT }) {
            id
        }
    }
`;
