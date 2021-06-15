import { gql, useQuery } from "@apollo/client";
import { Flex, Heading, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { ItemEventFragment, ItemRoomEventFragment } from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { FAIcon } from "../../../Icons/FAIcon";
import { EventsTable } from "./EventsTable";

gql`
    fragment ItemRoomEvent on schedule_Event {
        startTime
        item {
            id
            title
        }
        exhibitionId
        id
        durationSeconds
        endTime
        name
        intendedRoomModeName
    }
`;

export function ItemEvents({ itemId, events }: { itemId: string; events: readonly ItemEventFragment[] }): JSX.Element {
    const thisPaperTable = useMemo(() => <EventsTable events={events} includeRoom={true} />, [events]);

    const rooms = useMemo(
        () => [
            ...events
                .reduce((acc, event) => {
                    const existing = acc.get(event.roomId);
                    if (!existing) {
                        acc.set(event.roomId, { roomName: event.room?.name ?? "Private room", events: [event] });
                    } else {
                        existing.events.push(event);
                    }
                    return acc;
                }, new Map<string, { roomName: string; events: ItemEventFragment[] }>())
                .entries(),
        ],
        [events]
    );

    return (
        <>
            <Flex pt={2} flexWrap="wrap" alignItems="flex-start" gridColumnGap="2%" overflowX="auto">
                <VStack flex="1 1 48%" alignItems="flex-start" maxW="max-content">
                    <Heading as="h4" size="md" textAlign="left" w="100%">
                        All times for this item
                    </Heading>
                    <Text my={3} w="auto" textAlign="left" p={0}>
                        <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                        Times are shown in your local timezone.
                    </Text>
                    {thisPaperTable}
                </VStack>
                <VStack mr={2} flex="1 1 48%" alignItems="flex-start" maxW="max-content">
                    <Heading as="h4" size="md" textAlign="left">
                        Events around this item
                    </Heading>
                    <Text my={3} w="auto" textAlign="left" p={0}>
                        <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                        Times are shown in your local timezone.
                    </Text>
                    {rooms.length > 1 ? (
                        <Tabs variant="enclosed" isLazy>
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
                    ) : rooms.length > 0 ? (
                        <RoomEventsSummary roomId={rooms[0][0]} events={rooms[0][1].events} thisItemId={itemId} />
                    ) : (
                        <Text>No events for this item</Text>
                    )}
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
    events: ItemEventFragment[];
}): JSX.Element {
    const queryString = useMemo(
        () => `
fragment ItemRoomEvent on schedule_Event {
    startTime
    item {
        id
        title
    }
    exhibitionId
    id
    durationSeconds
    endTime
    name
    intendedRoomModeName
}

query ItemEvent_RoomNearbyEvents {
    ${events.reduce((acc, event, index) => {
        return `${acc}

        Event_${index}_prior: schedule_Event(
            where: {
                roomId: { _eq: "${roomId}" }
                startTime: { _lt: "${event.startTime}" }
            }, 
            order_by: { startTime: desc }, 
            limit: 3
        ) {
            ...ItemRoomEvent
        }
        Event_${index}_post: schedule_Event(
            where: {
                roomId: { _eq: "${roomId}" }
                endTime: { _gt: "${new Date(
                    Date.parse(event.startTime) + 1000 * event.durationSeconds
                ).toISOString()}" }
            }, 
            order_by: { startTime: asc }, 
            limit: 3
        ) {
            ...ItemRoomEvent
        }`;
    }, "")}
}
`,
        [events, roomId]
    );
    const queryDocument = useMemo(() => gql(queryString), [queryString]);
    const query = useQuery(queryDocument, {});
    useQueryErrorToast(query.error, false, "ItemEvents:ItemEvents_RoomLocalisedSchedule");

    // console.log(query.data);
    const fullEventsList: (ItemEventFragment | ItemRoomEventFragment)[] = useMemo(
        () =>
            query.loading || !query.data
                ? []
                : R.uniqBy((x) => x.id, [
                      ...events.map((event) => ({
                          ...event,
                          item: {
                              id: "",
                              title: "This item",
                          },
                      })),
                      ...(Object.values(query.data) as any[][])
                          .reduce((acc, evs) => [...acc, ...evs], [])
                          .map((event) =>
                              event.item?.id === thisItemId
                                  ? {
                                        ...event,
                                        item: {
                                            id: "",
                                            title: "This item",
                                        },
                                    }
                                  : { ...event }
                          ),
                  ]),
        [events, query.data, query.loading, thisItemId]
    );

    const table = useMemo(() => <EventsTable events={fullEventsList} includeRoom={false} roomId={roomId} />, [
        fullEventsList,
        roomId,
    ]);

    return query.loading ? <Spinner label="Loading room schedule" /> : table;
}
