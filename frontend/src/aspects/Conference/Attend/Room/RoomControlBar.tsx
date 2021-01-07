import {
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
} from "@chakra-ui/react";
import React from "react";
import { RoomDetailsFragment, RoomPersonRole_Enum, RoomPrivacy_Enum } from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";

export function RoomControlBar({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const user = useCurrentUser();
    return (
        <HStack justifyContent="flex-end" m={4}>
            {roomDetails.roomPeople.find(
                (person) =>
                    user.user.attendees.find((myAttendee) => myAttendee.id === person.attendee.id) &&
                    person.roomPersonRoleName === RoomPersonRole_Enum.Admin
            ) ? (
                <Button colorScheme="green" ariaLabel="Add people to room" title="Add people to room">
                    <FAIcon icon="plus" iconStyle="s" />
                    Add people
                </Button>
            ) : (
                <></>
            )}
            {roomDetails.roomPrivacyName === RoomPrivacy_Enum.Private ? (
                <Popover>
                    <PopoverTrigger>
                        <Button ariaLabel="Members of this room" title="Members of this room">
                            <FAIcon icon="users" iconStyle="s" />
                        </Button>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverHeader>Room Members</PopoverHeader>
                            <PopoverCloseButton />
                            <PopoverBody>
                                <List>
                                    {roomDetails.roomPeople.map((person) => (
                                        <ListItem key={person.id}>
                                            <FAIcon icon="user" iconStyle="s" mr={5} />
                                            {person.attendee.displayName}
                                        </ListItem>
                                    ))}
                                </List>
                            </PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
            ) : (
                <></>
            )}
        </HStack>
    );
}
