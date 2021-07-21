import { gql } from "@apollo/client";
import { Box, Table, Td, Th, Tr, useColorModeValue, useToken } from "@chakra-ui/react";
import * as luxon from "luxon";
import * as R from "ramda";
import React, { Fragment, useMemo } from "react";
import {
    ScheduleV2_RoomFragment,
    useScheduleV2_AllEventsQuery,
    useScheduleV2_RoomsQuery,
    useScheduleV2_TagsQuery,
} from "../../../../../generated/graphql";
import CenteredSpinner from "../../../../Chakra/CenteredSpinner";
import { useConference } from "../../../useConference";
import EventBox from "./EventBox";
import { ScheduleProvider, useSchedule } from "./ScheduleContext";
import type { EventCellDescriptor, ParsedEvent, ScheduleProps } from "./Types";

gql`
    fragment ScheduleV2_BaseEvent on schedule_Event {
        id
        startTime
        endTime
        roomId
    }

    fragment ScheduleV2_Room on room_Room {
        id
        name
        # colour
        priority
    }

    query ScheduleV2_Rooms($roomIds: [uuid!]!) {
        room_Room(where: { id: { _in: $roomIds } }) {
            ...ScheduleV2_Room
        }
    }

    query ScheduleV2_AllEvents($conferenceId: uuid!) {
        schedule_Event(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ScheduleV2_BaseEvent
        }
    }
`;

function ScheduleInner({ events }: ScheduleProps): JSX.Element {
    const params = useSchedule();

    const conference = useConference();
    const tagsResponse = useScheduleV2_TagsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const parsedEvents: ParsedEvent[] = useMemo(
        () =>
            events.map((event) => ({
                event,
                startTimeMs: Date.parse(event.startTime),
                endTimeMs: Date.parse(event.endTime),
            })),
        [events]
    );
    const {
        roomIds,
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
        roomIds: string[];
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

        const roomIdsResult = new Set<string>(parsedEvents.map((x) => x.event.roomId));
        const sortedEventsByRoom: Record<string, ParsedEvent[]> = {};
        for (const roomId of roomIdsResult) {
            sortedEventsByRoom[roomId] = sortedEvents.filter((x) => x.event.roomId === roomId);
        }

        const earliestMsResult = sortedEvents[0]?.startTimeMs ?? Date.now();
        const latestMsResult = R.last(sortedEvents)?.startTimeMs ?? Date.now() + 60000;
        const earliestDT = luxon.DateTime.fromMillis(earliestMsResult).setZone(params.timezone);
        const latestDT = luxon.DateTime.fromMillis(latestMsResult).setZone(params.timezone);
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
            [...roomIdsResult].map((roomId) => {
                const result: (EventCellDescriptor | null | undefined)[] = [];

                const roomEvents = sortedEventsByRoom[roomId];

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
                                    markerSpan: 1, // Plus an extra one due to the day divider
                                    preceedingEventId:
                                        previousEvent &&
                                        currentEvent.startTimeMs - previousEvent.endTimeMs < 2 * 60 * 1000
                                            ? previousEvent.event.id
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
                            const startTimeDT = luxon.DateTime.fromMillis(currentEvent.startTimeMs).setZone(
                                params.timezone
                            );
                            const endTimeDT = luxon.DateTime.fromMillis(currentEvent.endTimeMs).setZone(
                                params.timezone
                            );
                            if (currentDescriptors.length === 1 && startTimeDT.day !== endTimeDT.day) {
                                currentDescriptors.push({
                                    ...currentDescriptors[0],
                                    markerMs: currentMarkerMs,
                                    isSecondaryCell: true,
                                });
                                result.push(currentDescriptors[1]);
                            } else {
                                result.push(undefined);
                            }

                            currentDescriptors.forEach((x) => x.markerSpan++);
                            currentMarkerIndex++;
                        }
                    } else {
                        result.push(null);
                        currentMarkerIndex++;
                    }
                }

                return [roomId, result];
            })
        );

        const result = {
            roomIds: [...roomIdsResult],
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
    }, [params.timezone, parsedEvents]);

    const roomsResponse = useScheduleV2_RoomsQuery({
        variables: {
            roomIds,
        },
    });

    const sortedRooms = useMemo<ScheduleV2_RoomFragment[]>(
        () =>
            roomsResponse.data?.room_Room
                ? R.sortWith(
                      [(x, y) => x.priority - y.priority, (x, y) => x.name.localeCompare(y.name)],
                      roomsResponse.data.room_Room
                  )
                : [],
        [roomsResponse.data?.room_Room]
    );

    const scrollbarColour = useColorModeValue("gray.500", "gray.200");
    const scrollbarBackground = useColorModeValue("gray.200", "gray.500");
    const scrollbarColourT = useToken("colors", scrollbarColour);
    const scrollbarBackgroundT = useToken("colors", scrollbarBackground);

    const timeBoxBgColor = useColorModeValue("gray.50", "gray.900");
    const roomHeadingBgColor = useColorModeValue("gray.50", "gray.900");
    const hourBoundaryBorderColor = useColorModeValue("gray.400", "gray.500");
    const eventBorderColor = useColorModeValue("gray.600", "gray.300");
    const eventBoxBgColor = useColorModeValue("gray.100", "gray.700");
    const weekHeadingBgColor = useColorModeValue("purple.300", "purple.700");
    const dayHeadingBgColor = useColorModeValue("blue.400", "blue.500");

    const table = useMemo(
        () => (
            <Table
                variant="unstyled"
                w="100%"
                minW={`calc(${sortedRooms.length * 350}px + 4em)`}
                __css={{ tableLayout: "fixed" }}
            >
                <Tr>
                    <Th
                        pos="sticky"
                        top={0}
                        left={0}
                        bgColor={timeBoxBgColor}
                        zIndex={3}
                        whiteSpace="nowrap"
                        minW="min-content"
                        w="8em"
                        overflow="hidden"
                    >
                        Time
                    </Th>
                    {sortedRooms.map((room) => (
                        <Th
                            key={room.id}
                            pos="sticky"
                            top={0}
                            bgColor={roomHeadingBgColor}
                            whiteSpace="nowrap" /* bgColor={room.colour} */
                            zIndex={1}
                            textAlign="center"
                            w="350px"
                        >
                            {room.name}
                        </Th>
                    ))}
                </Tr>
                {timeMarkers.map((marker, markerIndex) => {
                    const previousMarker = markerIndex > 0 ? timeMarkers[markerIndex - 1] : undefined;

                    const markerMillis = marker.toMillis();
                    const isHourBoundary = markerMillis % (60 * 60 * 1000) === 0;
                    const isHourDiscontiguous = !!previousMarker && marker.hour > previousMarker.hour + 1;
                    const hourBoundaryBorder = "1px solid";
                    const currentRow = (
                        <Tr key={markerMillis}>
                            <Td
                                pos="sticky"
                                left={0}
                                zIndex={2}
                                bgColor={timeBoxBgColor}
                                border="none"
                                m={0}
                                verticalAlign="top"
                                whiteSpace="nowrap"
                                overflow="hidden"
                                size="xs"
                                fontSize="sm"
                                p="0.6em"
                            >
                                {marker.toLocaleString({
                                    hour: "numeric",
                                    minute: "numeric",
                                    second: marker.toMillis() % (60 * 1000) !== 0 ? "numeric" : undefined,
                                })}
                            </Td>
                            {sortedRooms.map((room) => {
                                const eventCellDescriptor = eventCellDescriptors[room.id][markerIndex];
                                if (eventCellDescriptor) {
                                    const startTimeDT = luxon.DateTime.fromMillis(
                                        eventCellDescriptor.parsedEvent.startTimeMs
                                    ).setZone(params.timezone);
                                    const endTimeDT = luxon.DateTime.fromMillis(
                                        eventCellDescriptor.parsedEvent.endTimeMs
                                    ).setZone(params.timezone);
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
                                            tags={tagsResponse.data?.collection_Tag ?? []}
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

                    if (!previousMarker || previousMarker.day !== marker.day) {
                        return (
                            <Fragment key={markerMillis}>
                                <Tr>
                                    <Th
                                        colSpan={1 + sortedRooms.length}
                                        pos="sticky"
                                        top="calc(2.7rem - 4px)"
                                        bgColor={
                                            previousMarker && previousMarker.weekNumber !== marker.weekNumber
                                                ? weekHeadingBgColor
                                                : dayHeadingBgColor
                                        }
                                        fontWeight="bold"
                                        fontSize="md"
                                        zIndex={3}
                                        h="2.7rem"
                                    >
                                        <Box pos="sticky" left="50%" w="min-content" whiteSpace="nowrap">
                                            <Box pos="relative" left="-50%">
                                                {marker.toLocaleString({
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </Box>
                                        </Box>
                                    </Th>
                                </Tr>
                                {currentRow}
                            </Fragment>
                        );
                    }

                    return currentRow;
                })}
            </Table>
        ),
        [
            dayHeadingBgColor,
            eventBorderColor,
            eventBoxBgColor,
            eventCellDescriptors,
            hourBoundaryBorderColor,
            params.timezone,
            roomHeadingBgColor,
            sortedRooms,
            tagsResponse.data?.collection_Tag,
            timeBoxBgColor,
            timeMarkers,
            weekHeadingBgColor,
        ]
    );

    return (
        <Box
            pos="relative"
            h="100%"
            maxH="95vh"
            w="97%"
            overflow="auto"
            css={{
                scrollbarWidth: "thin",
                scrollbarColor: `${scrollbarColour} ${scrollbarBackground}`,
                "&::-webkit-scrollbar": {
                    width: "6px",
                    height: "6px",
                },
                "&::-webkit-scrollbar-track": {
                    width: "8px",
                    height: "8px",
                    background: scrollbarBackgroundT,
                },
                "&::-webkit-scrollbar-thumb": {
                    background: scrollbarColourT,
                    borderRadius: "24px",
                },
            }}
        >
            {table}
        </Box>
    );
}

export default function Schedule(props: ScheduleProps): JSX.Element {
    return (
        <ScheduleProvider>
            <ScheduleInner {...props} />
        </ScheduleProvider>
    );
}

export function WholeSchedule(): JSX.Element {
    const conference = useConference();
    const eventsResponse = useScheduleV2_AllEventsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    if (eventsResponse.loading || !eventsResponse.data) {
        return <CenteredSpinner />;
    }

    return <Schedule events={eventsResponse.data.schedule_Event} />;
}

function isBoundaryExpandableTo(period1: luxon.Duration, period2: luxon.Duration, currentTime: luxon.DateTime) {
    const period1Ms = period1.toMillis();
    const period2Ms = period2.toMillis();
    return (
        period2Ms < period1Ms ||
        (period2Ms % period1Ms === 0 && currentTime.toMillis() % period2Ms === 0) ||
        (period2Ms >= 6 * 60 * 60 * 1000 && currentTime.toMillis() % (60 * 60 * 1000) === 0)
    );
}
