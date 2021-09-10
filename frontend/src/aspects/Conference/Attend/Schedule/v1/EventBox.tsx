import { Button, chakra, Divider, HStack, Text, useColorModeValue, useDisclosure, VStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import { Schedule_TagFragment, useSchedule_SelectItemLazyQuery } from "../../../../../generated/graphql";
import { PlainAuthorsList } from "../../Content/AuthorList";
import TagList from "../../Content/TagList";
import { EventModeIcon } from "../../Rooms/V2/EventHighlight";
import StarEventButton from "../StarEventButton";
import type { TimelineEvent } from "./DayList";
import EventBoxModal from "./EventBoxModal";
import useTimelineParameters from "./useTimelineParameters";

export default function EventBox({
    sortedEvents,
    roomName,
    scrollToEventCbs,
    tags,
}: {
    sortedEvents: ReadonlyArray<TimelineEvent>;
    roomName: string;
    scrollToEventCbs: Map<string, () => void>;
    tags: readonly Schedule_TagFragment[];
}): JSX.Element | null {
    const event = sortedEvents[0];
    const eventIds = useMemo(() => sortedEvents.map((x) => x.id), [sortedEvents]);
    const eventStartMs = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const durationSeconds = useMemo(() => {
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        return (Date.parse(lastEvent.startTime) + lastEvent.durationSeconds * 1000 - eventStartMs) / 1000;
    }, [eventStartMs, sortedEvents]);

    const timelineParams = useTimelineParameters();

    const offsetMs = eventStartMs - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const topPc = (100 * offsetSeconds) / timelineParams.fullTimeSpanSeconds;
    const heightPc = (100 * durationSeconds) / timelineParams.fullTimeSpanSeconds;

    const eventTitle = event.item
        ? sortedEvents.length > 1
            ? event.item.title
            : `${event.name}: ${event.item.title}`
        : event.name;
    const buttonContents = useMemo(() => {
        return (
            <>
                <VStack
                    overflow="hidden"
                    w="100%"
                    textOverflow="ellipsis"
                    maxH="100%"
                    whiteSpace="normal"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                >
                    <HStack alignItems="flex-start" justifyContent="flex-start">
                        <StarEventButton eventIds={eventIds} />
                        <Text fontSize="sm" fontWeight="bold">
                            {R.intersperse(
                                <>&nbsp;/&nbsp;</>,
                                sortedEvents.map((ev, idx) => (
                                    <EventModeIcon
                                        key={idx}
                                        mode={ev.intendedRoomModeName}
                                        durationSeconds={ev.durationSeconds}
                                        fontSize="inherit"
                                    />
                                ))
                            )}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" lineHeight="130%">
                            {event.item ? (
                                <>
                                    <Twemoji className="twemoji" text={event.item.title} />
                                    <br />
                                    <chakra.span fontStyle="italic" fontSize="xs">
                                        <Twemoji className="twemoji" text={event.name} />
                                    </chakra.span>
                                </>
                            ) : (
                                <Twemoji className="twemoji" text={event.name} />
                            )}
                        </Text>
                    </HStack>
                    <Text fontSize="sm">
                        {new Date(eventStartMs).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            hour12: false,
                            minute: "2-digit",
                        })}{" "}
                        for {Math.round(durationSeconds / 60)} minutes
                    </Text>
                    {event.itemPeople?.length ? <PlainAuthorsList people={event.itemPeople} /> : undefined}
                    {event.exhibitionPeople?.length ? <PlainAuthorsList people={event.exhibitionPeople} /> : undefined}
                    {event.item ? (
                        <>
                            <TagList
                                tags={event.item.itemTags.map(
                                    (x) => ({ ...x, tag: tags.find((y) => x.tagId === y.id) } as any)
                                )}
                                noClick
                            />
                        </>
                    ) : undefined}
                </VStack>
                {sortedEvents.slice(1).map((ev) => (
                    <Divider
                        pos="absolute"
                        key={ev.id}
                        top={(100 * (Date.parse(ev.startTime) - eventStartMs)) / (1000 * durationSeconds) + "%"}
                        left={0}
                        w="100%"
                        borderTopStyle="dashed"
                        borderTopWidth="2px"
                        borderBottom="none"
                    />
                ))}
            </>
        );
    }, [
        eventIds,
        sortedEvents,
        event.item,
        event.itemPeople,
        event.exhibitionPeople,
        event.name,
        eventStartMs,
        durationSeconds,
        tags,
    ]);

    const eventFocusRef = React.useRef<HTMLButtonElement>(null);
    const { isOpen, onClose: _onClose, onOpen } = useDisclosure();
    const onClose = useCallback(() => {
        _onClose();
        setTimeout(() => {
            eventFocusRef.current?.focus();
        }, 100);
    }, [_onClose]);

    const scrollToEvent = useCallback(() => {
        eventFocusRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "center",
        });
    }, []);

    useEffect(() => {
        sortedEvents.forEach((x) => {
            scrollToEventCbs.set(x.id, scrollToEvent);
        });
    }, [sortedEvents, scrollToEvent, scrollToEventCbs]);

    const [getContent, content] = useSchedule_SelectItemLazyQuery();
    useEffect(() => {
        if (isOpen && !content.data && event.itemId) {
            getContent({
                variables: {
                    id: event.itemId,
                },
            });
        }
    }, [content.data, getContent, isOpen, event.itemId]);

    const borderColour = useColorModeValue("purple.200", "purple.800");
    return (
        <>
            <Button
                ref={eventFocusRef}
                zIndex={1}
                cursor="pointer"
                position="absolute"
                top={topPc + "%"}
                height={heightPc + "%"}
                width="100%"
                left={0}
                borderColor={borderColour}
                borderWidth={1}
                borderRadius={0}
                borderStyle="solid"
                p={2}
                boxSizing="border-box"
                fontSize="sm"
                lineHeight="120%"
                textAlign="left"
                onClick={onOpen}
                onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                        ev.stopPropagation();
                        ev.preventDefault();
                        onOpen();
                    }
                }}
                disabled={isOpen}
                tabIndex={0}
                overflow="hidden"
                minW={0}
                colorScheme="gray"
                role="button"
                aria-label={`${eventTitle} starts ${DateTime.fromMillis(eventStartMs)
                    .setZone(timelineParams.timezone)
                    .toLocaleString({
                        weekday: "long",
                        hour: "numeric",
                        minute: "numeric",
                    })} and lasts ${Math.round(durationSeconds / 60)} minutes.`}
                justifyContent="flex-start"
                alignItems="flex-start"
            >
                {buttonContents}
            </Button>
            {isOpen ? (
                <EventBoxModal
                    eventStartMs={eventStartMs}
                    durationSeconds={durationSeconds}
                    roomName={roomName}
                    events={sortedEvents}
                    content={content.data?.content_Item_by_pk}
                    isOpen={isOpen}
                    onClose={onClose}
                    finalFocusRef={eventFocusRef}
                    tags={tags}
                />
            ) : undefined}
        </>
    );
}
