import { chakra, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { formatDistanceStrict } from "date-fns";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import type { ItemEventFragment, ItemRoomEventFragment } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { useConference } from "../../useConference";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import StarEventButton from "../Schedule/StarEventButton";

export function EventsTable({
    roomId,
    events,
    includeRoom,
}: {
    roomId?: string;
    events: readonly (ItemEventFragment | ItemRoomEventFragment)[];
    includeRoom: boolean;
}): JSX.Element {
    const conference = useConference();
    const maybeRegistrant = useMaybeCurrentRegistrant();
    return (
        <VStack spacing={2} alignItems="flex-start">
            {roomId ? (
                <LinkButton colorScheme="blue" to={`/conference/${conference.slug}/room/${roomId}`}>
                    Go to room
                </LinkButton>
            ) : undefined}
            <Table m={0} textAlign="left" variant="striped" w="auto" size="sm" colorScheme="blue">
                <Thead>
                    <Tr>
                        {maybeRegistrant ? <Th p={0}></Th> : undefined}
                        <Th px={3}>Date</Th>
                        <Th px={1}>Time</Th>
                        <Th>Duration</Th>
                        {includeRoom ? <Th>Room</Th> : undefined}
                        {!includeRoom ? <Th>Item</Th> : undefined}
                        <Th>Event name</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {events.length > 0 ? (
                        R.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime), events).map((event) => (
                            <Event key={event.id} itemEvent={event} includeRoom={includeRoom} />
                        ))
                    ) : (
                        <>No events.</>
                    )}
                </Tbody>
            </Table>
        </VStack>
    );
}

function Event({
    itemEvent,
    includeRoom,
}: {
    itemEvent: ItemEventFragment | ItemRoomEventFragment;
    includeRoom: boolean;
}): JSX.Element {
    const conference = useConference();
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const now = useRealTime(60000);

    const startMillis = useMemo(() => Date.parse(itemEvent.startTime), [itemEvent.startTime]);
    const endMillis = useMemo(() => Date.parse(itemEvent.endTime), [itemEvent.endTime]);

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
            {maybeRegistrant ? (
                <Td p={0} pl={1}>
                    <StarEventButton eventIds={itemEvent.id} />
                </Td>
            ) : undefined}
            <Td px={3}>
                <Text>{startDate}</Text>
            </Td>
            <Td px={1}>
                <Text>{startTime}</Text>
            </Td>
            <Td>
                <Text>{duration}</Text>
            </Td>
            {includeRoom ? (
                "room" in itemEvent && itemEvent.room ? (
                    <Td>
                        <LinkButton
                            to={`/conference/${conference.slug}/room/${itemEvent.roomId}`}
                            aria-label={`Go to room: ${itemEvent.room?.name ?? "private room"}`}
                            whiteSpace="normal"
                            variant="outline"
                            size="sm"
                            maxH="unset"
                            h="auto"
                            py={1}
                            colorScheme="blue"
                            linkProps={{ maxH: "unset" }}
                        >
                            <Twemoji className="twemoji" text={itemEvent.room?.name ?? "Private room"} />
                        </LinkButton>
                    </Td>
                ) : (
                    <Td>No room</Td>
                )
            ) : undefined}
            {!includeRoom ? (
                "item" in itemEvent && itemEvent.item ? (
                    <Td>
                        {itemEvent.item.id !== "" ? (
                            <LinkButton
                                to={`/conference/${conference.slug}/item/${itemEvent.item.id}`}
                                aria-label={`Go to item: ${itemEvent.item.title}`}
                                whiteSpace="normal"
                                variant="outline"
                                size="sm"
                                maxH="unset"
                                h="auto"
                                py={1}
                                colorScheme="blue"
                                linkProps={{ maxH: "unset" }}
                            >
                                <Twemoji className="twemoji" text={itemEvent.item.title} />
                            </LinkButton>
                        ) : "exhibitionId" in itemEvent && itemEvent.exhibitionId ? (
                            <>
                                <Text mr={2} pb={2}>
                                    {itemEvent.item.title} is part of the exhibition at this event.
                                </Text>
                                <LinkButton
                                    to={`/conference/${conference.slug}/exhibition/${itemEvent.exhibitionId}`}
                                    aria-label={"Go to exhibition"}
                                    whiteSpace="normal"
                                    variant="outline"
                                    size="sm"
                                    maxH="unset"
                                    h="auto"
                                    py={1}
                                    colorScheme="blue"
                                    linkProps={{ maxH: "unset" }}
                                >
                                    View exhibition
                                </LinkButton>
                            </>
                        ) : (
                            <chakra.span fontWeight="bold" fontStyle="italic">
                                <Twemoji className="twemoji" text={itemEvent.item.title} />
                            </chakra.span>
                        )}
                    </Td>
                ) : "exhibitionId" in itemEvent && itemEvent.exhibitionId ? (
                    <Td>
                        <LinkButton
                            to={`/conference/${conference.slug}/exhibition/${itemEvent.exhibitionId}`}
                            aria-label={"Go to exhibition"}
                            whiteSpace="normal"
                            variant="outline"
                            size="sm"
                            maxH="unset"
                            h="auto"
                            py={1}
                            colorScheme="blue"
                            linkProps={{ maxH: "unset" }}
                        >
                            View exhibition
                        </LinkButton>
                    </Td>
                ) : (
                    <Td>No item</Td>
                )
            ) : undefined}
            <Td>
                <Text>{itemEvent.name}</Text>
            </Td>
        </Tr>
    );
}
