import { chakra, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, VStack } from "@chakra-ui/react";
import { formatDistanceStrict } from "date-fns";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import { FormattedMessage, useIntl } from "react-intl";
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
                <LinkButton colorScheme="SecondaryActionButton" to={`/conference/${conference.slug}/room/${roomId}`}>
                    <FormattedMessage
                        id="Conference.Attend.Content.EventsTable.GoToRoom"
                        defaultMessage="Go to room"
                    />
                </LinkButton>
            ) : undefined}
            <Table m={0} textAlign="left" w="auto" size="sm" colorScheme="EventsTable">
                <Thead>
                    <Tr>
                        {maybeRegistrant ? <Th p={0}></Th> : undefined}
                        <Th px={3}>
                            <FormattedMessage
                                id="Conference.Attend.Content.EventsTable.Date"
                                defaultMessage="Date"
                            />
                        </Th>
                        <Th px={1}>
                            <FormattedMessage
                                id="Conference.Attend.Content.EventsTable.Time"
                                defaultMessage="Time"
                            />
                        </Th>
                        <Th>
                            <FormattedMessage
                                id="Conference.Attend.Content.EventsTable.Duration"
                                defaultMessage="Duration"
                            />
                        </Th>
                        {includeRoom ?
                            <Th>
                                <FormattedMessage
                                    id="Conference.Attend.Content.EventsTable.Room"
                                    defaultMessage="Room"
                                />
                            </Th>
                        : undefined}
                        {!includeRoom ?
                            <Th>
                                <FormattedMessage
                                    id="Conference.Attend.Content.EventsTable.Item"
                                    defaultMessage="Item"
                                />
                            </Th>
                        : undefined}
                        <Th>
                            <FormattedMessage
                                id="Conference.Attend.Content.EventsTable.EventName"
                                defaultMessage="Event name"
                            />
                        </Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {events.length > 0 ? (
                        R.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime), events).map((event) => (
                            <Event key={event.id} itemEvent={event} includeRoom={includeRoom} />
                        ))
                    ) : (
                        <>
                            <FormattedMessage
                                id="Conference.Attend.Content.EventsTable.NoEvents"
                                defaultMessage="No events."
                            />
                        </>
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
    const intl = useIntl();
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
        return formatDistanceStrict(new Date(startMillis), new Date(endMillis), {
            addSuffix: false,
            unit: "minute",
        });
    }, [endMillis, startMillis]);

    const happeningSoonOrNow = useMemo(() => {
        return now < endMillis && now > startMillis - 5 * 60 * 1000;
    }, [endMillis, now, startMillis]);

    const happeningSoonBgColor = useColorModeValue(
        "EventsTable.happeningSoonBackgroundColor-light",
        "EventsTable.happeningSoonBackgroundColor-dark"
    );
    return (
        <Tr p={2} my={2} w="auto" backgroundColor={happeningSoonOrNow ? happeningSoonBgColor : "initial"}>
            {maybeRegistrant ? (
                <Td p={1} bgColor="EventsTable.starEventCellBackgroundColor">
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
                            aria-label={
                                (itemEvent.room?.name !== undefined)
                                    ? intl.formatMessage({ id: 'Conference.Attend.Content.EventsTable.GoToRoomName', defaultMessage: "Go to room: {room}" }, { room: itemEvent.room.name })
                                    : intl.formatMessage({ id: 'Conference.Attend.Content.EventsTable.GoToRoomPrivate', defaultMessage: "Go to private room" })
                            }
                            whiteSpace="normal"
                            variant="outline"
                            size="sm"
                            maxH="unset"
                            h="auto"
                            py={1}
                            colorScheme="SecondaryActionButton"
                            linkProps={{ maxH: "unset" }}
                        >
                            <Twemoji className="twemoji" text={itemEvent.room?.name ?? "Private room"} />
                        </LinkButton>
                    </Td>
                ) : (
                    <Td>
                        <FormattedMessage
                            id="Conference.Attend.Content.EventsTable.NoRoom"
                            defaultMessage="No room"
                        />
                    </Td>
                )
            ) : undefined}
            {!includeRoom ? (
                "item" in itemEvent && itemEvent.item ? (
                    <Td>
                        {itemEvent.item.id !== "" ? (
                            <LinkButton
                                to={`/conference/${conference.slug}/item/${itemEvent.item.id}`}
                                aria-label={intl.formatMessage({ id: 'Conference.Attend.Content.EventsTable.GoToItemName', defaultMessage: "Go to item: {item}" }, { item: itemEvent.item.title })}
                                whiteSpace="normal"
                                variant="outline"
                                size="sm"
                                maxH="unset"
                                h="auto"
                                py={1}
                                colorScheme="SecondaryActionButton"
                                linkProps={{ maxH: "unset" }}
                            >
                                <Twemoji className="twemoji" text={itemEvent.item.title} />
                            </LinkButton>
                        ) : "exhibitionId" in itemEvent && itemEvent.exhibitionId ? (
                            <>
                                <Text mr={2} pb={2}>
                                    {
                                        (conference.hiddenExhibitionsLabel[0]?.value !== undefined)
                                            ? intl.formatMessage({
                                                id: 'Conference.Attend.Content.EventsTable.ItemIsPartOfExhibitionName',
                                                defaultMessage: "{item} is part of the {exhibition} at this event." },{
                                                item: itemEvent.item.title,
                                                exhibition: conference.hiddenExhibitionsLabel[0].value
                                            })
                                            : intl.formatMessage({
                                                id: 'Conference.Attend.Content.EventsTable.ItemIsPartOfExhibition',
                                                defaultMessage: "{item} is part of the exhibition at this event." },{
                                                item: itemEvent.item.title
                                            })
                                    }
                                </Text>
                                <LinkButton
                                    to={`/conference/${conference.slug}/exhibition/${itemEvent.exhibitionId}`}
                                    aria-label={
                                        (conference.hiddenExhibitionsLabel[0]?.value !== undefined)
                                            ? intl.formatMessage({
                                                id: 'Conference.Attend.Content.EventsTable.GoToExhibitionName',
                                                defaultMessage: "Go to {exhibition}" },{
                                                exhibition: conference.hiddenExhibitionsLabel[0].value
                                            })
                                            : intl.formatMessage({
                                                id: 'Conference.Attend.Content.EventsTable.GoToExhibition',
                                                defaultMessage: "Go to exhibition"
                                            })
                                    }
                                    whiteSpace="normal"
                                    variant="outline"
                                    size="sm"
                                    maxH="unset"
                                    h="auto"
                                    py={1}
                                    colorScheme="SecondaryActionButton"
                                    linkProps={{ maxH: "unset" }}
                                >
                                    {
                                        (conference.hiddenExhibitionsLabel[0]?.value !== undefined)
                                            ? intl.formatMessage({
                                                id: 'Conference.Attend.Content.EventsTable.ViewExhibitionName',
                                                defaultMessage: "View {exhibition}" },{
                                                exhibition: conference.hiddenExhibitionsLabel[0].value
                                            })
                                            : intl.formatMessage({
                                                id: 'Conference.Attend.Content.EventsTable.ViewExhibition',
                                                defaultMessage: "View exhibition"
                                            })
                                    }
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
                            aria-label={
                                (conference.hiddenExhibitionsLabel[0]?.value !== undefined)
                                    ? intl.formatMessage({
                                        id: 'Conference.Attend.Content.EventsTable.GoToExhibitionName',
                                        defaultMessage: "Go to {exhibition}" },{
                                        exhibition: conference.hiddenExhibitionsLabel[0].value
                                    })
                                    : intl.formatMessage({
                                        id: 'Conference.Attend.Content.EventsTable.GoToExhibition',
                                        defaultMessage: "Go to exhibition"
                                    })
                            }
                            whiteSpace="normal"
                            variant="outline"
                            size="sm"
                            maxH="unset"
                            h="auto"
                            py={1}
                            colorScheme="SecondaryActionButton"
                            linkProps={{ maxH: "unset" }}
                        >
                            {
                                (conference.hiddenExhibitionsLabel[0]?.value !== undefined)
                                    ? intl.formatMessage({
                                        id: 'Conference.Attend.Content.EventsTable.ViewExhibitionName',
                                        defaultMessage: "View {exhibition}" },{
                                        exhibition: conference.hiddenExhibitionsLabel[0].value
                                    })
                                    : intl.formatMessage({
                                        id: 'Conference.Attend.Content.EventsTable.ViewExhibition',
                                        defaultMessage: "View exhibition"
                                    })
                            }
                        </LinkButton>
                    </Td>
                ) : (
                    <Td>
                        <FormattedMessage
                            id="Conference.Attend.Content.EventsTable.NoItem"
                            defaultMessage="No item"
                        />
                    </Td>
                )
            ) : undefined}
            <Td>
                <Text>{itemEvent.name}</Text>
            </Td>
        </Tr>
    );
}
