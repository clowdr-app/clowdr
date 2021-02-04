import { Button, ButtonGroup, Text } from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { useMemo } from "react";
import type {
    Timeline_ContentGroup_PartialInfoFragment,
    Timeline_EventFragment,
    Timeline_RoomFragment,
} from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import { useTimelineParameters } from "./useTimelineParameters";

type FirstEventInfo = {
    event: Timeline_EventFragment;
    startTime: number;
};

export interface TimelineEvent extends Timeline_EventFragment {
    contentGroup?: Timeline_ContentGroup_PartialInfoFragment;
}

export interface TimelineRoom extends Timeline_RoomFragment {
    events: TimelineEvent[];
}

export default function DayList({
    rooms,
    events,
    scrollToEvent,
    scrollToNow,
}: {
    rooms: readonly Timeline_RoomFragment[];
    events: readonly Timeline_EventFragment[];
    scrollToEvent: (event: Timeline_EventFragment) => void;
    scrollToNow: () => void;
}): JSX.Element {
    const timelineParams = useTimelineParameters();

    const distinctDates = useMemo(() => {
        const result = new Map<number, FirstEventInfo>();
        for (const room of rooms) {
            for (const event of events.filter((x) => x.roomId === room.id)) {
                // TODO: How to handle multi-year calendars?
                const startDate = DateTime.fromISO(event.startTime).setZone(timelineParams.timezone);
                const day = startDate.startOf("day");

                const existingStartEv = result.get(day.toMillis());
                if (existingStartEv) {
                    if (startDate.toMillis() < existingStartEv.startTime) {
                        result.set(day.toMillis(), { event, startTime: startDate.toMillis() });
                    }
                } else {
                    result.set(day.toMillis(), { event, startTime: startDate.toMillis() });
                }
            }
        }
        return [...result.entries()]
            .sort((x, y) => x[0] - y[0])
            .map(
                (x) => [DateTime.fromMillis(x[0]).setZone(timelineParams.timezone), x[1]] as [DateTime, FirstEventInfo]
            );
    }, [events, rooms, timelineParams.timezone]);

    const now = useRealTime(60000);
    const nowOffsetMs = now - timelineParams.earliestMs;
    const nowOffsetSeconds = nowOffsetMs / 1000;

    return (
        <ButtonGroup
            role="navigation"
            w="auto"
            h="auto"
            spacing={0}
            flexWrap="wrap"
            justifyContent="stretch"
            borderTopLeftRadius={5}
            borderTopRightRadius={5}
            overflow="hidden"
        >
            {nowOffsetSeconds >= 0 && nowOffsetSeconds < timelineParams.fullTimeSpanSeconds ? (
                <Button
                    m={0}
                    borderRadius={0}
                    colorScheme="red"
                    borderWidth={1}
                    borderStyle="solid"
                    size="lg"
                    flex="1 1 auto"
                    position="relative"
                    height="auto"
                    p={3}
                    flexDirection="column"
                    justifyContent="flex-end"
                    onClick={() => {
                        scrollToNow();
                    }}
                    aria-label="Scroll schedule to now"
                >
                    <Text w="100%" display="block" as="span" mt="3px">
                        Now
                    </Text>
                </Button>
            ) : undefined}
            {distinctDates.map((date, idx) => {
                const date0 = date[0];
                return (
                    <Button
                        m={0}
                        key={date0.toISO()}
                        borderRadius={0}
                        colorScheme="blue"
                        borderWidth={1}
                        borderStyle="solid"
                        size="lg"
                        flex="1 1 auto"
                        position="relative"
                        height="auto"
                        p={3}
                        flexDirection="column"
                        justifyContent="flex-end"
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
                        {idx === 0 ||
                        idx === distinctDates.length - 1 ||
                        (idx > 0 && date0.weekNumber !== distinctDates[idx - 1][0].weekNumber) ? (
                            <Text
                                display="block"
                                as="span"
                                fontSize="0.7em"
                                w="100%"
                                textAlign="center"
                                fontStyle="italic"
                            >
                                {date0.toLocaleString({
                                    day: "2-digit",
                                    month: "2-digit",
                                })}
                            </Text>
                        ) : undefined}
                        <Text w="100%" display="block" as="span" mt="3px">
                            {date0.toLocaleString({ weekday: "long" })}
                        </Text>
                    </Button>
                );
            })}
        </ButtonGroup>
    );
}
