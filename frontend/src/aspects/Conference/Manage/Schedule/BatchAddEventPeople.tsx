import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Select,
    Text,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import type { EventInfoFragment, RoomInfoFragment } from "../../../../generated/graphql";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { FAIcon } from "../../../Icons/FAIcon";

function AddEventPeople_FromContentPanel({ events, isExpanded }: { events: EventInfoFragment[]; isExpanded: boolean }) {
    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Copy from associated content
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>TODO</AccordionPanel>
        </>
    );
}

function AddEventPeople_FromGroupPanel({ events, isExpanded }: { events: EventInfoFragment[]; isExpanded: boolean }) {
    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Copy from a registration group
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>TODO</AccordionPanel>
        </>
    );
}

function AddEventPeople_SingleRegistrantPanel({
    events,
    isExpanded,
}: {
    events: EventInfoFragment[];
    isExpanded: boolean;
}) {
    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Add a single registrant
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>TODO</AccordionPanel>
        </>
    );
}

export default function BatchAddEventPeople({
    isOpen,
    onClose,
    events,
    rooms,
}: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    events: EventInfoFragment[];
    rooms: readonly RoomInfoFragment[];
}): JSX.Element {
    const roomOptions = useMemo(
        () =>
            rooms.map((room) => (
                <option key={room.id} value={room.id}>
                    {room.name}
                </option>
            )),
        [rooms]
    );

    const [startsAfter, setStartsAfter] = useState<Date | undefined>();
    const [endsBefore, setEndsBefore] = useState<Date | undefined>();
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");

    const [refilterEvents, setRefilterEvents] = useState<boolean>(false);

    const [filteredEvents, setFilteredEvents] = useState<EventInfoFragment[]>(events);
    useEffect(() => {
        if (refilterEvents) {
            setRefilterEvents(false);
            const startsAfterTime = startsAfter?.getTime();
            const endsBeforeTime = endsBefore?.getTime();
            const filteredByRoom =
                selectedRoomId === "" ? events : events.filter((event) => event.roomId === selectedRoomId);
            const filteredByTime =
                startsAfterTime || endsBeforeTime
                    ? filteredByRoom.filter(
                          (event) =>
                              (!startsAfterTime || Date.parse(event.startTime) >= startsAfterTime) &&
                              (!endsBeforeTime ||
                                  Date.parse(event.startTime) + event.durationSeconds * 1000 <= endsBeforeTime)
                      )
                    : filteredByRoom;
            setFilteredEvents(
                R.sortWith(
                    [
                        (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
                        (a, b) =>
                            Date.parse(a.startTime) +
                            a.durationSeconds * 1000 -
                            (Date.parse(b.startTime) + b.durationSeconds * 1000),
                    ],
                    filteredByTime
                )
            );
        }
    }, [endsBefore, events, refilterEvents, selectedRoomId, startsAfter]);
    const firstEvent = useMemo(() => (filteredEvents.length > 0 ? filteredEvents[0] : undefined), [filteredEvents]);
    const lastEvent = useMemo(
        () => (filteredEvents.length > 1 ? filteredEvents[filteredEvents.length - 1] : undefined),
        [filteredEvents]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Add people to events
                    <ModalCloseButton />
                </ModalHeader>
                <ModalBody>
                    <VStack spacing={4} justifyContent="flex-start" alignItems="flex-start">
                        <Text fontStyle="italic">Use the controls below to filter to particular events.</Text>
                        <FormControl>
                            <FormLabel>Starts after</FormLabel>
                            <HStack>
                                <DateTimePicker
                                    value={startsAfter}
                                    onChange={setStartsAfter}
                                    onBlur={() => setRefilterEvents(true)}
                                />
                                <Button
                                    aria-label="Clear filter"
                                    size="sm"
                                    isDisabled={!startsAfter}
                                    onClick={() => setStartsAfter(undefined)}
                                >
                                    <FAIcon iconStyle="s" icon="times" />
                                </Button>
                            </HStack>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Ends before</FormLabel>
                            <HStack>
                                <DateTimePicker
                                    value={endsBefore}
                                    onChange={setEndsBefore}
                                    onBlur={() => setRefilterEvents(true)}
                                />
                                <Button
                                    aria-label="Clear filter"
                                    size="sm"
                                    isDisabled={!endsBefore}
                                    onClick={() => setEndsBefore(undefined)}
                                >
                                    <FAIcon iconStyle="s" icon="times" />
                                </Button>
                            </HStack>
                        </FormControl>
                        <FormControl>
                            <FormLabel>In room</FormLabel>
                            <Select
                                value={selectedRoomId}
                                onChange={(ev) => setSelectedRoomId(ev.target.value)}
                                onBlur={() => setRefilterEvents(true)}
                            >
                                <option value="">&lt;No filter&gt;</option>
                                {roomOptions}
                            </Select>
                        </FormControl>
                        <Text fontStyle="italic">Sample of events in your filtered selection.</Text>
                        {firstEvent || lastEvent ? (
                            <List>
                                {firstEvent ? (
                                    <ListItem>
                                        First: {new Date(firstEvent.startTime).toLocaleString()} - {firstEvent.name}
                                    </ListItem>
                                ) : undefined}
                                {lastEvent ? (
                                    <ListItem>
                                        Last: {new Date(lastEvent.startTime).toLocaleString()} - {lastEvent.name}
                                    </ListItem>
                                ) : undefined}
                            </List>
                        ) : (
                            <Text>No events in filtered selection.</Text>
                        )}
                        <Text fontStyle="italic">Select the bulk operation you would like to perform.</Text>
                        <Accordion w="100%">
                            <AccordionItem>
                                {({ isExpanded }) => (
                                    <AddEventPeople_FromContentPanel events={filteredEvents} isExpanded={isExpanded} />
                                )}
                            </AccordionItem>
                            <AccordionItem>
                                {({ isExpanded }) => (
                                    <AddEventPeople_FromGroupPanel events={filteredEvents} isExpanded={isExpanded} />
                                )}
                            </AccordionItem>
                            <AccordionItem>
                                {({ isExpanded }) => (
                                    <AddEventPeople_SingleRegistrantPanel
                                        events={filteredEvents}
                                        isExpanded={isExpanded}
                                    />
                                )}
                            </AccordionItem>
                        </Accordion>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
