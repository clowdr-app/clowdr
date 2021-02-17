import { Text, VStack } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useState } from "react";
import {
    ContentGroupDataFragment,
    ContentGroupEventFragment,
    ContentGroupEventsFragment,
    RoomMode_Enum,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import usePolling from "../../../Generic/usePolling";
import { useConference } from "../../useConference";

function eventType(eventType: RoomMode_Enum): string {
    switch (eventType) {
        case RoomMode_Enum.Breakout:
            return "breakout";
        case RoomMode_Enum.Prerecorded:
            return "pre-recorded video";
        case RoomMode_Enum.Presentation:
            return "presentation";
        case RoomMode_Enum.QAndA:
            return "Q&A session";
        case RoomMode_Enum.Zoom:
            return "Zoom meeting";
    }
}

export function ContentGroupLive({
    contentGroupData,
}: {
    contentGroupData: ContentGroupDataFragment & ContentGroupEventsFragment;
}): JSX.Element {
    const [liveEvents, setLiveEvents] = useState<ContentGroupEventFragment[] | null>(null);
    const [nextEvent, setNextEvent] = useState<ContentGroupEventFragment | null>(null);
    const [now, setNow] = useState<number>(Date.now());
    const computeLiveEvent = useCallback(() => {
        const now = Date.now();
        const currentEvents = contentGroupData.events.filter(
            (event) => Date.parse(event.startTime) <= now && now <= Date.parse(event.endTime)
        );
        setLiveEvents(currentEvents);

        const nextEvent = R.sortWith(
            [R.ascend(R.prop("startTime"))],
            contentGroupData.events.filter((event) => Date.parse(event.startTime) > now)
        );
        setNextEvent(nextEvent.length > 0 ? nextEvent[0] : null);
        setNow(now);
    }, [contentGroupData.events]);
    usePolling(computeLiveEvent, 5000, true);
    useEffect(() => computeLiveEvent(), [computeLiveEvent]);

    // const currentRoom = useMemo(
    //     () =>
    //         contentGroupData.chat?.room && contentGroupData.chat?.room.length > 0
    //             ? contentGroupData.chat?.room[0]
    //             : undefined,
    //     [contentGroupData.chat?.room]
    // );

    const conference = useConference();

    return (
        <VStack alignItems="stretch">
            {liveEvents?.map((event) => (
                <LinkButton
                    width="100%"
                    to={`/conference/${conference.slug}/room/${event.room.id}`}
                    key={event.id}
                    size="lg"
                    colorScheme="red"
                    height="auto"
                    py={2}
                >
                    <VStack spacing={0}>
                        <Text>Live now ({eventType(event.intendedRoomModeName)})</Text>
                        <Text mt={0} fontSize="sm">
                            {event.room.name}
                        </Text>
                    </VStack>
                </LinkButton>
            ))}
            {nextEvent ? (
                <LinkButton
                    width="100%"
                    to={`/conference/${conference.slug}/room/${nextEvent.room.id}`}
                    size="lg"
                    colorScheme="teal"
                    height="auto"
                    py={2}
                >
                    <VStack spacing={0}>
                        <Text>Next event ({eventType(nextEvent.intendedRoomModeName)})</Text>
                        <Text mt={0} fontSize="sm">
                            {formatRelative(Date.parse(nextEvent.startTime), now)}
                        </Text>
                    </VStack>
                </LinkButton>
            ) : (
                <></>
            )}
            {/* {(!liveEvents || liveEvents.length === 0) && currentRoom ? (
                <LinkButton
                    width="100%"
                    to={`/conference/${conference.slug}/room/${currentRoom.id}`}
                    size="lg"
                    colorScheme="blue"
                    height="auto"
                    py={2}
                >
                    <VStack spacing={0}>
                        <Text>Ongoing breakout room</Text>
                        <Text mt={0} fontSize="sm">
                            {currentRoom.name}
                        </Text>
                        <PageCountText path={`/conference/${conference.slug}/room/${currentRoom.id}`} />
                    </VStack>
                </LinkButton>
            ) : undefined} */}
        </VStack>
    );
}
