import { Box, HStack, Text } from "@chakra-ui/react";
import { formatDistanceStrict, formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ContentGroupEventFragment, ContentGroupEventsFragment } from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import { useConference } from "../../useConference";

export function ContentGroupEvents({
    contentGroupEvents,
}: {
    contentGroupEvents: ContentGroupEventsFragment;
}): JSX.Element {
    return (
        <Box textAlign="left" my={5}>
            {R.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime), contentGroupEvents.events).map(
                (event) => (
                    <Event key={event.id} contentGroupEvent={event} />
                )
            )}
        </Box>
    );
}

function Event({ contentGroupEvent }: { contentGroupEvent: ContentGroupEventFragment }): JSX.Element {
    const conference = useConference();
    const now = useRealTime(60000);

    const startMillis = useMemo(() => Date.parse(contentGroupEvent.startTime), [contentGroupEvent.startTime]);
    const endMillis = useMemo(() => Date.parse(contentGroupEvent.endTime), [contentGroupEvent.endTime]);

    const startTime = useMemo(() => {
        return formatRelative(new Date(startMillis), new Date(now));
    }, [now, startMillis]);

    const duration = useMemo(() => {
        return formatDistanceStrict(new Date(startMillis), new Date(endMillis));
    }, [endMillis, startMillis]);

    const happeningSoonOrNow = useMemo(() => {
        return now < endMillis && now > startMillis - 5 * 60 * 1000;
    }, [endMillis, now, startMillis]);

    return (
        <Box
            maxW="sm"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={2}
            my={2}
            backgroundColor={happeningSoonOrNow ? "green.500" : "initial"}
        >
            <HStack>
                <Box minWidth="30%" width="30%">
                    <Link to={`/conference/${conference.slug}/room/${contentGroupEvent.room.id}`}>
                        {contentGroupEvent.room.name}
                    </Link>
                </Box>
                <Box>
                    <Text fontWeight="bold" aria-label="Event">
                        {contentGroupEvent.name}
                    </Text>

                    <Text>
                        <span aria-label="Start time">{startTime}</span> <span aria-label="Duration">({duration})</span>
                    </Text>
                </Box>
            </HStack>
        </Box>
    );
}
