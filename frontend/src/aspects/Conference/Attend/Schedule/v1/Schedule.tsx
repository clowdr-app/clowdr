import { Box, Flex, Heading, Text, useColorMode, useColorModeValue, useToken } from "@chakra-ui/react";
import assert from "assert";
import { DateTime } from "luxon";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import ScrollContainer from "react-indiana-drag-scroll";
import Color from "tinycolor2";
import { gql } from "urql";
import {
    Permissions_Permission_Enum,
    ProgramPersonDataFragment,
    Schedule_EventSummaryFragment,
    Schedule_ItemFieldsFragment,
    Schedule_ProgramPersonFragment,
    Schedule_RoomSummaryFragment,
    Schedule_SelectSummariesQuery,
    Schedule_TagFragment,
    useSchedule_SelectSummariesQuery,
} from "../../../../../generated/graphql";
import QueryWrapper from "../../../../GQL/QueryWrapper";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useTitle } from "../../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../../useConference";
import DayList, { TimelineEvent } from "./DayList";
import DownloadCalendarButton from "./DownloadCalendarButton";
import NowMarker from "./NowMarker";
import RoomNameBox from "./RoomNameBox";
import RoomTimeline from "./RoomTimeline";
import { ScalingProvider, useScalingParams } from "./Scaling";
import TimeBar from "./TimeBar";
import useTimelineParameters, { TimelineParameters } from "./useTimelineParameters";

gql`
    fragment Schedule_Element on content_Element {
        id
        typeName
        name
        layoutData
        data
    }

    fragment Schedule_ProgramPerson on collection_ProgramPerson {
        id
        name
        affiliation
        registrantId
    }

    fragment Schedule_ItemPerson on content_ItemProgramPerson {
        id
        personId
        priority
        roleName
    }

    fragment Schedule_ItemFields on content_Item {
        id
        title
        shortTitle
        typeName
        itemTags {
            id
            itemId
            tagId
        }
        itemExhibitions {
            id
            itemId
            exhibitionId
        }
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            ...Schedule_ItemPerson
        }
    }

    fragment Schedule_Item on content_Item {
        ...Schedule_ItemFields
        abstractElements: elements(where: { typeName: { _eq: ABSTRACT }, isHidden: { _eq: false } }) {
            ...Schedule_Element
        }
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            ...Schedule_ItemPerson
        }
    }

    query Schedule_SelectItem($id: uuid!) {
        content_Item_by_pk(id: $id) {
            ...Schedule_Item
        }
    }

    fragment Schedule_EventSummary on schedule_Event {
        id
        roomId
        intendedRoomModeName
        name
        startTime
        durationSeconds
        itemId
        exhibitionId
        shufflePeriodId
    }

    fragment Schedule_RoomSummary on room_Room {
        id
        name
        currentModeName
        priority
        managementModeName
    }

    fragment Schedule_Tag on collection_Tag {
        id
        name
        colour
        priority
    }

    query Schedule_SelectSummaries($conferenceId: uuid!) {
        room_Room(
            where: { conferenceId: { _eq: $conferenceId }, managementModeName: { _in: [PUBLIC, PRIVATE] }, events: {} }
        ) {
            ...Schedule_RoomSummary
        }
        schedule_Event(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_EventSummary
        }
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_ItemFields
        }
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_ProgramPerson
        }
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_Tag
        }
    }
`;

type GroupableByTime<T> = T & {
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
};

type Schedule_EventSummaryExt = GroupableByTime<Schedule_EventSummaryFragment>;

type Session = GroupableByTime<{
    room: Schedule_RoomSummaryFragment;
    events: Schedule_EventSummaryExt[];
}>;

type ColumnAssignedSession = { session: Session; column: number };

type Frame = GroupableByTime<{
    items: ColumnAssignedSession[];
}>;

function recombineSessions(
    frames: GroupableByTime<{
        items: Session[];
    }>[]
): Frame[] {
    return frames.map<Frame>((frame) => {
        const groups = R.groupBy((x) => x.room.id, frame.items);
        const roomIds = R.keys(groups);
        return {
            startTimeMs: frame.startTimeMs,
            endTimeMs: frame.endTimeMs,
            durationMs: frame.durationMs,
            items: roomIds.map((roomId) => {
                const group = groups[roomId];
                const { startTimeMs, endTimeMs } = group.reduce(
                    (acc, session) => ({
                        startTimeMs: Math.min(acc.startTimeMs, session.startTimeMs),
                        endTimeMs: Math.max(acc.endTimeMs, session.endTimeMs),
                    }),
                    { startTimeMs: Number.POSITIVE_INFINITY, endTimeMs: Number.NEGATIVE_INFINITY }
                );

                const session: ColumnAssignedSession = {
                    column: -1,
                    session: {
                        startTimeMs,
                        endTimeMs,
                        durationMs: endTimeMs - startTimeMs,
                        room: group[0].room,
                        events: R.sortBy(
                            (x) => x.startTimeMs,
                            group.flatMap<Schedule_EventSummaryExt>((session) => session.events)
                        ),
                    },
                };

                return session;
            }),
        };
    });
}

/**
 * Groups events into sessions, sessions into frames.
 */
function groupByTime<S, T extends GroupableByTime<S>>(
    items: T[],
    lookaheadMs: number
): GroupableByTime<{ items: T[] }>[] {
    // Sort by earliest first
    items = R.sortBy((x) => x.startTimeMs, items);

    const result: GroupableByTime<{ items: GroupableByTime<T>[] }>[] = [];

    let session: GroupableByTime<T>[] = [];
    let sessionEndTime: number = Number.NEGATIVE_INFINITY;
    for (let idx = 0; idx < items.length; idx++) {
        const event = items[idx];
        // Found a sufficiently wide gap between items?
        if (event.startTimeMs >= sessionEndTime + lookaheadMs) {
            // Save previous session
            if (session.length > 0) {
                const startTimeMs = session[0].startTimeMs;
                const endTimeMs = session.reduce(
                    (acc, session) => Math.max(acc, session.endTimeMs),
                    Number.NEGATIVE_INFINITY
                );
                result.push({
                    items: session,
                    startTimeMs,
                    endTimeMs,
                    durationMs: endTimeMs - startTimeMs,
                });
            }

            // New session
            session = [event];
            sessionEndTime = event.endTimeMs;
        } else {
            // Add to current session
            session.push(event);
            sessionEndTime = Math.max(sessionEndTime, event.endTimeMs);
        }
    }
    // Save last session
    if (session.length > 0) {
        const startTimeMs = session[0].startTimeMs;
        const endTimeMs = session.reduce((acc, session) => Math.max(acc, session.endTimeMs), Number.NEGATIVE_INFINITY);
        result.push({
            items: session,
            startTimeMs,
            endTimeMs,
            durationMs: endTimeMs - startTimeMs,
        });
    }

    return result;
}

/**
 * Sorts the rooms of each frame into columns, attempting to keep stable
 * assignments between frames
 */
function assignColumns(frames: Frame[]): Frame[] {
    if (frames.length > 0) {
        const frame0 = frames[0];
        frame0.items = R.sortBy((x) => x.session.room.priority, frame0.items);
        for (let idx = 0; idx < frame0.items.length; idx++) {
            frame0.items[idx].column = idx;
        }

        const maxParallelRooms = frames.reduce((acc, frame) => Math.max(acc, frame.items.length), 0);

        for (let frameIdx = 1; frameIdx < frames.length; frameIdx++) {
            // const previousFrame = frames[frameIdx - 1];
            const currentFrame = frames[frameIdx];

            // // Assign same columns as previous frame
            // for (const item of currentFrame.items) {
            //     item.column =
            //         previousFrame.items.find((itemY) => itemY.session.room.id === item.session.room.id)?.column ?? -1;
            // }

            const usedColumns = new Set(currentFrame.items.map((x) => x.column));
            const availableColumns = Array.from({ length: maxParallelRooms }, (_x, i) => i).filter(
                (y) => !usedColumns.has(y)
            );
            // Assign remaining columns in priority order
            const currentFrameUnassignedItems = R.sortBy(
                (x) => x.session.room.priority,
                currentFrame.items.filter((x) => x.column === -1)
            );
            assert(currentFrameUnassignedItems.length <= availableColumns.length, "Hmm, something weird happened!");
            let nextColIdx = 0;
            for (const item of currentFrameUnassignedItems) {
                item.column = availableColumns[nextColIdx++];
            }
            currentFrame.items = R.sortBy((x) => x.column, currentFrame.items);
        }
    }
    return frames;
}

function ScheduleFrame({
    frame,
    alternateBgColor,
    borderColour,
    roomColWidth,
    timeBarWidth,
    scrollToEventCbs,
    setScrollToNow,
    items,
    isNewDay,
    tags,
    people,
}: {
    frame: Frame;
    alternateBgColor: string;
    borderColour: string;
    maxParallelRooms: number;
    items: ReadonlyArray<Schedule_ItemFieldsFragment>;
    tags: ReadonlyArray<Schedule_TagFragment>;
    people: ReadonlyArray<Schedule_ProgramPersonFragment>;
    roomColWidth: number;
    timeBarWidth: number;
    scrollToEventCbs: Map<string, () => void>;
    setScrollToNow: (f: { f: () => void } | null) => void;
    isNewDay: boolean;
}): JSX.Element {
    const roomNameBoxes = useMemo(
        () =>
            frame.items.map((item, idx) => {
                const room = item.session.room;

                return (
                    <RoomNameBox
                        key={room.id}
                        room={room}
                        width={roomColWidth}
                        showBottomBorder={true}
                        borderColour={borderColour}
                        backgroundColor={idx % 2 === 0 ? alternateBgColor : undefined}
                    />
                );
            }),
        [alternateBgColor, borderColour, frame.items, roomColWidth]
    );

    const { visibleTimeSpanSeconds } = useScalingParams();
    const { fullTimeSpanSeconds } = useTimelineParameters();

    const innerHeightPx = ((window.innerHeight - 200) * fullTimeSpanSeconds) / visibleTimeSpanSeconds;

    const labeledNowMarker = useMemo(() => <NowMarker showLabel setScrollToNow={setScrollToNow} />, [setScrollToNow]);

    const roomTimelines = useMemo(
        () =>
            frame.items.map((item) => {
                const room = item.session.room;

                return (
                    <Box key={room.id} h="100%" w={roomColWidth + "px"}>
                        <RoomTimeline
                            room={room}
                            hideTimeShiftButtons={true}
                            hideTimeZoomButtons={true}
                            width={roomColWidth}
                            scrollToEventCbs={scrollToEventCbs}
                            events={item.session.events}
                            items={items}
                            tags={tags}
                            people={people}
                        />
                    </Box>
                );
            }, [] as (JSX.Element | undefined)[]),
        [items, frame.items, roomColWidth, scrollToEventCbs, tags, people]
    );

    const timelineParams = useTimelineParameters();
    const startTime = useMemo(
        () => DateTime.fromMillis(frame.startTimeMs).setZone(timelineParams.timezone),
        [frame.startTimeMs, timelineParams.timezone]
    );
    const borderColourRaw = useToken("colors", borderColour);
    const { colorMode } = useColorMode();

    return (
        <Box w="100%">
            <Box
                borderTopStyle="solid"
                borderTopWidth="2px"
                borderTopColor={borderColour}
                borderBottomStyle="solid"
                borderBottomWidth="1px"
                borderBottomColor={Color(borderColourRaw).darken(30).toRgbString()}
                mt={4}
                px={2}
                py={1}
                fontSize={isNewDay ? "md" : "sm"}
                fontWeight={isNewDay ? "bold" : undefined}
                flex="1 0 max-content"
                display="flex"
                justifyContent="stretch"
                alignItems="stretch"
                backgroundColor={
                    isNewDay
                        ? colorMode === "dark"
                            ? "rgba(230, 200, 50, 0.3)"
                            : "yellow.100"
                        : colorMode === "dark"
                        ? "gray.700"
                        : "gray.200"
                }
            >
                {startTime.toLocaleString(
                    isNewDay
                        ? {
                              weekday: "short",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                          }
                        : {
                              weekday: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                          }
                )}
            </Box>
            <Box
                flex="1 0 max-content"
                role="list"
                aria-label="Rooms"
                display="flex"
                justifyContent="stretch"
                alignItems="stretch"
            >
                <RoomNameBox room="" width={timeBarWidth} showBottomBorder={true} borderColour={borderColour} />
                {roomNameBoxes}
            </Box>
            <Flex h={innerHeightPx + "px"} w="100%" role="region" aria-label="Room schedules" pos="relative">
                <TimeBar width={timeBarWidth} borderColour={borderColour} />
                {/* {roomMarkers} */}
                <NowMarker />
                {labeledNowMarker}
                {roomTimelines}
            </Flex>
        </Box>
    );
}

export function ScheduleInner({
    rooms,
    events: rawEvents,
    items,
    people,
    tags,
    titleStr,
    noEventsText = titleStr,
}: {
    rooms: ReadonlyArray<Schedule_RoomSummaryFragment>;
    events: ReadonlyArray<Schedule_EventSummaryFragment>;
    items: ReadonlyArray<Schedule_ItemFieldsFragment>;
    people: ReadonlyArray<Schedule_ProgramPersonFragment>;
    tags: ReadonlyArray<Schedule_TagFragment>;
    titleStr?: string;
    noEventsText?: string;
}): JSX.Element {
    const eventsByRoom = useMemo(
        () =>
            R.groupBy<Schedule_EventSummaryExt>(
                (x) => x.roomId,
                R.map((event) => {
                    const startTimeMs = Date.parse(event.startTime);
                    const durationMs = event.durationSeconds * 1000;
                    return {
                        ...event,
                        startTimeMs,
                        durationMs,
                        endTimeMs: startTimeMs + durationMs,
                    };
                }, rawEvents)
            ),
        [rawEvents]
    );

    const frames = useMemo(() => {
        const sessions: Session[] = [];
        for (const roomId in eventsByRoom) {
            const room = rooms.find((x) => x.id === roomId);
            if (room) {
                const groupedEvents = groupByTime<Schedule_EventSummaryFragment, Schedule_EventSummaryExt>(
                    eventsByRoom[roomId],
                    5 * 60 * 1000
                );
                sessions.push(
                    ...groupedEvents.map((group) => ({
                        room,
                        events: group.items,
                        startTimeMs: group.startTimeMs,
                        endTimeMs: group.endTimeMs,
                        durationMs: group.durationMs,
                    }))
                );
            } else {
                console.warn(
                    `Schedule may be rendered with some events missing as data for room ${roomId} was not found.`
                );
            }
        }
        const result = assignColumns(recombineSessions(groupByTime(sessions, 0)));
        console.log("Schedule frames", result);
        return result;
    }, [eventsByRoom, rooms]);

    const alternateBgColor = useColorModeValue("PrimaryActionButton.100", "PrimaryActionButton.700");
    const borderColour = useColorModeValue("gray.400", "gray.400");

    const scrollToEventCbs = useMemo(() => new Map(), []);

    const [scrollToNow, setScrollToNow] = useState<{ f: () => void } | null>(null);

    const maxParallelRooms = useMemo(
        () => frames.reduce((acc, frame) => Math.max(acc, frame.items.length), 0),
        [frames]
    );
    const timeBarWidth = 50;
    const roomColWidth = Math.min(
        800,
        Math.max(250, ((window.innerWidth >= 1152 ? 1152 : window.innerWidth) - timeBarWidth - 100) / maxParallelRooms)
    );

    const frameEls = useMemo(() => {
        return frames.map((frame, idx) => {
            const avgEventDurationI = frame.items.reduce(
                (acc, item) =>
                    item.session.events.reduce((acc, event) => {
                        acc.sum = acc.sum + event.durationMs;
                        acc.count = acc.count + 1;
                        return acc;
                    }, acc),
                { sum: 0, count: 0 }
            );
            const avgEventsPerRoomI = frame.items.reduce(
                (acc, item) => {
                    acc.sum = acc.sum + item.session.events.length;
                    acc.count = acc.count + 1;
                    return acc;
                },
                { sum: 0, count: 0 }
            );
            const avgEventDuration = avgEventDurationI.count > 0 ? avgEventDurationI.sum / avgEventDurationI.count : 1;
            const avgEventsPerRoom = avgEventsPerRoomI.count > 0 ? avgEventsPerRoomI.sum / avgEventsPerRoomI.count : 1;
            const isNewDay =
                idx === 0 || new Date(frames[idx - 1].startTimeMs).getDay() !== new Date(frame.startTimeMs).getDay();
            return (
                <TimelineParameters
                    earliestEventStart={frame.startTimeMs}
                    latestEventEnd={frame.endTimeMs}
                    key={`frame-${frame.startTimeMs}`}
                >
                    <ScalingProvider avgEventDuration={avgEventDuration} avgEventsPerRoom={avgEventsPerRoom}>
                        <ScheduleFrame
                            frame={frame}
                            alternateBgColor={alternateBgColor}
                            borderColour={borderColour}
                            maxParallelRooms={maxParallelRooms}
                            scrollToEventCbs={scrollToEventCbs}
                            setScrollToNow={setScrollToNow}
                            items={items}
                            tags={tags}
                            people={people}
                            roomColWidth={roomColWidth}
                            timeBarWidth={timeBarWidth}
                            isNewDay={isNewDay}
                        />
                    </ScalingProvider>
                </TimelineParameters>
            );
        });
    }, [alternateBgColor, borderColour, frames, items, maxParallelRooms, roomColWidth, scrollToEventCbs, tags, people]);

    const scrollToEvent = useCallback(
        (ev: Schedule_EventSummaryFragment) => {
            const cb = scrollToEventCbs.get(ev.id);
            cb?.(ev);
        },
        [scrollToEventCbs]
    );

    const dayList = useMemo(
        () => (
            <TimelineParameters earliestEventStart={0} latestEventEnd={0}>
                <DayList rooms={rooms} events={rawEvents} scrollToEvent={scrollToEvent} scrollToNow={scrollToNow} />
            </TimelineParameters>
        ),
        [rawEvents, rooms, scrollToEvent, scrollToNow]
    );

    const eventsWithItems = useCallback<() => TimelineEvent[]>(
        () =>
            rawEvents.map<TimelineEvent>((event) => {
                const item = event.itemId ? items.find((x) => x.id === event.itemId) : undefined;
                return {
                    ...event,
                    item,
                    itemPeople: item
                        ? people.reduce<ProgramPersonDataFragment[]>((acc, person) => {
                              const itemPerson = item.itemPeople.find(
                                  (itemPerson) => itemPerson.personId === person.id
                              );
                              if (itemPerson) {
                                  acc.push({
                                      ...itemPerson,
                                      person,
                                  });
                              }
                              return acc;
                          }, [])
                        : [],
                    exhibitionPeople: event.exhibitionId ? [] : [],
                };
            }),
        [rawEvents, items, people]
    );

    /*Plus 30 to the width to account for scrollbars!*/
    return (
        <Flex h="100%" w="100%" minW="100%" maxW={timeBarWidth + maxParallelRooms * roomColWidth + 30} flexDir="column">
            <Flex w="100%" direction="row" justify="center" alignItems="center" flexWrap="wrap">
                <Heading as="h1" id="page-heading" mx={4} mb={2}>
                    {titleStr ?? "Schedule"}
                </Heading>
                {dayList}
                <DownloadCalendarButton
                    events={eventsWithItems}
                    ml={2}
                    calendarName={titleStr ?? "Complete Schedule"}
                />
            </Flex>
            <Text w="auto" textAlign="left" p={0} my={1}>
                <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                Dates and times are shown in your local timezone.
            </Text>
            <Text w="auto" textAlign="left" p={0} my={1}>
                <FAIcon iconStyle="s" icon="bell" mr={2} mb={1} />
                Download the calendar and import it to your preferred calendar app to receive reminders.
            </Text>
            <Box
                cursor="pointer"
                as={ScrollContainer}
                w="100%"
                borderColor={borderColour}
                borderWidth={1}
                borderStyle="solid"
                hideScrollbars={false}
            >
                <Flex
                    direction="column"
                    w={timeBarWidth + maxParallelRooms * roomColWidth}
                    justifyContent="stretch"
                    alignItems="flex-start"
                    role="region"
                    aria-label="Conference schedule"
                >
                    {frameEls}
                </Flex>
            </Box>
            {!rawEvents.length ? <Box>No events {noEventsText ? noEventsText.toLowerCase() : ""}</Box> : undefined}
        </Flex>
    );
}

export function ScheduleFetchWrapper(): JSX.Element {
    const conference = useConference();
    const [roomsResult] = useSchedule_SelectSummariesQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "cache-first",
    });
    return (
        <QueryWrapper<
            Schedule_SelectSummariesQuery,
            unknown,
            {
                rooms: ReadonlyArray<Schedule_RoomSummaryFragment>;
                events: ReadonlyArray<Schedule_EventSummaryFragment>;
                items: ReadonlyArray<Schedule_ItemFieldsFragment>;
                tags: ReadonlyArray<Schedule_TagFragment>;
                people: ReadonlyArray<Schedule_ProgramPersonFragment>;
            }
        >
            queryResult={roomsResult}
            getter={(x) => ({
                rooms: x.room_Room,
                events: x.schedule_Event,
                items: x.content_Item,
                tags: x.collection_Tag,
                people: x.collection_ProgramPerson,
            })}
        >
            {(data) => <ScheduleInner {...data} />}
        </QueryWrapper>
    );
}

export default function Schedule(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Schedule of ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permissions_Permission_Enum.ConferenceView,
                Permissions_Permission_Enum.ConferenceManageSchedule,
            ]}
        >
            {title}
            <ScheduleFetchWrapper />
        </RequireAtLeastOnePermissionWrapper>
    );
}
