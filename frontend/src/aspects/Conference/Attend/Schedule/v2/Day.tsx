import { gql, QueryHookOptions } from "@apollo/client";
import { Box, Skeleton, Td, Th, Tr, useColorModeValue } from "@chakra-ui/react";
import IntersectionObserver from "@researchgate/react-intersection-observer";
import * as luxon from "luxon";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScheduleV2_DayEventsQuery,
    ScheduleV2_DayEventsQueryVariables,
    ScheduleV2_DayLightweightEventsQuery,
    ScheduleV2_DayLightweightEventsQueryVariables,
    ScheduleV2_RoomFragment,
    ScheduleV2_TagFragment,
    Schedule_Event_Bool_Exp,
    useScheduleV2_DayEventsQuery,
    useScheduleV2_DayLightweightEventsQuery,
} from "../../../../../generated/graphql";
import { useConference } from "../../../useConference";
import EventBox from "./EventBox";
import type { EventCellDescriptor, ParsedEvent } from "./Types";

gql`
    fragment ScheduleV2_LightweightEvent on schedule_Event {
        id
        startTime
        endTime
        roomId
    }

    query ScheduleV2_DayLightweightEvents(
        $conferenceId: uuid!
        $startOfDay: timestamptz!
        $endOfDay: timestamptz!
        $filter: schedule_Event_bool_exp!
    ) {
        schedule_Event(
            where: {
                _and: [
                    { conferenceId: { _eq: $conferenceId } }
                    { startTime: { _lt: $endOfDay } }
                    { endTime: { _gt: $startOfDay } }
                    $filter
                ]
            }
        ) {
            ...ScheduleV2_LightweightEvent
        }
    }

    query ScheduleV2_DayEvents($eventIds: [uuid!]!) {
        schedule_Event(where: { id: { _in: $eventIds } }) {
            ...ScheduleV2_Event
        }
    }
`;

interface Props {
    startOfDayTime: luxon.DateTime;
    eventFilter?: Schedule_Event_Bool_Exp;
    sortedRooms: ScheduleV2_RoomFragment[];
    sortedTags: ScheduleV2_TagFragment[];
    timezone: luxon.Zone;
    renderImmediately: boolean;
}

const Day = React.forwardRef<HTMLTableRowElement, Props>(function Day(
    { startOfDayTime, sortedRooms, sortedTags, eventFilter, timezone, renderImmediately }: Props,
    ref
): JSX.Element {
    const endOfDayTime = useMemo(() => startOfDayTime.endOf("day"), [startOfDayTime]);

    const [isVisible, setIsVisible] = useState<boolean>(renderImmediately);
    const [isRendered, setIsRendered] = useState<boolean>(renderImmediately);

    const timeBoxBgColor = useColorModeValue("gray.50", "gray.900");
    const hourBoundaryBorderColor = useColorModeValue("gray.400", "gray.500");
    const eventBorderColor = useColorModeValue("gray.600", "gray.300");
    const eventBoxBgColor = useColorModeValue("gray.100", "gray.700");
    const weekHeadingBgColor = useColorModeValue("purple.300", "purple.700");
    const dayHeadingBgColor = useColorModeValue("blue.400", "blue.500");

    const conference = useConference();
    const lwDayEventsQueryObj: QueryHookOptions<
        ScheduleV2_DayLightweightEventsQuery,
        ScheduleV2_DayLightweightEventsQueryVariables
    > = useMemo(
        () => ({
            variables: {
                conferenceId: conference.id,
                endOfDay: startOfDayTime.endOf("day").toISO(),
                startOfDay: startOfDayTime.toISO(),
                filter: eventFilter ?? {},
            },
            skip: !isVisible,
        }),
        [conference.id, eventFilter, startOfDayTime, isVisible]
    );
    const lwEventsResponse = useScheduleV2_DayLightweightEventsQuery(lwDayEventsQueryObj);

    const fullDayEventsQueryObj: QueryHookOptions<ScheduleV2_DayEventsQuery, ScheduleV2_DayEventsQueryVariables> =
        useMemo(
            () => ({
                variables: {
                    eventIds: lwEventsResponse.data?.schedule_Event.map((event) => event.id) ?? [],
                },
                skip: !lwEventsResponse.data || !isRendered,
            }),
            [lwEventsResponse.data, isRendered]
        );
    const fullEventsResponse = useScheduleV2_DayEventsQuery(fullDayEventsQueryObj);

    const parsedEvents: ParsedEvent[] = useMemo(
        () =>
            lwEventsResponse.data?.schedule_Event.map((lwEvent) => ({
                lwEvent,
                startTimeMs: Date.parse(lwEvent.startTime),
                endTimeMs: Date.parse(lwEvent.endTime),
            })) ?? [],
        [lwEventsResponse.data?.schedule_Event]
    );
    const {
        sortedEventsByRoom,
        earliestDT,
        latestDT,
        earliestHourDT,
        earliestDayDT,
        latestHourDT,
        latestDayDT,
        timeMarkers,
        eventCellDescriptors,
    } = useMemo<{
        sortedEventsByRoom: Record<string, ParsedEvent[]>;
        earliestDT: luxon.DateTime;
        latestDT: luxon.DateTime;
        earliestHourDT: luxon.DateTime;
        earliestDayDT: luxon.DateTime;
        latestHourDT: luxon.DateTime;
        latestDayDT: luxon.DateTime;
        timeMarkers: luxon.DateTime[];
        eventCellDescriptors: Record<string, (EventCellDescriptor | null | undefined)[]>;
    }>(() => {
        // Ealriest events first. Events of equal start time sorted by shortest duration first (earliest ending first)
        const sortedEvents = R.sortWith(
            [(x, y) => x.startTimeMs - y.startTimeMs, (x, y) => x.endTimeMs - y.endTimeMs],
            parsedEvents
        );

        const sortedEventsByRoom: Record<string, ParsedEvent[]> = {};
        for (const room of sortedRooms) {
            sortedEventsByRoom[room.id] = sortedEvents.filter((x) => x.lwEvent.roomId === room.id);
        }

        const earliestMsResult = sortedEvents[0]?.startTimeMs ?? Date.now();
        const latestMsResult = R.last(sortedEvents)?.startTimeMs ?? Date.now() + 60000;
        const earliestDT = luxon.DateTime.fromMillis(earliestMsResult).setZone(timezone);
        const latestDT = luxon.DateTime.fromMillis(latestMsResult).setZone(timezone);
        let earliestHourDT = earliestDT.startOf("hour");
        const earliestDayDT = earliestDT.startOf("day");
        let latestHourDT = latestDT.endOf("hour");
        const latestDayDT = latestDT.endOf("day");

        const earliestHourMinus3HrsDT = earliestHourDT.minus({ hours: 3 });
        const latestHourPlus3HrsDT = earliestHourDT.plus({ hours: 3 });
        earliestHourDT =
            earliestHourMinus3HrsDT.toMillis() < earliestDayDT.toMillis() ? earliestDayDT : earliestHourMinus3HrsDT;
        latestHourDT = latestHourPlus3HrsDT.toMillis() > latestDayDT.toMillis() ? latestDayDT : latestHourPlus3HrsDT;

        const timeMarkers: luxon.DateTime[] = [earliestHourDT];
        let previousTimeMarker = earliestHourDT;

        // Order matters - longest period first
        const boundaries: luxon.Duration[] = [
            // These periods allow us to span most weekends and public holidays
            // without having to display every day in between and without copious
            // empty hours at the beginning of the resuming day
            { hours: 96 },
            { hours: 84 },
            { hours: 80 },
            { hours: 76 },
            { hours: 72 },
            { hours: 68 },
            { hours: 64 },
            { hours: 60 },
            { hours: 56 },
            { hours: 52 },
            { hours: 48 },
            { hours: 40 },
            { hours: 36 },
            { hours: 28 },
            // These hours allow us to span not-quite-regular daily schedules
            { hours: 24 },
            { hours: 21 },
            { hours: 18 },
            { hours: 12 },
            { hours: 9 },
            { hours: 6 },
            // This gap is deliberate - it helps to ensure users don't see
            // events listed as back-to-back that may actually be separated
            // by several hours
            { hours: 1 },
            // The remaining periods enable us to display common formats of
            // sessions (patterns/groupings of events)
            { minutes: 30 },
            { minutes: 20 },
            { minutes: 15 },
            { minutes: 10 },
            { minutes: 5 },
            { minutes: 1 },
            // ...and deal with the insane people who scheduled events off of
            // minute boundaries ;)
            { seconds: 30 },
            { seconds: 15 },
            { seconds: 5 },
            { seconds: 1 },
        ].map((x) => luxon.Duration.fromObject(x));

        let previousBoundary: luxon.Duration = boundaries[0];
        for (
            let startEventIndex = 0, endEventIndex = 0;
            startEventIndex < sortedEvents.length || endEventIndex < sortedEvents.length;

        ) {
            let currentEventMs: number;
            let currentEventSource: "start" | "end";
            let advanceEventIndex = false;
            if (startEventIndex < sortedEvents.length) {
                // endEventIndex must be less than sortedEvents length because there's still at least one event in the "starting" list!
                const startEvent = sortedEvents[startEventIndex];
                const endEvent = sortedEvents[endEventIndex];
                if (startEvent.startTimeMs < endEvent.endTimeMs || startEventIndex === endEventIndex) {
                    currentEventMs = startEvent.startTimeMs;
                    currentEventSource = "start";
                } else {
                    currentEventMs = endEvent.endTimeMs;
                    currentEventSource = "end";
                }
            } else {
                // endEventIndex must be less than sortedEvents length because it is the only branch of the loop condition that remains true
                currentEventMs = sortedEvents[endEventIndex].endTimeMs;
                currentEventSource = "end";
            }

            const timeToEventMs = currentEventMs - previousTimeMarker.toMillis();
            if (timeToEventMs > 0) {
                const chosenBoundary =
                    boundaries.find(
                        (boundary) =>
                            boundary.toMillis() <= timeToEventMs &&
                            isBoundaryExpandableTo(previousBoundary, boundary, previousTimeMarker)
                    ) ?? boundaries[boundaries.length - 1];
                let nextMarkerDT = previousTimeMarker.plus(chosenBoundary);

                if (nextMarkerDT.hour !== previousTimeMarker.hour) {
                    nextMarkerDT = nextMarkerDT.startOf("hour");
                }

                if (nextMarkerDT.toMillis() >= currentEventMs) {
                    advanceEventIndex = true;
                }

                timeMarkers.push(nextMarkerDT);
                previousTimeMarker = nextMarkerDT;
                previousBoundary = chosenBoundary;
            } else {
                advanceEventIndex = true;
            }

            if (advanceEventIndex) {
                if (currentEventSource === "start") {
                    startEventIndex++;
                } else {
                    endEventIndex++;
                }
            }
        }

        const descriptors = Object.fromEntries(
            sortedRooms.map((room) => {
                const result: (EventCellDescriptor | null | undefined)[] = [];

                const roomEvents = sortedEventsByRoom[room.id];

                let currentEventIndex = 0;
                let currentDescriptors: EventCellDescriptor[] = [];
                for (let currentMarkerIndex = 0; currentMarkerIndex < timeMarkers.length; ) {
                    if (currentEventIndex < roomEvents.length) {
                        const currentMarker = timeMarkers[currentMarkerIndex];
                        const currentEvent = roomEvents[currentEventIndex];
                        const previousEvent = currentEventIndex > 0 ? roomEvents[currentEventIndex - 1] : undefined;
                        const currentMarkerMs = currentMarker.toMillis();
                        if (currentEvent.startTimeMs > currentMarkerMs) {
                            result.push(null);
                            currentMarkerIndex++;
                        } else if (currentDescriptors.length === 0) {
                            currentDescriptors = [
                                {
                                    parsedEvent: currentEvent,
                                    markerMs: currentMarkerMs,
                                    markerSpan: 1,
                                    preceedingEventId:
                                        previousEvent &&
                                        currentEvent.startTimeMs - previousEvent.endTimeMs < 2 * 60 * 1000
                                            ? previousEvent.lwEvent.id
                                            : undefined,
                                    isSecondaryCell: false,
                                },
                            ];
                            result.push(currentDescriptors[0]);
                            currentMarkerIndex++;
                        } else if (currentEvent.endTimeMs <= currentMarkerMs) {
                            currentDescriptors = [];
                            currentEventIndex++;
                        } else if (currentDescriptors.length > 0) {
                            // const startTimeDT = luxon.DateTime.fromMillis(currentEvent.startTimeMs).setZone(timezone);
                            // const endTimeDT = luxon.DateTime.fromMillis(currentEvent.endTimeMs).setZone(timezone);
                            // if (currentDescriptors.length === 1 && startTimeDT.day !== endTimeDT.day) {
                            //     currentDescriptors.push({
                            //         ...currentDescriptors[0],
                            //         markerMs: currentMarkerMs,
                            //         isSecondaryCell: true,
                            //     });
                            //     result.push(currentDescriptors[1]);
                            // } else {
                            result.push(undefined);
                            //}

                            currentDescriptors.forEach((x) => x.markerSpan++);
                            currentMarkerIndex++;
                        }
                    } else {
                        result.push(null);
                        currentMarkerIndex++;
                    }
                }

                return [room.id, result];
            })
        );

        const result = {
            sortedEventsByRoom,
            earliestDT,
            latestDT,
            earliestHourDT,
            earliestDayDT,
            latestHourDT,
            latestDayDT,
            timeMarkers,
            eventCellDescriptors: descriptors,
        };

        return result;
    }, [timezone, parsedEvents, sortedRooms]);

    useEffect(() => {
        let tId: number | undefined;

        if (isVisible) {
            tId = setTimeout(
                (() => {
                    setIsRendered(true);
                }) as TimerHandler,
                150
            );
        }

        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [isVisible]);

    const estimatedHeight = timeMarkers.length > 2 ? Math.max(100, timeMarkers.length * 8) + "ex" : "100vh";

    return lwEventsResponse.data?.schedule_Event.length === 0 ? (
        <></>
    ) : (
        <>
            <Tr ref={ref}>
                <Th
                    colSpan={1 + sortedRooms.length}
                    pos="sticky"
                    top="calc(2.7rem - 4px)"
                    bgColor={startOfDayTime.weekday === 1 ? weekHeadingBgColor : dayHeadingBgColor}
                    fontWeight="bold"
                    fontSize="md"
                    zIndex={3}
                    h="2.7rem"
                >
                    <Box pos="sticky" left="50%" w="min-content" whiteSpace="nowrap">
                        <Box pos="relative" left="-50%">
                            {startOfDayTime.toLocaleString({
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                            })}
                        </Box>
                    </Box>
                </Th>
            </Tr>
            {isRendered ? (
                timeMarkers.map((marker, markerIndex) => {
                    if (marker.toMillis() < startOfDayTime.toMillis()) {
                        return undefined;
                    }
                    const previousMarker = markerIndex > 0 ? timeMarkers[markerIndex - 1] : undefined;

                    const markerMillis = marker.toMillis();
                    const isHourBoundary = markerMillis % (60 * 60 * 1000) === 0;
                    const isHourDiscontiguous = !!previousMarker && marker.hour > previousMarker.hour + 1;
                    const hourBoundaryBorder = "1px solid";
                    return (
                        <Tr key={markerMillis} border="none">
                            <Td
                                pos="sticky"
                                left={0}
                                zIndex={2}
                                bgColor={timeBoxBgColor}
                                m={0}
                                verticalAlign="top"
                                whiteSpace="nowrap"
                                overflow="hidden"
                                size="xs"
                                fontSize="sm"
                                p="0.6em"
                                minW="min-content"
                                maxW="8em"
                                w="8em"
                            >
                                {marker.toLocaleString({
                                    hour: "numeric",
                                    minute: "numeric",
                                    second: marker.toMillis() % (60 * 1000) !== 0 ? "numeric" : undefined,
                                })}
                            </Td>
                            {sortedRooms.map((room) => {
                                const eventCellDescriptor = eventCellDescriptors[room.id]?.[markerIndex];
                                if (eventCellDescriptor) {
                                    const startTimeDT = luxon.DateTime.fromMillis(
                                        eventCellDescriptor.parsedEvent.startTimeMs
                                    ).setZone(timezone);
                                    const endTimeDT = luxon.DateTime.fromMillis(
                                        eventCellDescriptor.parsedEvent.endTimeMs
                                    ).setZone(timezone);
                                    return (
                                        <EventBox
                                            key={room.id}
                                            event={eventCellDescriptor}
                                            isHourBoundary={isHourBoundary}
                                            isHourDiscontiguous={isHourDiscontiguous}
                                            hourBoundaryBorderColor={hourBoundaryBorderColor}
                                            eventBoxBgColor={eventBoxBgColor}
                                            eventBorderColor={eventBorderColor}
                                            splitOverDayBoundary={
                                                startTimeDT.day !== endTimeDT.day
                                                    ? eventCellDescriptor.isSecondaryCell
                                                        ? "second"
                                                        : "first"
                                                    : "no"
                                            }
                                            tags={sortedTags}
                                            timezone={timezone}
                                            fullEvent={fullEventsResponse.data?.schedule_Event.find(
                                                (ev) => ev.id === eventCellDescriptor.parsedEvent.lwEvent.id
                                            )}
                                            renderImmediately={parsedEvents.length < 200}
                                        />
                                    );
                                } else if (eventCellDescriptor !== undefined) {
                                    return (
                                        <Td
                                            key={room.id}
                                            borderTop={isHourBoundary ? hourBoundaryBorder : undefined}
                                            borderTopColor={isHourBoundary ? hourBoundaryBorderColor : undefined}
                                            borderTopStyle={isHourBoundary && isHourDiscontiguous ? "double" : "solid"}
                                            borderTopWidth={isHourBoundary && isHourDiscontiguous ? "6px" : undefined}
                                        >
                                            {/* EMPTY */}
                                        </Td>
                                    );
                                }
                            })}
                        </Tr>
                    );
                })
            ) : (
                <IntersectionObserver
                    onChange={({ isIntersecting }) => {
                        setIsVisible((old) => old || isIntersecting);
                    }}
                >
                    <Tr h={estimatedHeight}>
                        <Skeleton
                            as={Td}
                            h={estimatedHeight}
                            isLoaded={false}
                            bg={eventBoxBgColor}
                            colSpan={1 + sortedRooms.length}
                        >
                            &nbsp;
                        </Skeleton>
                    </Tr>
                </IntersectionObserver>
            )}
        </>
    );
});

function isBoundaryExpandableTo(period1: luxon.Duration, period2: luxon.Duration, currentTime: luxon.DateTime) {
    const period1Ms = period1.toMillis();
    const period2Ms = period2.toMillis();
    return (
        period2Ms < period1Ms ||
        (period2Ms % period1Ms === 0 && currentTime.toMillis() % period2Ms === 0) ||
        (period2Ms >= 6 * 60 * 60 * 1000 && currentTime.toMillis() % (60 * 60 * 1000) === 0)
    );
}

export default Day;
