import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    InputRightElement,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useAddParticipantToRoomMutation, useSearchAttendeesQuery } from "../../../../generated/graphql";
import useDebouncedState from "../../../CRUDTable/useDebouncedState";
import { FAIcon } from "../../../Icons/FAIcon";
import useRoomMembers from "../../../Room/useRoomMembers";
import { useConference } from "../../useConference";

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
    const conference = useConference();
    const { refetch } = useSearchAttendeesQuery({ skip: true });
    const [search, searchDebounced, setSearch] = useDebouncedState<string>("");
    const [options, setOptions] = useState<{ label: string; value: string; inRoom: boolean }[]>([]);
    const members = useRoomMembers();

    const getSelectOptions = useCallback(
        async (searchTerm) => {
            if (searchTerm.length < 3) {
                return [];
            }
            const result = await refetch({
                conferenceId: conference.id,
                search: `%${searchTerm}%`,
            });
            return result.data.Attendee.filter((item) => !!item.userId).map((item) => ({
                value: item.id,
                label: item.displayName,
                inRoom: !!members && !!members.roomPeople.find((person) => person.attendee.id === item.id),
            }));
        },
        [conference.id, members, refetch]
    );

    useEffect(() => {
        async function fn() {
            const newOptions = await getSelectOptions(searchDebounced);
            setOptions(newOptions);
        }

        fn();
    }, [getSelectOptions, searchDebounced]);

    const addMember = useCallback(
        async (attendeeId) => {
            await addParticipantToRoomMutation({
                variables: {
                    attendeeId,
                    roomId,
                },
            });
        },
        [addParticipantToRoomMutation, roomId]
    );

    const ariaSearchResultStr = `${options.length} people`;

    return (
        <Modal scrollBehavior="outside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={0}>Add person to room</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>
                        <FormLabel htmlFor="attendee_id">Attendee</FormLabel>
                        <Input
                            aria-label={"Search found " + ariaSearchResultStr}
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={(ev) => {
                                setSearch(ev.target.value);
                            }}
                        />
                        <InputRightElement>
                            <FAIcon iconStyle="s" icon="search" />
                        </InputRightElement>
                        <FormHelperText>Search for an attendee by name</FormHelperText>
                    </FormControl>
                    <List>
                        {options.map((option) => (
                            <ListItem key={option.value} my={2}>
                                <Button
                                    onClick={async () => await addMember(option.value)}
                                    aria-label={
                                        option.inRoom
                                            ? `${option.label} already in room`
                                            : `Add ${option.label} to room`
                                    }
                                    p={0}
                                    mr={3}
                                    size="sm"
                                    colorScheme="green"
                                    isDisabled={option.inRoom}
                                >
                                    <FAIcon icon={option.inRoom ? "check-circle" : "plus-circle"} iconStyle="s" />
                                </Button>
                                {option.label}
                            </ListItem>
                        ))}
                    </List>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
