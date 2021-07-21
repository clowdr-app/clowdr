import { gql } from "@apollo/client";
import { Box, chakra, HStack, Skeleton, Td, Text, VStack } from "@chakra-ui/react";
import IntersectionObserver from "@researchgate/react-intersection-observer";
import * as luxon from "luxon";
import React, { useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import {
    ScheduleV2_EventFragment,
    ScheduleV2_TagFragment,
    useScheduleV2_EventQuery,
} from "../../../../../generated/graphql";
import { PlainAuthorsList } from "../../Content/AuthorList";
import TagList from "../../Content/TagList";
import { EventModeIcon } from "../../Rooms/V2/EventHighlight";
import StarEventButton from "../StarEventButton";
import { useSchedule } from "./ScheduleContext";
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

    query ScheduleV2_Event($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            ...ScheduleV2_Event
        }
    }

    fragment ScheduleV2_Tag on collection_Tag {
        id
        name
        colour
        priority
    }

    query ScheduleV2_Tags($conferenceId: uuid!) {
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ScheduleV2_Tag
        }
    }
`;

export default function EventBox({
    event,
    isHourBoundary,
    isHourDiscontiguous,
    hourBoundaryBorderColor,
    eventBoxBgColor,
    eventBorderColor,
    splitOverDayBoundary,
    tags,
}: {
    event: EventCellDescriptor;
    isHourBoundary: boolean;
    isHourDiscontiguous: boolean;
    hourBoundaryBorderColor: string;
    eventBoxBgColor: string;
    eventBorderColor: string;
    splitOverDayBoundary: "first" | "second" | "no";
    tags: readonly ScheduleV2_TagFragment[];
}): JSX.Element {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [show, setShow] = useState<boolean>(false);
    useEffect(() => {
        let tId: number | undefined;

        if (isVisible) {
            tId = setTimeout(
                (() => {
                    setShow(true);
                }) as TimerHandler,
                750
            );
        }

        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [isVisible]);

    const eventResponse = useScheduleV2_EventQuery({
        variables: {
            eventId: event.parsedEvent.event.id,
        },
        skip: !show,
    });

    return (
        <IntersectionObserver
            onChange={({ isIntersecting }) => {
                setIsVisible(isIntersecting);
            }}
        >
            {isVisible ? (
                <Skeleton
                    as={Td}
                    isLoaded={show && !!eventResponse.data}
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
                    borderTopColor={
                        isHourBoundary
                            ? hourBoundaryBorderColor
                            : event.preceedingEventId
                            ? eventBorderColor
                            : undefined
                    }
                    borderTopStyle={isHourBoundary && isHourDiscontiguous ? "double" : "solid"}
                    borderTopWidth={isHourBoundary && isHourDiscontiguous ? "6px" : "1px"}
                    borderX="1px solid"
                    borderLeftColor={eventBorderColor}
                    borderRightColor={eventBorderColor}
                    fadeDuration={0.8}
                >
                    {splitOverDayBoundary !== "second" && eventResponse.data?.schedule_Event_by_pk ? (
                        <EventBoxContents
                            event={event}
                            eventInfo={eventResponse.data.schedule_Event_by_pk}
                            tags={tags}
                        />
                    ) : splitOverDayBoundary !== "second" ? (
                        <Box minH="24ex"></Box>
                    ) : undefined}
                </Skeleton>
            ) : (
                <td
                    rowSpan={
                        splitOverDayBoundary === "first"
                            ? 1
                            : splitOverDayBoundary === "second"
                            ? event.markerSpan - 1
                            : event.markerSpan
                    }
                ></td>
            )}
        </IntersectionObserver>
    );
}

function EventBoxContents({
    eventInfo,
    tags,
}: {
    event: EventCellDescriptor;
    eventInfo: ScheduleV2_EventFragment;
    tags: readonly ScheduleV2_TagFragment[];
}): JSX.Element {
    const params = useSchedule();

    const startTimeDT = useMemo(
        () => luxon.DateTime.fromISO(eventInfo.startTime).setZone(params.timezone),
        [eventInfo.startTime, params.timezone]
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
