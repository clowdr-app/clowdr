import { gql } from "@apollo/client";
import { Box, Button, Divider, Heading, Text, useColorModeValue, useToken } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    EventPersonDetailsFragment,
    RoomBackstage_EventFragment,
    RoomMode_Enum,
    RoomPage_RoomDetailsFragment,
    RoomPage_RoomEventSummaryFragment,
    useRoomBackstage_GetEventsQuery,
} from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { EventVonageRoom } from "./Event/EventVonageRoom";
import { HandUpButton } from "./HandUpButton";

function isEventNow(event: RoomPage_RoomEventSummaryFragment): boolean {
    const now = new Date().getTime();
    const startTime = Date.parse(event.startTime);
    const endTime = Date.parse(event.endTime);

    return now >= startTime && now <= endTime;
}

function isEventSoon(event: RoomPage_RoomEventSummaryFragment): boolean {
    const now = new Date().getTime();
    const startTime = Date.parse(event.startTime);

    return now >= startTime - 15 * 60 * 1000 && now <= startTime;
}

gql`
    query RoomBackstage_GetEvents($eventIds: [uuid!]!) {
        Event(where: { id: { _in: $eventIds } }) {
            ...RoomBackstage_Event
        }
    }

    fragment RoomBackstage_Event on Event {
        id
        contentGroup {
            id
            title
        }
    }
`;

export function RoomBackstage({
    backstage,
    roomDetails,
    eventPeople,
}: {
    backstage: boolean;
    roomDetails: RoomPage_RoomDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
    const user = useCurrentUser();
    const [gray100, gray900] = useToken("colors", ["gray.100", "gray.900"]);
    const backgroundColour = useColorModeValue(gray100, gray900);

    const { refetch } = useRoomBackstage_GetEventsQuery({ skip: true });
    const [eventsData, setEventsData] = useState<readonly RoomBackstage_EventFragment[]>([]);

    // Lazy-render the backstage
    const [loaded, setLoaded] = useState<boolean>(false);
    useEffect(() => {
        async function fn() {
            if (backstage && !loaded) {
                setLoaded(true);
                try {
                    const result = await refetch({
                        eventIds: roomDetails.events.map((event) => event.id),
                    });
                    setEventsData(result.data.Event);
                } catch (e) {
                    console.error("Failed to fetch event data for backstage");
                }
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backstage, loaded]);

    const myEventPeople = useMemo(
        () =>
            eventPeople.filter((eventPerson) =>
                user.user.attendees.find((attendee) => attendee.id && attendee.id === eventPerson.attendeeId)
            ) ?? [],
        [eventPeople, user.user.attendees]
    );

    const [sortedEvents, setSortedEvents] = useState<readonly RoomPage_RoomEventSummaryFragment[]>([]);
    const computeSortedEvents = useCallback(() => {
        setSortedEvents(
            R.sortWith(
                [R.ascend(R.prop("startTime"))],
                roomDetails.events.filter((event) =>
                    [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
                )
            )
        );
    }, [roomDetails.events]);
    usePolling(computeSortedEvents, 10000, true);
    useEffect(() => {
        computeSortedEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [now, setNow] = useState<Date>(new Date());
    const updateNow = useCallback(() => {
        setNow(new Date());
    }, []);
    usePolling(updateNow, 20000, true);

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const makeEventEl = useCallback(
        (event: RoomPage_RoomEventSummaryFragment) => {
            const haveAccessToEvent = !!myEventPeople.find((eventPerson) => user && eventPerson.eventId === event.id);
            const eventData = eventsData.find((x) => x.id === event.id);
            return (
                <Box key={event.id}>
                    <Heading as="h4" size="md" textAlign="left" mt={5} mb={1}>
                        {eventData?.contentGroup ? `${eventData.contentGroup.title} (${event.name})` : event.name}
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
                        <Box mt={2}>
                            <EventVonageRoom eventId={event.id} />
                        </Box>
                    ) : (
                        <></>
                    )}
                    <Divider my={4} />
                </Box>
            );
        },
        [eventPeople, eventsData, myEventPeople, now, selectedEventId, user]
    );

    const [eventsNow, setEventsNow] = useState<readonly RoomPage_RoomEventSummaryFragment[]>([]);
    const [eventsSoon, setEventsSoon] = useState<readonly RoomPage_RoomEventSummaryFragment[]>([]);
    const [eventsOther, setEventsOther] = useState<readonly RoomPage_RoomEventSummaryFragment[]>([]);
    const updateEventGroups = useCallback(() => {
        setEventsNow(sortedEvents.filter(isEventNow));
        setEventsSoon(sortedEvents.filter(isEventSoon));
        setEventsOther(sortedEvents.filter((event) => !isEventNow(event) && !isEventSoon(event)));
    }, [sortedEvents]);

    usePolling(updateEventGroups, 5000, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(updateEventGroups, []);

    const eventRooms = useMemo(
        () =>
            !loaded ? (
                <></>
            ) : (
                <>
                    {eventsNow.length > 0 ? (
                        <Heading as="h4" size="lg" mt={5} textAlign="left">
                            Events happening now
                        </Heading>
                    ) : undefined}
                    {eventsNow.map((x) => (
                        <Box key={x.id}>{makeEventEl(x)}</Box>
                    ))}
                    {eventsSoon.length > 0 ? (
                        <Heading as="h4" size="lg" mt={5} textAlign="left">
                            Events happening soon
                        </Heading>
                    ) : undefined}
                    {eventsSoon.map((x) => (
                        <Box key={x.id}>{makeEventEl(x)}</Box>
                    ))}
                    {eventsOther.length > 0 ? (
                        <Heading as="h4" size="lg" mt={5} textAlign="left">
                            Other events in this room
                        </Heading>
                    ) : undefined}
                    {eventsOther.map((x) => (
                        <Box key={x.id}>{makeEventEl(x)}</Box>
                    ))}
                    {eventsNow.length === 0 && eventsSoon.length === 0 && eventsOther.length === 0 ? (
                        <>No events in this room</>
                    ) : undefined}
                </>
            ),
        [eventsNow, eventsOther, eventsSoon, loaded, makeEventEl]
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
