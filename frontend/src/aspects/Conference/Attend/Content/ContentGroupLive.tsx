import { Button, Text, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import type { ContentGroupEventFragment, ContentGroupEventsFragment } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";

export function ContentGroupLive({
    contentGroupEvents,
}: {
    contentGroupEvents: ContentGroupEventsFragment;
}): JSX.Element {
    const [liveEvents, setLiveEvents] = useState<ContentGroupEventFragment[] | null>(null);
    const computeLiveEvent = useCallback(() => {
        const now = Date.now();
        const currentEvents = contentGroupEvents.events.filter(
            (event) => Date.parse(event.startTime) <= now && now <= Date.parse(event.endTime)
        );
        setLiveEvents(currentEvents);
    }, [contentGroupEvents.events]);
    usePolling(computeLiveEvent, 5000, true);
    useEffect(() => computeLiveEvent(), [computeLiveEvent]);

    return (
        <VStack>
            {liveEvents?.map((event) => (
                <Button key={event.id} size="lg" colorScheme="red">
                    <VStack spacing={0}>
                        <Text>Live now</Text>
                        <Text mt={0} fontSize="sm">
                            {event.room.name}
                        </Text>
                    </VStack>
                </Button>
            ))}
        </VStack>
    );
}
