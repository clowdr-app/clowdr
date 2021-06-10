import { Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type {
    Schedule_EventSummaryFragment,
    Schedule_ItemElementsFragment,
    Schedule_RoomSummaryFragment,
    Schedule_TagFragment,
} from "../../../../generated/graphql";
import type { TimelineEvent, TimelineRoom } from "./DayList";
import EventBox from "./EventBox";

function RoomTimelineContents({
    groupedEvents,
    room,
    scrollToEventCbs,
    tags,
}: {
    groupedEvents: Schedule_EventSummaryFragment[][];
    room: Schedule_RoomSummaryFragment;
    scrollToEventCbs: Map<string, () => void>;
    tags: readonly Schedule_TagFragment[];
}): JSX.Element {
    const eventBoxes = useMemo(
        () =>
            groupedEvents.map((events) => (
                <EventBox
                    roomName={room.name}
                    key={events[0].id}
                    sortedEvents={events}
                    scrollToEventCbs={scrollToEventCbs}
                    tags={tags}
                />
            )),
        [groupedEvents, room.name, scrollToEventCbs, tags]
    );
    return <>{eventBoxes}</>;
}

function RoomTimelineInner({
    room,
    width = 50,
    backgroundColor,
    scrollToEventCbs,
    tags,
}: {
    room: TimelineRoom;
    width?: number;
    backgroundColor?: string;
    scrollToEventCbs: Map<string, () => void>;
    tags: readonly Schedule_TagFragment[];
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
                (compareEvent.item &&
                    compareEvent.item.id === event.item?.id &&
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
            h="100%"
            w={width + "px"}
            backgroundColor={backgroundColor}
            role="region"
            aria-label={`${room.name} room schedule.`}
        >
            <RoomTimelineContents
                groupedEvents={groupedEvents}
                room={room}
                scrollToEventCbs={scrollToEventCbs}
                tags={tags}
            />
        </Box>
    );
}

function RoomTimelineWrapper({
    room,
    width,
    backgroundColor,
    scrollToEventCbs,
    events,
    items,
    tags,
}: {
    room: Schedule_RoomSummaryFragment;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    width?: number;
    backgroundColor?: string;
    scrollToEventCbs: Map<string, () => void>;
    events: ReadonlyArray<Schedule_EventSummaryFragment>;
    items: ReadonlyArray<Schedule_ItemElementsFragment>;
    tags: readonly Schedule_TagFragment[];
}): JSX.Element {
    const roomEvents = useMemo(() => {
        const result: TimelineEvent[] = [];

        events.forEach((event) => {
            if (event.roomId === room.id) {
                const item = event.itemId ? items.find((x) => x.id === event.itemId) : undefined;
                result.push({
                    ...event,
                    item,
                });
            }
        });

        return result;
    }, [items, events, room.id]);

    return room ? (
        <RoomTimelineInner
            room={{
                ...room,
                events: roomEvents,
            }}
            width={width}
            backgroundColor={backgroundColor}
            scrollToEventCbs={scrollToEventCbs}
            tags={tags}
        />
    ) : (
        <></>
    );
}

type Props = {
    room: Schedule_RoomSummaryFragment;
    hideTimeShiftButtons?: boolean;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    width?: number;
    scrollToEventCbs: Map<string, () => void>;
    events: ReadonlyArray<Schedule_EventSummaryFragment>;
    items: ReadonlyArray<Schedule_ItemElementsFragment>;
    tags: ReadonlyArray<Schedule_TagFragment>;
};

export default function RoomTimeline({ ...props }: Props): JSX.Element {
    return <RoomTimelineWrapper {...props} />;
}
