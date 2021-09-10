import { Box } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type {
    ProgramPersonDataFragment,
    Schedule_EventSummaryFragment,
    Schedule_ItemFieldsFragment,
    Schedule_ProgramPersonFragment,
    Schedule_RoomSummaryFragment,
    Schedule_TagFragment,
} from "../../../../../generated/graphql";
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
    people,
}: {
    room: Schedule_RoomSummaryFragment;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    width?: number;
    backgroundColor?: string;
    scrollToEventCbs: Map<string, () => void>;
    events: ReadonlyArray<Schedule_EventSummaryFragment>;
    items: ReadonlyArray<Schedule_ItemFieldsFragment>;
    tags: readonly Schedule_TagFragment[];
    people: readonly Schedule_ProgramPersonFragment[];
}): JSX.Element {
    const roomEvents = useMemo(() => {
        const result: TimelineEvent[] = [];

        events.forEach((event) => {
            if (event.roomId === room.id) {
                const item = event.itemId ? items.find((x) => x.id === event.itemId) : undefined;
                const exhibitionItemPeople = R.uniqBy(
                    (x) => x.personId,
                    items
                        .filter((x) => x.itemExhibitions.some((y) => y.exhibitionId === event.exhibitionId))
                        .flatMap((x) => x.itemPeople)
                );
                result.push({
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
                    exhibitionPeople: exhibitionItemPeople?.length
                        ? people.reduce<ProgramPersonDataFragment[]>((acc, person) => {
                              const itemPerson = exhibitionItemPeople.find(
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
                });
            }
        });

        return result;
    }, [people, items, events, room.id]);

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
    items: ReadonlyArray<Schedule_ItemFieldsFragment>;
    tags: ReadonlyArray<Schedule_TagFragment>;
    people: readonly Schedule_ProgramPersonFragment[];
};

export default function RoomTimeline({ ...props }: Props): JSX.Element {
    return <RoomTimelineWrapper {...props} />;
}
