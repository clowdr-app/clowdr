import { Box } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Timeline_EventFragment,
    Timeline_RoomFragment,
    Timeline_SelectRoomQuery,
    useTimeline_SelectRoomQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import EventBox from "./EventBox";
import Scroller from "./Scroller";
import TimelineZoomControls from "./TimelineZoomControls";
import { TimelineParameters } from "./useTimelineParameters";

function RoomTimelineContents({
    groupedEvents,
    room,
    setScrollToEvent,
}: {
    groupedEvents: Timeline_EventFragment[][];
    room: Timeline_RoomFragment;
    setScrollToEvent?: (f: (event: Timeline_EventFragment) => void) => void;
}): JSX.Element {
    const [scrollCallbacks, setScrollCallbacks] = useState<Map<string, () => void>>(new Map());
    const eventBoxes = useMemo(
        () =>
            groupedEvents.map((events) => (
                <EventBox
                    roomName={room.name}
                    key={events[0].id}
                    sortedEvents={events}
                    setScrollToEvent={(cb) => {
                        setScrollCallbacks((old) => {
                            const newMap = new Map(old);
                            events.forEach((e) => newMap.set(e.id, cb));
                            return newMap;
                        });
                    }}
                />
            )),
        [groupedEvents, room.name]
    );
    const scrollToEvent = useCallback(
        (ev: Timeline_EventFragment) => {
            const evCb = scrollCallbacks.get(ev.id);
            evCb?.();
        },
        [scrollCallbacks]
    );
    useEffect(() => {
        setScrollToEvent?.(scrollToEvent);
    }, [scrollToEvent, setScrollToEvent]);
    return <>{eventBoxes}</>;
}

function RoomTimelineInner({
    room,
    hideTimeZoomButtons = true,
    useScroller = false,
    height = 50,
    backgroundColor,
    setScrollToEvent,
}: {
    room: Timeline_RoomFragment;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    backgroundColor?: string;
    setScrollToEvent?: (f: (event: Timeline_EventFragment) => void) => void;
}): JSX.Element {
    const groupedEvents = useMemo(() => {
        const result: Timeline_EventFragment[][] = [];
        const sortedEvents = [...room.events].sort((x, y) => Date.parse(x.startTime) - Date.parse(y.startTime));

        let currentEventsGroup: Timeline_EventFragment[] = [];
        for (let idx = 0; idx < sortedEvents.length; idx++) {
            const event = sortedEvents[idx];
            const compareEvent = currentEventsGroup.length > 0 ? currentEventsGroup[0] : undefined;
            if (
                !compareEvent ||
                (compareEvent.contentGroup &&
                    compareEvent.contentGroup.id === event.contentGroup?.id &&
                    Math.abs(
                        Date.parse(event.startTime) -
                            (Date.parse(compareEvent.startTime) + compareEvent.durationSeconds * 1000)
                    ) <
                        1000 * 600)
            ) {
                currentEventsGroup.push(event);
            } else {
                result.push(currentEventsGroup);
                currentEventsGroup = [event];
            }
        }
        if (currentEventsGroup.length > 0) {
            result.push(currentEventsGroup);
        }

        return result;
    }, [room.events]);

    return (
        <Box pos="relative" w="100%" h={height + "px"} backgroundColor={backgroundColor} role="region" aria-label={`${room.name} room schedule.`}>
            {useScroller ? (
                <Scroller height={height}>
                    <RoomTimelineContents
                        groupedEvents={groupedEvents}
                        room={room}
                        setScrollToEvent={setScrollToEvent}
                    />
                </Scroller>
            ) : (
                <RoomTimelineContents groupedEvents={groupedEvents} room={room} setScrollToEvent={setScrollToEvent} />
            )}
            {!hideTimeZoomButtons ? (
                <Box pos="absolute" top="0" right="0">
                    <TimelineZoomControls />
                </Box>
            ) : undefined}
        </Box>
    );
}

function RoomTimelineFetchWrapper({
    roomId,
    hideTimeZoomButtons = false,
    useScroller = true,
    height,
    backgroundColor,
    setScrollToEvent,
}: {
    roomId: string;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    backgroundColor?: string;
    setScrollToEvent?: (f: (event: Timeline_EventFragment) => void) => void;
}): JSX.Element {
    const roomResult = useTimeline_SelectRoomQuery({
        variables: {
            id: roomId,
        },
    });

    const eventInfo = useMemo(
        () =>
            roomResult.data?.Room_by_pk?.events.reduce(
                (x, event) => {
                    const startT = Date.parse(event.startTime);
                    const endT = startT + event.durationSeconds * 1000;
                    if (startT < x.roomEarliest) {
                        if (endT > x.roomLatest) {
                            return {
                                roomEarliest: startT,
                                roomLatest: endT,
                            };
                        } else {
                            return {
                                roomEarliest: startT,
                                roomLatest: x.roomLatest,
                            };
                        }
                    } else if (endT > x.roomLatest) {
                        return {
                            roomEarliest: x.roomEarliest,
                            roomLatest: endT,
                        };
                    }
                    return x;
                },
                { roomEarliest: Number.POSITIVE_INFINITY, roomLatest: Number.NEGATIVE_INFINITY }
            ),
        [roomResult.data?.Room_by_pk?.events]
    );

    return (
        <ApolloQueryWrapper<Timeline_SelectRoomQuery, unknown, Timeline_RoomFragment>
            queryResult={roomResult}
            getter={(x) => x.Room_by_pk}
        >
            {(room) => (
                <TimelineParameters
                    earliestEventStart={eventInfo?.roomEarliest ?? 0}
                    latestEventEnd={eventInfo?.roomLatest ?? 0}
                >
                    <RoomTimelineInner
                        room={room}
                        hideTimeZoomButtons={hideTimeZoomButtons}
                        useScroller={useScroller}
                        height={height}
                        backgroundColor={backgroundColor}
                        setScrollToEvent={setScrollToEvent}
                    />
                </TimelineParameters>
            )}
        </ApolloQueryWrapper>
    );
}

type Props = {
    room: string | Timeline_RoomFragment;
    hideTimeShiftButtons?: boolean;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    setScrollToEvent?: (f: (event: Timeline_EventFragment) => void) => void;
};

export default function RoomTimeline({ room, ...props }: Props): JSX.Element {
    if (typeof room === "string") {
        return <RoomTimelineFetchWrapper roomId={room} {...props} />;
    } else {
        return <RoomTimelineInner room={room} {...props} />;
    }
}
