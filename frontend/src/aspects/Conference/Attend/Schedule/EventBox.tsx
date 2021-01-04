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
    Text,
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Link as ReactLink } from "react-router-dom";
import { ContentType_Enum, Timeline_EventFragment } from "../../../../generated/graphql";
import LinkButton from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { AuthorList } from "../Content/AuthorList";
import { EventPersonList } from "../Content/EventPersonList";
import EventTagList from "./EventTagList";
import { useTimelineParameters } from "./useTimelineParameters";

function EventBoxPopover({
    leftPc,
    widthPc,
    eventStartMs,
    durationSeconds,
    roomName,
    events,
    isOpen,
    onClose,
}: {
    leftPc: number;
    widthPc: number;
    eventStartMs: number;
    durationSeconds: number;
    roomName: string;
    events: ReadonlyArray<Timeline_EventFragment>;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const event = events[0];
    const eventTitle = event.contentGroup
        ? events.length > 1
            ? event.contentGroup.title
            : `${event.contentGroup.title}`
        : event.name;

    const now = Date.now();
    const isLive = eventStartMs < now && now < eventStartMs + durationSeconds * 1000;

    const abstractData: ContentItemDataBlob | undefined = event.contentGroup?.contentItems.find(
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
        `/conference/${conference.slug}` +
        (event.contentGroup && !isLive ? `/item/${event.contentGroup.id}` : `/room/${event.roomId}`);

    const ref = useRef<HTMLAnchorElement>(null);
    useEffect(() => {
        let tId: number | undefined;
        if (isOpen) {
            tId = setTimeout((() => {
                ref.current?.focus();
            }) as TimerHandler, 50);
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [isOpen]);
    return (
        <Popover
            variant="responsive"
            closeOnEsc={true}
            trigger="click"
            placement="auto"
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
                        left: leftPc + "%",
                        width: widthPc + "%",
                        height: "100%",
                        top: 0,
                        transition: "none",
                    }}
                ></div>
            </PopoverTrigger>
            <PopoverContent
                overflowY="auto"
                overflowX="hidden"
                onMouseDown={(ev) => {
                    ev.stopPropagation();
                }}
                onMouseMove={(ev) => {
                    ev.stopPropagation();
                }}
                maxH="30vh"
                width={500}
            >
                <PopoverHeader fontWeight="semibold" pr={1}>
                    <Flex direction="row">
                        <Text mb={2}>
                            <Link ref={ref} as={ReactLink} to={eventUrl} textDecoration="none">
                                {eventTitle}
                            </Link>
                        </Text>
                        <Flex direction="row" justifyContent="end" alignItems="start" ml="auto">
                            <LinkButton
                                ml={1}
                                mr={1}
                                size="sm"
                                colorScheme={isLive ? "red" : "green"}
                                to={eventUrl}
                                title={
                                    isLive
                                        ? `Event is happening now. Go to room ${roomName}`
                                        : event.contentGroup
                                        ? "View this event"
                                        : `Go to room ${roomName}`
                                }
                                textDecoration="none"
                            >
                                {isLive ? (
                                    <>
                                        <FAIcon iconStyle="s" icon="eye" mr={2} /> LIVE
                                    </>
                                ) : (
                                    <FAIcon iconStyle="s" icon="eye" />
                                )}
                                {/* TODO: Time until event starts */}
                            </LinkButton>
                            {/* <Button colorScheme="gray" size="sm" onClick={onClose}>
                                    <FAIcon iconStyle="s" icon="times" />
                                </Button> */}
                        </Flex>
                    </Flex>
                    <EventTagList tags={event.eventTags} />
                </PopoverHeader>
                <PopoverArrow />
                <PopoverBody as={VStack} spacing={4} justifyContent="start" alignItems="start">
                    {event.eventPeople.length > 0 ? <EventPersonList people={event.eventPeople} /> : undefined}
                    {event.contentGroup?.people && event.contentGroup?.people.length > 0 ? (
                        <AuthorList contentPeopleData={event.contentGroup.people} />
                    ) : undefined}
                    <Text aria-label="Abstract.">{abstractText}</Text>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
}

export default function EventBox({
    sortedEvents,
    roomName,
    setScrollToEvent,
}: {
    sortedEvents: ReadonlyArray<Timeline_EventFragment>;
    roomName: string;
    setScrollToEvent?: (f: () => void) => void;
}): JSX.Element | null {
    const event = sortedEvents[0];
    const eventStartMs = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const durationSeconds = useMemo(() => sortedEvents.reduce((acc, e) => acc + e.durationSeconds, 0), [sortedEvents]);

    const timelineParams = useTimelineParameters();

    const offsetMs = eventStartMs - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const leftPc = (100 * offsetSeconds) / timelineParams.fullTimeSpanSeconds;
    const widthPc = (100 * durationSeconds) / timelineParams.fullTimeSpanSeconds;

    const eventTitle = event.contentGroup
        ? sortedEvents.length > 1
            ? event.contentGroup.title
            : `${event.contentGroup.title}`
        : event.name;
    const buttonContents = useMemo(() => {
        return (
            <Box overflow="hidden" w="100%" textOverflow="ellipsis" maxH="100%" whiteSpace="normal" noOfLines={2}>
                {eventTitle}
            </Box>
        );
    }, [eventTitle]);

    const eventFocusRef = React.useRef<HTMLButtonElement>(null);
    const { isOpen, onClose, onOpen } = useDisclosure();

    const scrollToEvent = useCallback(() => {
        eventFocusRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "start",
        });
    }, []);

    useEffect(() => {
        setScrollToEvent?.(scrollToEvent);
    }, [scrollToEvent, setScrollToEvent]);

    const borderColour = useColorModeValue("blue.200", "blue.800");
    return (
        <>
            <Button
                ref={eventFocusRef}
                zIndex={1}
                cursor="pointer"
                position="absolute"
                left={leftPc + "%"}
                width={widthPc + "%"}
                height="100%"
                top={0}
                borderColor={borderColour}
                borderWidth={1}
                borderRadius={0}
                borderStyle="solid"
                p={2}
                boxSizing="border-box"
                fontSize="70%"
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
                aria-label={`${eventTitle} starts ${new Date(event.startTime).toLocaleString(undefined, {
                    weekday: "long",
                    hour: "numeric",
                    minute: "numeric",
                })} and lasts ${Math.round(durationSeconds / 60)} minutes.`}
            >
                {buttonContents}
            </Button>
            {isOpen ? (
                <EventBoxPopover
                    leftPc={leftPc}
                    widthPc={widthPc}
                    eventStartMs={eventStartMs}
                    durationSeconds={durationSeconds}
                    roomName={roomName}
                    events={sortedEvents}
                    isOpen={isOpen}
                    onClose={onClose}
                />
            ) : undefined}
        </>
    );
}
