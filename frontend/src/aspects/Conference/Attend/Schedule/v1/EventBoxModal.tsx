import {
    Box,
    chakra,
    Flex,
    Grid,
    GridItem,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
    VStack,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import { ElementBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { format } from "date-fns";
import { DateTime } from "luxon";
import React, { useEffect, useMemo, useRef } from "react";
import { Twemoji } from "react-emoji-render";
import { Link as ReactLink } from "react-router-dom";
import {
    Content_ElementType_Enum,
    Schedule_ItemFragment,
    Schedule_TagFragment,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import FAIcon from "../../../../Icons/FAIcon";
import { Markdown } from "../../../../Text/Markdown";
import { useConference } from "../../../useConference";
import { AuthorList } from "../../Content/AuthorList";
import TagList from "../../Content/TagList";
import { EventModeIcon } from "../../Rooms/V2/EventHighlight";
import StarEventButton from "../StarEventButton";
import type { TimelineEvent } from "./DayList";
import useTimelineParameters from "./useTimelineParameters";

export default function EventBoxModal({
    eventStartMs,
    durationSeconds,
    roomName,
    events,
    content,
    isOpen,
    onClose,
    finalFocusRef,
    tags,
}: {
    eventStartMs: number;
    durationSeconds: number;
    roomName: string;
    events: ReadonlyArray<TimelineEvent>;
    content: Schedule_ItemFragment | null | undefined;
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.MutableRefObject<FocusableElement | null>;
    tags: readonly Schedule_TagFragment[];
}): JSX.Element {
    const conference = useConference();
    const event0 = events[0];
    const eventTitle = content ? content.title : event0.name;
    const eventIds = useMemo(() => events.map((x) => x.id), [events]);

    const now = Date.now();
    const isLive = eventStartMs < now + 10 * 60 * 1000 && now < eventStartMs + durationSeconds * 1000;

    const abstractData: ElementDataBlob | undefined = content?.abstractElements?.find(
        (x) => x.typeName === Content_ElementType_Enum.Abstract
    )?.data;
    let abstractText: string | undefined;
    if (abstractData && abstractData.length > 0) {
        const innerAbstractData = abstractData[abstractData.length - 1];
        if (innerAbstractData.data.baseType === ElementBaseType.Text) {
            abstractText = innerAbstractData.data.text;
        }
    }
    const roomUrl = `/conference/${conference.slug}/room/${event0.roomId}`;
    const itemUrl = content ? `/conference/${conference.slug}/item/${content.id}` : roomUrl;
    const exhibitionId = useMemo(() => {
        for (const event of events) {
            if (event.exhibitionId) {
                return event.exhibitionId;
            }
        }
        return null;
    }, [events]);
    const exhibitionUrl = exhibitionId ? `/conference/${conference.slug}/exhibition/${exhibitionId}` : null;

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

    const initialFocusRef = useRef<HTMLAnchorElement | null>(null);
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            scrollBehavior="inside"
            size="4xl"
            isCentered
            initialFocusRef={initialFocusRef}
            finalFocusRef={finalFocusRef}
            returnFocusOnClose={false}
        >
            <ModalOverlay />
            <ModalContent pb={4}>
                <ModalCloseButton />
                <ModalHeader fontWeight="semibold" pr={1}>
                    <Text
                        aria-label={`Starts at ${DateTime.fromISO(event0.startTime)
                            .setZone(timelineParams.timezone)
                            .toLocaleString({
                                weekday: "long",
                                hour: "numeric",
                                minute: "numeric",
                            })} and lasts ${Math.round(durationSeconds / 60)} minutes.`}
                        mb={2}
                        fontSize="sm"
                        fontStyle="italic"
                        display="flex"
                        w="100%"
                        flexWrap="wrap"
                    >
                        <Box display="flex" pb={1} mr={2} justifyContent="center" alignItems="center">
                            <StarEventButton eventIds={eventIds} />
                        </Box>
                        {events.length === 1 ? (
                            <Box mr={2}>
                                <EventModeIcon
                                    mode={event0.intendedRoomModeName}
                                    durationSeconds={event0.durationSeconds}
                                    fontSize="inherit"
                                />
                            </Box>
                        ) : undefined}
                        <chakra.span>
                            {DateTime.fromMillis(eventStartMs).setZone(timelineParams.timezone).toLocaleString({
                                weekday: "short",
                                month: "short",
                                day: "2-digit",
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
                        </chakra.span>
                    </Text>
                    <Flex direction="row">
                        {eventTitle ? (
                            <Text mr="auto">
                                <Link ref={ref} as={ReactLink} to={itemUrl} textDecoration="none">
                                    <Twemoji className="twemoji" text={eventTitle} />
                                </Link>
                            </Text>
                        ) : undefined}
                        {isLive ? (
                            <LinkButton
                                mx={2}
                                colorScheme={"red"}
                                to={roomUrl}
                                title={`Event is happening now. Go to room ${roomName}`}
                                textDecoration="none"
                                ref={initialFocusRef}
                            >
                                <FAIcon iconStyle="s" icon="broadcast-tower" mr={2} />
                                <Text as="span" ml={1}>
                                    LIVE
                                </Text>
                            </LinkButton>
                        ) : (
                            <LinkButton
                                mx={2}
                                colorScheme="purple"
                                to={roomUrl}
                                title={`Event is later. Go to room ${roomName}`}
                                textDecoration="none"
                                size="sm"
                                ref={initialFocusRef}
                            >
                                <FAIcon iconStyle="s" icon="link" mr={2} />
                                <Text as="span" ml={1}>
                                    Go to room
                                </Text>
                            </LinkButton>
                        )}
                    </Flex>
                </ModalHeader>
                <ModalBody as={VStack} spacing={4} justifyContent="flex-start" alignItems="start">
                    {content?.itemTags.length ? (
                        <TagList
                            tags={content.itemTags.map(
                                (x) => ({ ...x, tag: tags.find((y) => x.tagId === y.id) } as any)
                            )}
                        />
                    ) : undefined}
                    {abstractText ? (
                        <Box>
                            <Markdown>{abstractText}</Markdown>
                        </Box>
                    ) : undefined}
                    {exhibitionUrl || itemUrl ? (
                        <LinkButton
                            my={1}
                            colorScheme="purple"
                            to={exhibitionUrl ?? itemUrl}
                            title={exhibitionUrl || itemUrl ? "Find out more" : `Go to room ${roomName}`}
                            textDecoration="none"
                            ref={initialFocusRef}
                        >
                            <FAIcon iconStyle="s" icon="link" />
                            <Text as="span" ml={1}>
                                Find out more
                            </Text>
                        </LinkButton>
                    ) : undefined}
                    {events.length > 1 ? (
                        <VStack w="100%" alignItems="flex-start" spacing={1}>
                            <Text w="auto" textAlign="left" p={0}>
                                <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                                Times are shown in your local timezone.
                            </Text>
                            <Grid templateColumns="repeat(4, auto)" rowGap={1} columnGap={2}>
                                {events.map((event) => (
                                    <>
                                        <GridItem>
                                            <StarEventButton eventIds={event.id} />
                                        </GridItem>
                                        <GridItem>
                                            <EventModeIcon
                                                mode={event.intendedRoomModeName}
                                                durationSeconds={event.durationSeconds}
                                                fontSize="inherit"
                                            />
                                        </GridItem>
                                        <GridItem>
                                            {format(new Date(event.startTime), "HH:mm")} -{" "}
                                            {format(
                                                new Date(Date.parse(event.startTime) + 1000 * event.durationSeconds),
                                                "HH:mm"
                                            )}
                                        </GridItem>
                                        <Text whiteSpace="normal">{event.name}</Text>
                                    </>
                                ))}
                            </Grid>
                        </VStack>
                    ) : undefined}
                    {event0?.itemPeople?.length ? <AuthorList programPeopleData={event0.itemPeople} /> : undefined}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
