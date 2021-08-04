import { gql } from "@apollo/client";
import { Box, chakra, HStack, Skeleton, Td, Text, VStack } from "@chakra-ui/react";
import IntersectionObserver from "@researchgate/react-intersection-observer";
import * as luxon from "luxon";
import React, { useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import type { ScheduleV2_EventFragment, ScheduleV2_TagFragment } from "../../../../../generated/graphql";
import { PlainAuthorsList } from "../../Content/AuthorList";
import TagList from "../../Content/TagList";
import { EventModeIcon } from "../../Rooms/V2/EventHighlight";
import StarEventButton from "../StarEventButton";
import type { EventCellDescriptor } from "./Types";

gql`
    fragment ScheduleV2_Element on content_Element {
        id
        typeName
        name
        layoutData
        data
    }

    fragment ScheduleV2_ProgramPerson on collection_ProgramPerson {
        id
        name
        affiliation
        registrantId
    }

    fragment ScheduleV2_ItemPerson on content_ItemProgramPerson {
        id
        priority
        roleName
        person {
            ...ScheduleV2_ProgramPerson
        }
    }

    fragment ScheduleV2_ItemElements on content_Item {
        id
        title
        shortTitle
        typeName
        itemTags {
            id
            itemId
            tagId
        }
        itemPeople {
            ...ScheduleV2_ItemPerson
        }
    }

    fragment ScheduleV2_Event on schedule_Event {
        id
        roomId
        intendedRoomModeName
        name
        startTime
        durationSeconds
        itemId
        exhibitionId
        shufflePeriodId

        item {
            ...ScheduleV2_ItemElements
            abstractElements: elements(where: { typeName: { _eq: ABSTRACT }, isHidden: { _eq: false } }) {
                ...ScheduleV2_Element
            }
            itemPeople {
                ...ScheduleV2_ItemPerson
            }
        }
    }
`;

export default function EventBox({
    event,
    fullEvent,
    isHourBoundary,
    isHourDiscontiguous,
    hourBoundaryBorderColor,
    eventBoxBgColor,
    eventBorderColor,
    splitOverDayBoundary,
    tags,
    timezone,
    renderImmediately,
}: {
    event: EventCellDescriptor;
    fullEvent?: ScheduleV2_EventFragment;
    isHourBoundary: boolean;
    isHourDiscontiguous: boolean;
    hourBoundaryBorderColor: string;
    eventBoxBgColor: string;
    eventBorderColor: string;
    splitOverDayBoundary: "first" | "second" | "no";
    tags: readonly ScheduleV2_TagFragment[];
    timezone: luxon.Zone;
    renderImmediately: boolean;
}): JSX.Element {
    const [isVisible, setIsVisible] = useState<boolean>(renderImmediately);
    const [show, setShow] = useState<boolean>(renderImmediately);
    useEffect(() => {
        let tId: number | undefined;

        if (isVisible) {
            tId = setTimeout(
                (() => {
                    setShow(true);
                }) as TimerHandler,
                25
            );
        }

        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [isVisible]);

    const box = useMemo(
        () =>
            show && fullEvent ? (
                <Td
                    rowSpan={
                        splitOverDayBoundary === "first"
                            ? 1
                            : splitOverDayBoundary === "second"
                            ? event.markerSpan - 1
                            : event.markerSpan
                    }
                    bgColor={eventBoxBgColor}
                    verticalAlign="top"
                    zIndex={0}
                    borderTopColor={isHourBoundary ? hourBoundaryBorderColor : eventBorderColor}
                    borderTopStyle={isHourBoundary && isHourDiscontiguous ? "double" : "solid"}
                    borderTopWidth={
                        isHourBoundary && isHourDiscontiguous
                            ? "6px"
                            : !event.preceedingEventId || event.preceedingEventId !== event.parsedEvent.lwEvent.id
                            ? "1px"
                            : 0
                    }
                    borderBottomColor={eventBorderColor}
                    borderBottomWidth="1px"
                    borderBottomStyle="solid"
                    borderX="1px solid"
                    borderLeftColor={eventBorderColor}
                    borderRightColor={eventBorderColor}
                    pos="relative"
                >
                    {splitOverDayBoundary !== "second" && fullEvent ? (
                        <EventBoxContents event={event} eventInfo={fullEvent} tags={tags} timezone={timezone} />
                    ) : splitOverDayBoundary !== "second" ? (
                        <Box minH="24ex"></Box>
                    ) : undefined}
                </Td>
            ) : undefined,
        [
            event,
            fullEvent,
            eventBorderColor,
            eventBoxBgColor,
            hourBoundaryBorderColor,
            isHourBoundary,
            isHourDiscontiguous,
            splitOverDayBoundary,
            tags,
            timezone,
            show,
        ]
    );

    return box ? (
        box
    ) : (
        <IntersectionObserver
            onChange={({ isIntersecting }) => {
                setIsVisible(isIntersecting);
            }}
        >
            <Skeleton
                as={Td}
                bg={eventBoxBgColor}
                rowSpan={
                    splitOverDayBoundary === "first"
                        ? 1
                        : splitOverDayBoundary === "second"
                        ? event.markerSpan - 1
                        : event.markerSpan
                }
            />
        </IntersectionObserver>
    );
}

function EventBoxContents({
    eventInfo,
    tags,
    timezone,
}: {
    event: EventCellDescriptor;
    eventInfo: ScheduleV2_EventFragment;
    tags: readonly ScheduleV2_TagFragment[];
    timezone: luxon.Zone;
}): JSX.Element {
    const startTimeDT = useMemo(
        () => luxon.DateTime.fromISO(eventInfo.startTime).setZone(timezone),
        [eventInfo.startTime, timezone]
    );
    const endTimeDT = useMemo(
        () => startTimeDT.plus({ seconds: eventInfo.durationSeconds }),
        [eventInfo.durationSeconds, startTimeDT]
    );
    const overlapsDayBoundary = useMemo(() => startTimeDT.day !== endTimeDT.day, [endTimeDT.day, startTimeDT.day]);

    return (
        <VStack
            w="100%"
            maxH="100%"
            justifyContent="flex-start"
            alignItems="flex-start"
            pb={overlapsDayBoundary ? "3rem" : undefined}
        >
            <HStack alignItems="flex-start" justifyContent="flex-start">
                <StarEventButton eventIds={eventInfo.id} mt={1} />
                <Text fontSize="sm" fontWeight="bold">
                    <EventModeIcon
                        mode={eventInfo.intendedRoomModeName}
                        durationSeconds={eventInfo.durationSeconds}
                        fontSize="inherit"
                    />
                </Text>
                <Text fontSize="sm" pl={2}>
                    {startTimeDT.toLocaleString({
                        hour: "numeric",
                        minute: "numeric",
                    })}{" "}
                    for {Math.round(eventInfo.durationSeconds / 60)} minutes
                </Text>
            </HStack>
            <Text fontSize="sm" fontWeight="bold" lineHeight="130%">
                {eventInfo.item ? (
                    <>
                        <Twemoji className="twemoji" text={eventInfo.item.title} />
                        <br />
                        <chakra.span fontStyle="italic" fontSize="xs">
                            <Twemoji className="twemoji" text={eventInfo.name} />
                        </chakra.span>
                    </>
                ) : (
                    <Twemoji className="twemoji" text={eventInfo.name} />
                )}
            </Text>
            {eventInfo.item ? (
                <>
                    <PlainAuthorsList people={eventInfo.item.itemPeople} />
                    <TagList
                        tags={eventInfo.item.itemTags.map(
                            (x) => ({ ...x, tag: tags.find((y) => x.tagId === y.id) } as any)
                        )}
                        noClick
                    />
                </>
            ) : undefined}
        </VStack>
    );
}
