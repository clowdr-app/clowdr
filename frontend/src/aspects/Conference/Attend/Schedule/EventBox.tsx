import { Box, Link, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Link as ReactLink } from "react-router-dom";
import type { Timeline_EventFragment } from "../../../../generated/graphql";
import { useConference } from "../../useConference";
import { useScrollerParams } from "./Scroller";
import useTimelineParameters from "./useTimelineParameters";

function EventBoxInner({
    events,
    durationSeconds,
    eventStartMs,
    roomName,
}: {
    events: ReadonlyArray<Timeline_EventFragment>;
    durationSeconds: number;
    eventStartMs: number;
    roomName: string;
}): JSX.Element {
    const conference = useConference();
    const timelineParams = useTimelineParameters();
    const scrollerParams = useScrollerParams();

    const offsetMs = eventStartMs - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const leftPx = offsetSeconds * scrollerParams.pixelsPerSecond;
    const widthPx = durationSeconds * scrollerParams.pixelsPerSecond;

    const event = events[0];

    const contents = useMemo(() => {
        return (
            <Link
                as={ReactLink}
                to={
                    `/conference/${conference.slug}` +
                    (event.contentGroup ? `/item/${event.contentGroup.id}` : `/room/${event.roomId}`)
                }
                title={event.contentGroup ? `View ${event.contentGroup.title}` : `Go to room ${roomName}`}
                textDecoration="none"
            >
                <Box overflow="hidden" w="100%" noOfLines={2}>
                    {event.contentGroup
                        ? events.length > 1
                            ? event.contentGroup.title
                            : `${event.contentGroup.title}`
                        : event.name}
                </Box>
            </Link>
        );
    }, [conference.slug, event.contentGroup, event.name, event.roomId, events.length, roomName]);

    const borderColour = useColorModeValue("gray.600", "gray.200");
    return (
        <Box
            position="absolute"
            left={leftPx}
            width={widthPx}
            height="100%"
            top={0}
            borderLeftColor={borderColour}
            borderRightColor={borderColour}
            borderLeftWidth={1}
            borderRightWidth={1}
            borderStyle="solid"
            p={2}
            boxSizing="border-box"
            fontSize="80%"
            lineHeight="120%"
            textAlign="center"
        >
            {contents}
        </Box>
    );
}

export default function EventBox({
    sortedEvents,
    roomName,
}: {
    sortedEvents: ReadonlyArray<Timeline_EventFragment>;
    roomName: string;
}): JSX.Element | null {
    const timelineParams = useTimelineParameters();

    const event = sortedEvents[0];
    const eventStartMs = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const durationSeconds = useMemo(() => sortedEvents.reduce((acc, e) => acc + e.durationSeconds, 0), [sortedEvents]);

    if (eventStartMs + durationSeconds * 1000 < timelineParams.startTimeMs) {
        return null;
    } else if (eventStartMs > timelineParams.startTimeMs + timelineParams.visibleTimeSpanSeconds * 1000) {
        return null;
    }

    return (
        <EventBoxInner
            roomName={roomName}
            events={sortedEvents}
            durationSeconds={durationSeconds}
            eventStartMs={eventStartMs}
        />
    );
}
