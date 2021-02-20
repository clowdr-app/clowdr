import { Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { formatDistanceStrict } from "date-fns";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { ContentGroupEventFragment, ContentGroupEventsFragment } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { useConference } from "../../useConference";

export function ContentGroupEvents({
    contentGroupEvents,
}: {
    contentGroupEvents: ContentGroupEventsFragment;
}): JSX.Element {
    return (
        <>
            <Text mt={3} w="auto" textAlign="left" p={0}>
                Times are shown in your local timezone.
            </Text>
            <Table mt={0} textAlign="left" my={5} variant="striped" w="auto" size="sm">
                <Thead>
                    <Tr>
                        <Th>Date</Th>
                        <Th>Time</Th>
                        <Th>Duration</Th>
                        <Th>Room</Th>
                        <Th>Event name</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {contentGroupEvents.events.length > 0 ? (
                        R.sort(
                            (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
                            contentGroupEvents.events
                        ).map((event) => <Event key={event.id} contentGroupEvent={event} />)
                    ) : (
                        <>No events for this item.</>
                    )}
                </Tbody>
            </Table>
        </>
    );
}

function Event({ contentGroupEvent }: { contentGroupEvent: ContentGroupEventFragment }): JSX.Element {
    const conference = useConference();
    const now = useRealTime(60000);

    const startMillis = useMemo(() => Date.parse(contentGroupEvent.startTime), [contentGroupEvent.startTime]);
    const endMillis = useMemo(() => Date.parse(contentGroupEvent.endTime), [contentGroupEvent.endTime]);

    const startDate = useMemo(() => {
        return new Date(startMillis).toLocaleString(undefined, {
            day: "2-digit",
            month: "2-digit",
        });
    }, [startMillis]);

    const startTime = useMemo(() => {
        return new Date(startMillis).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
    }, [startMillis]);

    const duration = useMemo(() => {
        return formatDistanceStrict(new Date(startMillis), new Date(endMillis));
    }, [endMillis, startMillis]);

    const happeningSoonOrNow = useMemo(() => {
        return now < endMillis && now > startMillis - 5 * 60 * 1000;
    }, [endMillis, now, startMillis]);

    return contentGroupEvent.room ? (
        <Tr p={2} my={2} w="auto" backgroundColor={happeningSoonOrNow ? "green.500" : "initial"}>
            <Td>
                <Text>{startDate}</Text>
            </Td>
            <Td>
                <Text>{startTime}</Text>
            </Td>
            <Td>
                <Text>{duration}</Text>
            </Td>
            <Td>
                <LinkButton
                    to={`/conference/${conference.slug}/room/${contentGroupEvent.room.id}`}
                    aria-label={`Go to room ${contentGroupEvent.room.name}`}
                    whiteSpace="normal"
                    variant="outline"
                    size="sm"
                >
                    {contentGroupEvent.room.name}
                </LinkButton>
            </Td>
            <Td>
                <Text>{contentGroupEvent.name}</Text>
            </Td>
        </Tr>
    ) : (
        <></>
    );
}
