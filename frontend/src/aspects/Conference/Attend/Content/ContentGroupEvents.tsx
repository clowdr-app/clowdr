import { gql, useQuery } from "@apollo/client";
import {
    Flex,
    Heading,
    Spinner,
    Tab,
    Table,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
} from "@chakra-ui/react";
import { formatDistanceStrict } from "date-fns";
import * as R from "ramda";
import React, { useMemo } from "react";
import type {
    ContentGroupEventFragment,
    ContentGroupEventsFragment,
    ContentGroupRoomEventFragment,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useConference } from "../../useConference";

gql`
    fragment ContentGroupRoomEvent on Event {
        startTime
        contentGroup {
            id
            title
        }
        id
        durationSeconds
        endTime
        name
        intendedRoomModeName
    }
`;

export function ContentGroupEvents({
    itemId,
    contentGroupEvents,
}: {
    itemId: string;
    contentGroupEvents: ContentGroupEventsFragment;
}): JSX.Element {
    const thisPaperTable = useMemo(() => <EventsTable events={contentGroupEvents.events} includeRoom={true} />, [
        contentGroupEvents.events,
    ]);

    const rooms = useMemo(
        () => [
            ...contentGroupEvents.events
                .reduce((acc, event) => {
                    const existing = acc.get(event.room.id);
                    if (!existing) {
                        acc.set(event.room.id, { roomName: event.room.name, events: [event] });
                    } else {
                        existing.events.push(event);
                    }
                    return acc;
                }, new Map<string, { roomName: string; events: ContentGroupEventFragment[] }>())
                .entries(),
        ],
        [contentGroupEvents.events]
    );

    return (
        <>
            <Text mt={3} w="auto" textAlign="left" p={0}>
                Times are shown in your local timezone.
            </Text>
            <Flex mt={2} flexWrap="wrap" alignItems="flex-start" gridColumnGap="2%">
                <VStack mt={2} mb={4} flex="1 1 49%" alignItems="flex-start" maxW="max-content">
                    <Heading as="h4" fontSize="md" textAlign="left" w="100%">
                        All times for this item
                    </Heading>
                    {thisPaperTable}
                </VStack>
                <VStack flex="1 1 49%" alignItems="flex-start" maxW="max-content">
                    <Tabs variant="solid-rounded" isLazy>
                        <TabList>
                            {rooms.map(([roomId, { roomName }]) => (
                                <Tab key={roomId}>{roomName}</Tab>
                            ))}
                        </TabList>

                        <TabPanels>
                            {rooms.map(([roomId, { events }]) => (
                                <TabPanel key={roomId} p={0} pt={2}>
                                    <RoomEventsSummary roomId={roomId} events={events} thisItemId={itemId} />
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </Tabs>
                </VStack>
            </Flex>
        </>
    );
}

function RoomEventsSummary({
    roomId,
    thisItemId,
    events,
}: {
    roomId: string;
    thisItemId: string;
    events: ContentGroupEventFragment[];
}): JSX.Element {
    const queryString = useMemo(
        () => `
fragment ContentGroupRoomEvent on Event {
    startTime
    contentGroup {
        id
        title
    }
    id
    durationSeconds
    endTime
    name
    intendedRoomModeName
}

query ContentGroupEvent_RoomNearbyEvents {
    ${events.reduce((acc, event, index) => {
        return `${acc}

        Event_${index}_prior: Event(
            where: {
                roomId: { _eq: "${roomId}" }
                startTime: { _lt: "${event.startTime}" }
            }, 
            order_by: { startTime: desc }, 
            limit: 3
        ) {
            ...ContentGroupRoomEvent
        }
        Event_${index}_post: Event(
            where: {
                roomId: { _eq: "${roomId}" }
                endTime: { _gt: "${new Date(
                    Date.parse(event.startTime) + 1000 * event.durationSeconds
                ).toISOString()}" }
            }, 
            order_by: { startTime: asc }, 
            limit: 3
        ) {
            ...ContentGroupRoomEvent
        }`;
    }, "")}
}
`,
        [events, roomId]
    );
    const queryDocument = useMemo(() => gql(queryString), [queryString]);
    const query = useQuery(queryDocument, {});
    useQueryErrorToast(query.error, false, "ContentGroupEvents:ContentGroupEvents_RoomLocalisedSchedule");

    console.log(query.data);
    const fullEventsList: (ContentGroupEventFragment | ContentGroupRoomEventFragment)[] = useMemo(
        () =>
            query.loading || !query.data
                ? []
                : R.uniqBy((x) => x.id, [
                      ...events.map((event) => ({
                          ...event,
                          contentGroup: {
                              id: "",
                              title: "This item",
                          },
                      })),
                      ...(Object.values(query.data) as any[][])
                          .reduce((acc, evs) => [...acc, ...evs], [])
                          .map((event) =>
                              event.contentGroup?.id === thisItemId
                                  ? {
                                        ...event,
                                        contentGroup: {
                                            id: "",
                                            title: "This item",
                                        },
                                    }
                                  : { ...event }
                          ),
                  ]),
        [events, query.data, query.loading, thisItemId]
    );

    const table = useMemo(() => <EventsTable events={fullEventsList} includeRoom={false} />, [fullEventsList]);

    return query.loading ? <Spinner label="Loading room schedule" /> : table;
}

function EventsTable({
    events,
    includeRoom,
}: {
    events: readonly (ContentGroupEventFragment | ContentGroupRoomEventFragment)[];
    includeRoom: boolean;
}): JSX.Element {
    return (
        <Table m={0} textAlign="left" variant="striped" w="auto" size="sm" colorScheme="blue">
            <Thead>
                <Tr>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Duration</Th>
                    {includeRoom ? <Th>Room</Th> : undefined}
                    {!includeRoom ? <Th>Item</Th> : undefined}
                    <Th>Event name</Th>
                </Tr>
            </Thead>
            <Tbody>
                {events.length > 0 ? (
                    R.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime), events).map((event) => (
                        <Event key={event.id} contentGroupEvent={event} includeRoom={includeRoom} />
                    ))
                ) : (
                    <>No events.</>
                )}
            </Tbody>
        </Table>
    );
}

function Event({
    contentGroupEvent,
    includeRoom,
}: {
    contentGroupEvent: ContentGroupEventFragment | ContentGroupRoomEventFragment;
    includeRoom: boolean;
}): JSX.Element {
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

    return (
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
            {includeRoom ? (
                "room" in contentGroupEvent && contentGroupEvent.room ? (
                    <Td>
                        <LinkButton
                            to={`/conference/${conference.slug}/room/${contentGroupEvent.room.id}`}
                            aria-label={`Go to room: ${contentGroupEvent.room.name}`}
                            whiteSpace="normal"
                            variant="outline"
                            size="sm"
                            maxH="unset"
                            h="auto"
                            colorScheme="blue"
                            linkProps={{ maxH: "unset" }}
                        >
                            {contentGroupEvent.room.name}
                        </LinkButton>
                    </Td>
                ) : (
                    <Td>No room</Td>
                )
            ) : undefined}
            {!includeRoom ? (
                "contentGroup" in contentGroupEvent && contentGroupEvent.contentGroup ? (
                    <Td>
                        {contentGroupEvent.contentGroup.id !== "" ? (
                            <LinkButton
                                to={`/conference/${conference.slug}/item/${contentGroupEvent.contentGroup.id}`}
                                aria-label={`Go to item: ${contentGroupEvent.contentGroup.title}`}
                                whiteSpace="normal"
                                variant="outline"
                                size="sm"
                                maxH="unset"
                                h="auto"
                                colorScheme="blue"
                                linkProps={{ maxH: "unset" }}
                            >
                                {contentGroupEvent.contentGroup.title}
                            </LinkButton>
                        ) : (
                            contentGroupEvent.contentGroup.title
                        )}
                    </Td>
                ) : (
                    <Td>No item</Td>
                )
            ) : undefined}
            <Td>
                <Text>{contentGroupEvent.name}</Text>
            </Td>
        </Tr>
    );
}
