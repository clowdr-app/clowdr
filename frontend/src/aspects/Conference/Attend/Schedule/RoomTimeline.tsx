import { Box } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
    Timeline_ContentGroup_PartialInfoFragment,
    Timeline_EventFragment,
    Timeline_RoomFragment,
} from "../../../../generated/graphql";
import type { TimelineEvent, TimelineRoom } from "./DayList";
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
    room: TimelineRoom;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    backgroundColor?: string;
    setScrollToEvent?: (f: (event: TimelineEvent) => void) => void;
}): JSX.Element {
    const groupedEvents = useMemo(() => {
        const result: TimelineEvent[][] = [];
        const sortedEvents = [...room.events].sort((x, y) => Date.parse(x.startTime) - Date.parse(y.startTime));

        let currentEventsGroup: TimelineEvent[] = [];
        for (let idx = 0; idx < sortedEvents.length; idx++) {
            const event = sortedEvents[idx];
            const compareEvent =
                currentEventsGroup.length > 0 ? currentEventsGroup[currentEventsGroup.length - 1] : undefined;
            if (
                !compareEvent ||
                (compareEvent.contentGroup &&
                    compareEvent.contentGroup.id === event.contentGroup?.id &&
                    Math.abs(
                        Date.parse(event.startTime) -
                            (Date.parse(compareEvent.startTime) + compareEvent.durationSeconds * 1000)
                    ) <
                        1000 * 330)
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
        <Box
            pos="relative"
            w="100%"
            h={height + "px"}
            backgroundColor={backgroundColor}
            role="region"
            aria-label={`${room.name} room schedule.`}
        >
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
    room,
    hideTimeZoomButtons = false,
    useScroller = true,
    height,
    backgroundColor,
    setScrollToEvent,
    events,
    contentGroups,
}: {
    room: Timeline_RoomFragment;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    backgroundColor?: string;
    setScrollToEvent?: (f: (event: TimelineEvent) => void) => void;
    events: ReadonlyArray<Timeline_EventFragment>;
    contentGroups: ReadonlyArray<Timeline_ContentGroup_PartialInfoFragment>;
}): JSX.Element {
    const roomEvents = useMemo(() => {
        const result: TimelineEvent[] = [];

        events.forEach((event) => {
            if (event.roomId === room.id) {
                const contentGroup = event.contentGroupId
                    ? contentGroups.find((x) => x.id === event.contentGroupId)
                    : undefined;
                result.push({
                    ...event,
                    contentGroup,
                });
            }
        });

        return result;
    }, [contentGroups, events, room.id]);

    return room ? (
        <RoomTimelineInner
            room={{
                ...room,
                events: roomEvents,
            }}
            hideTimeZoomButtons={hideTimeZoomButtons}
            useScroller={useScroller}
            height={height}
            backgroundColor={backgroundColor}
            setScrollToEvent={setScrollToEvent}
        />
    ) : (
        <></>
    );
}

type Props = {
    room: Timeline_RoomFragment;
    hideTimeShiftButtons?: boolean;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    setScrollToEvent?: (f: (event: TimelineEvent) => void) => void;
    events: ReadonlyArray<Timeline_EventFragment>;
    contentGroups: ReadonlyArray<Timeline_ContentGroup_PartialInfoFragment>;
};

export default function RoomTimeline({ ...props }: Props): JSX.Element {
    return <RoomTimelineFetchWrapper {...props} />;
}
