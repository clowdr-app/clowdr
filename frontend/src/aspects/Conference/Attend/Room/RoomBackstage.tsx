import { Badge, Box, Button, Divider, Heading, Text, useColorModeValue, useToken } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    EventPersonDetailsFragment,
    RoomDetailsFragment,
    RoomEventSummaryFragment,
    RoomMode_Enum,
} from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { EventVonageRoom } from "./Event/EventVonageRoom";
import { HandUpButton } from "./HandUpButton";

function isEventNow(event: RoomEventSummaryFragment): boolean {
    const now = new Date().getTime();
    const startTime = Date.parse(event.startTime);
    const endTime = Date.parse(event.endTime);

    return now >= startTime && now <= endTime;
}

function isEventSoon(event: RoomEventSummaryFragment): boolean {
    const now = new Date().getTime();
    const startTime = Date.parse(event.startTime);

    return now >= startTime - 3 * 60 * 1000 && now <= startTime;
}

export function RoomBackstage({
    backstage,
    roomDetails,
    eventPeople,
}: {
    backstage: boolean;
    roomDetails: RoomDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
    const user = useCurrentUser();
    const [gray100, gray900] = useToken("colors", ["gray.100", "gray.900"]);
    const backgroundColour = useColorModeValue(gray100, gray900);

    // Lazy-render the backstage
    const [loaded, setLoaded] = useState<boolean>(false);
    useEffect(() => {
        if (backstage && !loaded) {
            setLoaded(true);
        }
    }, [backstage, loaded]);

    const myEventPeople = useMemo(
        () =>
            eventPeople.filter((eventPerson) =>
                user.user.attendees.find((attendee) => attendee.id && attendee.id === eventPerson.attendee?.id)
            ) ?? [],
        [eventPeople, user.user.attendees]
    );

    const [sortedEvents, setSortedEvents] = useState<readonly RoomEventSummaryFragment[]>([]);
    const computeSortedEvents = useCallback(() => {
        setSortedEvents(
            R.sortWith(
                [R.descend(isEventNow), R.descend(isEventSoon), R.ascend(R.prop("startTime"))],
                roomDetails.events
            )
        );
    }, [roomDetails.events]);
    usePolling(computeSortedEvents, 10000, true);
    useEffect(() => {
        computeSortedEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [eventTemporalBadges, setEventTemporalBadges] = useState<{
        [eventId: string]: JSX.Element;
    }>({});

    const updateEventTemporalBadges = useCallback(() => {
        setEventTemporalBadges(
            R.fromPairs(
                sortedEvents
                    .filter((event) =>
                        [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
                    )
                    .map((event) => {
                        if (isEventNow(event)) {
                            return [
                                event.id,
                                <Badge key={`badge-${event.id}`} colorScheme="green">
                                    Now
                                </Badge>,
                            ];
                        }

                        if (isEventSoon(event)) {
                            return [
                                event.id,
                                <Badge key={`badge-${event.id}`} colorScheme="blue">
                                    Soon
                                </Badge>,
                            ];
                        }

                        return [event.id, <></>];
                    })
            )
        );
    }, [sortedEvents]);

    usePolling(() => updateEventTemporalBadges(), 5000, true);
    useEffect(() => updateEventTemporalBadges(), [updateEventTemporalBadges]);

    const [now, setNow] = useState<Date>(new Date());
    usePolling(() => setNow(new Date()), 20000, true);

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const eventRooms = useMemo(
        () =>
            !loaded ? (
                <></>
            ) : (
                sortedEvents
                    .filter((event) =>
                        [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
                    )
                    .map((event) => {
                        const haveAccessToEvent = !!myEventPeople.find(
                            (eventPerson) => user && eventPerson.eventId === event.id
                        );
                        return (
                            <Box key={event.id}>
                                <Heading as="h4" size="md" textAlign="left" mt={5} mb={1}>
                                    {event.name} {eventTemporalBadges[event.id]}
                                </Heading>

                                <Text my={2} fontStyle="italic">
                                    {formatRelative(Date.parse(event.startTime), now)}
                                </Text>

                                {haveAccessToEvent ? (
                                    selectedEventId !== event.id ? (
                                        <Button colorScheme="green" onClick={() => setSelectedEventId(event.id)}>
                                            Open backstage room
                                        </Button>
                                    ) : (
                                        <></>
                                    )
                                ) : (
                                    <>
                                        <Text>You do not have access to the backstage for this event.</Text>
                                        <HandUpButton currentRoomEvent={event} eventPeople={eventPeople} />
                                    </>
                                )}
                                {selectedEventId === event.id ? (
                                    <Box display={haveAccessToEvent ? "block" : "none"} mt={2}>
                                        <EventVonageRoom eventId={event.id} />
                                    </Box>
                                ) : (
                                    <></>
                                )}
                                <Divider my={4} />
                            </Box>
                        );
                    })
            ),
        [eventPeople, eventTemporalBadges, loaded, myEventPeople, now, selectedEventId, sortedEvents, user]
    );

    return backstage ? (
        <Box display={backstage ? "block" : "none"} background={backgroundColour} p={5}>
            <Heading as="h3" size="lg">
                Backstage
            </Heading>
            {eventRooms}
        </Box>
    ) : (
        <></>
    );
}
