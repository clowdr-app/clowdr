import {
    Box,
    Button,
    Flex,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import React, { useCallback, useMemo } from "react";
import { ContentType_Enum, Timeline_EventFragment } from "../../../../generated/graphql";
import LinkButton from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { useScrollerParams } from "./Scroller";
import useTimelineParameters from "./useTimelineParameters";

function EventBoxInner({
    events,
    durationSeconds,
    eventStartMs,
    roomName,
}: {
    events: ReadonlyArray<Timeline_EventFragment>;
    durationSeconds: number;
    eventStartMs: number;
    roomName: string;
}): JSX.Element {
    const conference = useConference();
    const timelineParams = useTimelineParameters();
    const scrollerParams = useScrollerParams();

    const offsetMs = eventStartMs - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const leftPx = offsetSeconds * scrollerParams.pixelsPerSecond;
    const widthPx = durationSeconds * scrollerParams.pixelsPerSecond;

    const event = events[0];

    const eventTitle = event.contentGroup
        ? events.length > 1
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

    const now = Date.now();
    const isLive = eventStartMs < now && now < eventStartMs + durationSeconds * 1000;

    const eventFocusRef = React.useRef<HTMLButtonElement>(null);
    const { isOpen, onClose: onCloseInner, onOpen } = useDisclosure();
    const onClose = useCallback(() => {
        onCloseInner();
        eventFocusRef.current?.focus();
    }, [onCloseInner]);
    const popover = useMemo(() => {
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
        return (
            <Popover
                isLazy={true}
                variant="responsive"
                closeOnEsc={true}
                trigger="click"
                placement="auto"
                isOpen={isOpen}
                onClose={onClose}
                returnFocusOnClose={false}
            >
                <PopoverTrigger>
                    <div
                        style={{
                            visibility: "hidden",
                            zIndex: 0,
                            position: "absolute",
                            left: leftPx,
                            width: widthPx,
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
                >
                    <PopoverHeader fontWeight="semibold" pr={1}>
                        <Flex direction="row">
                            {eventTitle}
                            <Flex direction="row" justifyContent="end" alignItems="start" ml="auto">
                                <LinkButton
                                    ml={1}
                                    mr={1}
                                    size="sm"
                                    colorScheme={isLive ? "red" : "green"}
                                    to={
                                        `/conference/${conference.slug}` +
                                        (event.contentGroup && !isLive
                                            ? `/item/${event.contentGroup.id}`
                                            : `/room/${event.roomId}`)
                                    }
                                    title={
                                        isLive
                                            ? `Event is live. Go to room ${roomName}`
                                            : event.contentGroup
                                            ? `View ${event.contentGroup.title}`
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
                    </PopoverHeader>
                    <PopoverArrow />
                    <PopoverBody>{abstractText}</PopoverBody>
                </PopoverContent>
            </Popover>
        );
    }, [
        conference.slug,
        event.contentGroup,
        event.roomId,
        eventTitle,
        isLive,
        isOpen,
        leftPx,
        onClose,
        roomName,
        widthPx,
    ]);

    const borderColour = useColorModeValue("gray.600", "gray.200");
    return (
        <>
            <Button
                ref={eventFocusRef}
                as="div"
                zIndex={1}
                cursor="pointer"
                position="absolute"
                left={Math.round(leftPx) + "px"}
                width={Math.round(widthPx) + "px"}
                height="100%"
                top={0}
                borderLeftColor={borderColour}
                borderRightColor={borderColour}
                borderLeftWidth={1}
                borderRightWidth={1}
                borderRadius={0}
                borderStyle="solid"
                p={2}
                boxSizing="border-box"
                fontSize="80%"
                lineHeight="120%"
                textAlign="center"
                onClick={onOpen}
                onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                        onOpen();
                    }
                }}
                disabled={isOpen}
                transition="none"
                tabIndex={0}
                overflow="hidden"
            >
                {buttonContents}
            </Button>
            {popover}
        </>
    );
}

export default function EventBox({
    sortedEvents,
    roomName,
}: {
    sortedEvents: ReadonlyArray<Timeline_EventFragment>;
    roomName: string;
}): JSX.Element | null {
    const timelineParams = useTimelineParameters();

    const event = sortedEvents[0];
    const eventStartMs = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const durationSeconds = useMemo(() => sortedEvents.reduce((acc, e) => acc + e.durationSeconds, 0), [sortedEvents]);

    if (eventStartMs + durationSeconds * 1000 + 1000 * 60 * 10 < timelineParams.startTimeMs) {
        return null;
    } else if (
        eventStartMs - 1000 * 60 * 10 >
        timelineParams.startTimeMs + timelineParams.visibleTimeSpanSeconds * 1000
    ) {
        return null;
    }

    return (
        <EventBoxInner
            roomName={roomName}
            events={sortedEvents}
            durationSeconds={durationSeconds}
            eventStartMs={eventStartMs}
        />
    );
}
