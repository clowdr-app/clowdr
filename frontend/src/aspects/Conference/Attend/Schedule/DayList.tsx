import { Button, ButtonGroup, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type {
    Timeline_ContentGroup_PartialInfoFragment,
    Timeline_EventFragment,
    Timeline_RoomFragment,
} from "../../../../generated/graphql";
import { roundDownToNearest } from "../../../Generic/MathUtils";
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
    const distinctDates = useMemo(() => {
        const result = new Map<number, FirstEventInfo>();
        for (const room of rooms) {
            for (const event of events.filter((x) => x.roomId === room.id)) {
                const startTime = Date.parse(event.startTime);
                const startDate = roundDownToNearest(startTime, 24 * 60 * 60 * 1000);

                const existingStartEv = result.get(startDate);
                if (existingStartEv) {
                    if (startTime < existingStartEv.startTime) {
                        result.set(startDate, { event, startTime });
                    }
                } else {
                    result.set(startDate, { event, startTime });
                }
            }
        }
        return [...result.entries()]
            .sort((x, y) => x[0] - y[0])
            .map((x) => [new Date(x[0]), x[1]] as [Date, FirstEventInfo]);
    }, [events, rooms]);

    const now = useRealTime(60000);
    const timelineParams = useTimelineParameters();
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
            {nowOffsetSeconds >= 0 ? (
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
            {distinctDates.map((date, idx) => (
                <Button
                    m={0}
                    key={date[0].toISOString()}
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
                    aria-label={`Scroll schedule to ${date[0].toLocaleString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        timeZone: "CET",
                    })}`}
                >
                    {idx === 0 ||
                    idx === distinctDates.length - 1 ||
                    (idx > 0 && date[0].getDay() < distinctDates[idx - 1][0].getDay()) ? (
                        <Text display="block" as="span" fontSize="0.7em" w="100%" textAlign="center" fontStyle="italic">
                            {date[0].toLocaleDateString(undefined, {
                                day: "2-digit",
                                month: "2-digit",
                                timeZone: "CET",
                            })}
                        </Text>
                    ) : undefined}
                    <Text w="100%" display="block" as="span" mt="3px">
                        {date[0].toLocaleString(undefined, { weekday: "long", timeZone: "CET" })}
                    </Text>
                </Button>
            ))}
        </ButtonGroup>
    );
}
