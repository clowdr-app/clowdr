import {
    Box,
    Button,
    Flex,
    Link,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Portal,
    Spinner,
    Text,
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import { DateTime } from "luxon";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Twemoji } from "react-emoji-render";
import { Link as ReactLink } from "react-router-dom";
import {
    ContentType_Enum,
    Schedule_ContentGroupFragment,
    Schedule_EventSummaryFragment,
    useSchedule_SelectContentGroupLazyQuery,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { Markdown } from "../../../Text/Markdown";
import { useConference } from "../../useConference";
import { AuthorList } from "../Content/AuthorList";
import type { TimelineEvent } from "./DayList";
import useTimelineParameters from "./useTimelineParameters";

function EventBoxPopover({
    topPc,
    heightPc: heightPc,
    eventStartMs,
    durationSeconds,
    roomName,
    events,
    content,
    isOpen,
    onClose,
}: {
    topPc: number;
    heightPc: number;
    eventStartMs: number;
    durationSeconds: number;
    roomName: string;
    events: ReadonlyArray<Schedule_EventSummaryFragment>;
    content: Schedule_ContentGroupFragment | null | undefined;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const event0 = events[0];
    const eventTitle = content ? (events.length > 1 ? content.title : `${content.title}`) : event0.name;

    const now = Date.now();
    const isLive = eventStartMs < now + 10 * 60 * 1000 && now < eventStartMs + durationSeconds * 1000;

    const abstractData: ContentItemDataBlob | undefined = content?.abstractContentItems?.find(
        (x) => x.contentTypeName === ContentType_Enum.Abstract
    )?.data;
    let abstractText: string | undefined;
    if (abstractData) {
        const innerAbstractData = abstractData[abstractData.length - 1];
        if (innerAbstractData.data.baseType === ContentBaseType.Text) {
            abstractText = innerAbstractData.data.text;
        }
    }
    const eventUrl =
        `/conference/${conference.slug}` + (content && !isLive ? `/item/${content.id}` : `/room/${event0.roomId}`);

    const ref = useRef<HTMLAnchorElement>(null);
    useEffect(() => {
        let tId: number | undefined;
        if (isOpen) {
            tId = setTimeout(
                (() => {
                    ref.current?.focus();
                }) as TimerHandler,
                50
            );
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [isOpen]);

    const timelineParams = useTimelineParameters();

    return (
        <Popover
            variant="responsive"
            closeOnEsc={true}
            trigger="click"
            placement="right-start"
            isOpen={isOpen}
            onClose={onClose}
            returnFocusOnClose={false}
            autoFocus={true}
        >
            <PopoverTrigger>
                <div
                    style={{
                        visibility: "hidden",
                        zIndex: 0,
                        position: "absolute",
                        top: topPc + "%",
                        height: heightPc + "%",
                        width: "100%",
                        left: 0,
                        transition: "none",
                    }}
                ></div>
            </PopoverTrigger>
            <Portal>
                <PopoverContent
                    overflowY="auto"
                    overflowX="hidden"
                    onMouseDown={(ev) => {
                        ev.stopPropagation();
                    }}
                    onMouseMove={(ev) => {
                        ev.stopPropagation();
                    }}
                    maxH="70vh"
                    // width={Math.min(window.innerWidth * 0.7, Math.min(window.innerWidth - 200, 900))}
                >
                    {content ? (
                        <>
                            <PopoverHeader fontWeight="semibold" pr={1}>
                                <Flex direction="row">
                                    <Text>
                                        <Link ref={ref} as={ReactLink} to={eventUrl} textDecoration="none">
                                            <Twemoji className="twemoji" text={eventTitle} />
                                        </Link>
                                    </Text>
                                    <Flex direction="row" justifyContent="flex-end" alignItems="start" ml="auto">
                                        <LinkButton
                                            ml={1}
                                            mr={1}
                                            size="sm"
                                            colorScheme={isLive ? "red" : "green"}
                                            to={eventUrl}
                                            title={
                                                isLive
                                                    ? `Event is happening now. Go to room ${roomName}`
                                                    : content.title
                                                    ? "View this event"
                                                    : `Go to room ${roomName}`
                                            }
                                            textDecoration="none"
                                        >
                                            {isLive ? (
                                                <>
                                                    <FAIcon iconStyle="s" icon="link" mr={2} /> LIVE
                                                </>
                                            ) : (
                                                <FAIcon iconStyle="s" icon="link" />
                                            )}
                                            <Text as="span" ml={1}>
                                                View
                                            </Text>
                                            {/* TODO: Time until event starts */}
                                        </LinkButton>
                                        {/* <Button colorScheme="gray" size="sm" onClick={onClose}>
                                    <FAIcon iconStyle="s" icon="times" />
                                </Button> */}
                                    </Flex>
                                </Flex>
                                <Text
                                    aria-label={`Starts at ${DateTime.fromISO(event0.startTime)
                                        .setZone(timelineParams.timezone)
                                        .toLocaleString({
                                            weekday: "long",
                                            hour: "numeric",
                                            minute: "numeric",
                                        })} and lasts ${Math.round(durationSeconds / 60)} minutes.`}
                                    mb={2}
                                >
                                    {DateTime.fromMillis(eventStartMs).setZone(timelineParams.timezone).toLocaleString({
                                        hour: "numeric",
                                        minute: "numeric",
                                        hour12: false,
                                    })}{" "}
                                    -{" "}
                                    {DateTime.fromMillis(eventStartMs + durationSeconds * 1000)
                                        .setZone(timelineParams.timezone)
                                        .toLocaleString({
                                            hour: "numeric",
                                            minute: "numeric",
                                            hour12: false,
                                        })}
                                </Text>
                            </PopoverHeader>
                            <PopoverArrow />
                            <PopoverBody as={VStack} spacing={4} justifyContent="flex-start" alignItems="start">
                                {content?.people && content?.people.length > 0 ? (
                                    <AuthorList contentPeopleData={content.people} />
                                ) : undefined}
                                <Box>
                                    <Markdown>{abstractText}</Markdown>
                                </Box>
                            </PopoverBody>
                        </>
                    ) : (
                        <Spinner label="Loading event info" />
                    )}
                </PopoverContent>
            </Portal>
        </Popover>
    );
}

export default function EventBox({
    sortedEvents,
    roomName,
    scrollToEventCbs,
}: {
    sortedEvents: ReadonlyArray<TimelineEvent>;
    roomName: string;
    scrollToEventCbs: Map<string, () => void>;
}): JSX.Element | null {
    const event = sortedEvents[0];
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

    const eventTitle = event.contentGroup
        ? sortedEvents.length > 1
            ? event.contentGroup.title
            : `${event.contentGroup.title}`
        : event.name;
    const buttonContents = useMemo(() => {
        return (
            <Box overflow="hidden" w="100%" textOverflow="ellipsis" maxH="100%" whiteSpace="normal">
                <Twemoji className="twemoji" text={eventTitle} />
            </Box>
        );
    }, [eventTitle]);

    const eventFocusRef = React.useRef<HTMLButtonElement>(null);
    const { isOpen, onClose, onOpen } = useDisclosure();

    const scrollToEvent = useCallback(() => {
        eventFocusRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "center",
        });
    }, []);

    useEffect(() => {
        scrollToEventCbs.set(event.id, scrollToEvent);
    }, [event.id, scrollToEvent, scrollToEventCbs]);

    const [getContent, content] = useSchedule_SelectContentGroupLazyQuery();
    useEffect(() => {
        if (isOpen && !content.data && event.contentGroupId) {
            getContent({
                variables: {
                    id: event.contentGroupId,
                },
            });
        }
    }, [content.data, getContent, isOpen, event.contentGroupId]);

    const borderColour = useColorModeValue("blue.200", "blue.800");
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
                        onOpen();
                    }
                }}
                disabled={isOpen}
                tabIndex={0}
                overflow="hidden"
                minW={0}
                colorScheme="blue"
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
                <EventBoxPopover
                    topPc={topPc}
                    heightPc={heightPc}
                    eventStartMs={eventStartMs}
                    durationSeconds={durationSeconds}
                    roomName={roomName}
                    events={sortedEvents}
                    content={content.data?.ContentGroup_by_pk}
                    isOpen={isOpen}
                    onClose={onClose}
                />
            ) : undefined}
        </>
    );
}
