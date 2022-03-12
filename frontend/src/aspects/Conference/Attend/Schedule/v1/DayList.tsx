import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, HStack, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { Fragment, useMemo } from "react";
import type {
    ProgramPersonDataFragment,
    Schedule_EventSummaryFragment,
    Schedule_ItemFieldsFragment,
    Schedule_RoomSummaryFragment,
} from "../../../../../generated/graphql";
import useTimelineParameters from "./useTimelineParameters";

type FirstEventInfo = {
    event: Schedule_EventSummaryFragment;
    scheduledStartTime: number;
};

export interface TimelineEvent extends Schedule_EventSummaryFragment {
    item?: Schedule_ItemFieldsFragment;
    itemPeople?: readonly ProgramPersonDataFragment[];
    exhibitionPeople?: readonly ProgramPersonDataFragment[];
}

export interface TimelineRoom {
    room?: Schedule_RoomSummaryFragment;
    events: TimelineEvent[];
}

export default function DayList({
    rooms,
    events,
    scrollToEvent,
    scrollToNow,
}: {
    rooms: readonly Schedule_RoomSummaryFragment[];
    events: readonly Schedule_EventSummaryFragment[];
    scrollToEvent: (event: Schedule_EventSummaryFragment) => void;
    scrollToNow: { f: () => void } | null;
}): JSX.Element {
    const timelineParams = useTimelineParameters();

    const distinctDates = useMemo(() => {
        const result = new Map<number, { roomPriority: number; event: FirstEventInfo }>();
        for (const room of rooms) {
            for (const event of events.filter((x) => x.roomId === room.id)) {
                // TODO: How to handle multi-year calendars?
                const startDate = DateTime.fromISO(event.scheduledStartTime).setZone(timelineParams.timezone);
                const day = startDate.startOf("day");

                const existingStartEv = result.get(day.toMillis());
                if (existingStartEv) {
                    if (
                        startDate.toMillis() < existingStartEv.event.scheduledStartTime ||
                        (startDate.toMillis() === existingStartEv.event.scheduledStartTime &&
                            room.priority < existingStartEv.roomPriority)
                    ) {
                        result.set(day.toMillis(), {
                            roomPriority: room.priority,
                            event: { event, scheduledStartTime: startDate.toMillis() },
                        });
                    }
                } else {
                    result.set(day.toMillis(), {
                        roomPriority: room.priority,
                        event: { event, scheduledStartTime: startDate.toMillis() },
                    });
                }
            }
        }
        return [...result.entries()]
            .sort((x, y) => x[0] - y[0])
            .map(
                (x) =>
                    [DateTime.fromMillis(x[0]).setZone(timelineParams.timezone), x[1].event] as [
                        DateTime,
                        FirstEventInfo
                    ]
            );
    }, [events, rooms, timelineParams.timezone]);
    const todayMillis = useMemo(() => DateTime.now().startOf("day").toMillis(), []);
    const todayFEI = useMemo(
        () => distinctDates.find(([time, _event]) => time.toMillis() === todayMillis),
        [distinctDates, todayMillis]
    );

    return (
        <HStack zIndex={1000} mb={2} mr={2}>
            {scrollToNow ? (
                <Button
                    m={0}
                    borderRadius={0}
                    colorScheme="LiveActionButton"
                    onClick={() => {
                        scrollToNow?.f();
                    }}
                    aria-label="Scroll schedule to now"
                    size="sm"
                >
                    Now
                </Button>
            ) : undefined}
            <Menu>
                <MenuButton as={Button} size="sm" colorScheme="PrimaryActionButton" rightIcon={<ChevronDownIcon />}>
                    Jump to day
                </MenuButton>
                <MenuList maxH="30vh" overflow="auto">
                    {todayFEI ? (
                        <>
                            <MenuItem
                                m={0}
                                key="today"
                                onClick={() => {
                                    scrollToEvent(todayFEI[1].event);
                                }}
                                // TODO: Set the timezone for the conference
                                aria-label="Scroll schedule to today"
                            >
                                <Text as="span" fontStyle="italic" mr={3} fontSize="75%">
                                    {todayFEI[0].toLocaleString({
                                        day: "2-digit",
                                        month: "2-digit",
                                    })}
                                </Text>
                                <Text as="span" fontWeight="semibold">
                                    Today
                                </Text>
                            </MenuItem>
                            <MenuDivider />
                        </>
                    ) : undefined}
                    {distinctDates.map((date, idx) => {
                        const date0 = date[0];
                        return (
                            <Fragment key={date0.toISO()}>
                                {idx > 0 && date0.weekNumber !== distinctDates[idx - 1][0].weekNumber ? (
                                    <MenuDivider />
                                ) : undefined}
                                <MenuItem
                                    m={0}
                                    onClick={() => {
                                        scrollToEvent(date[1].event);
                                    }}
                                    // TODO: Set the timezone for the conference
                                    aria-label={`Scroll schedule to ${date0.toLocaleString({
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}`}
                                >
                                    <Text as="span" fontStyle="italic" mr={3} fontSize="80%">
                                        {date0.toLocaleString({
                                            day: "2-digit",
                                            month: "2-digit",
                                        })}
                                    </Text>
                                    <Text as="span">{date0.toLocaleString({ weekday: "long" })}</Text>
                                </MenuItem>
                            </Fragment>
                        );
                    })}
                </MenuList>
            </Menu>
        </HStack>
    );
}
