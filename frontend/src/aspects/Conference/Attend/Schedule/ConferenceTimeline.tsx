import { gql } from "@apollo/client";
import { Box, Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import ScrollContainer from "react-indiana-drag-scroll";
import {
    Permission_Enum,
    Timeline_ContentGroup_PartialInfoFragment,
    Timeline_EventFragment,
    Timeline_RoomFragment,
    Timeline_SelectRoomsQuery,
    useTimeline_SelectRoomsQuery,
} from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import DayList from "./DayList";
import NowMarker from "./NowMarker";
import RoomNameBox from "./RoomNameBox";
import RoomTimeline from "./RoomTimeline";
import { ScrollerProvider, useScrollerParams } from "./Scroller";
import TimeBar, { useGenerateMarkers } from "./TimeBar";
import TimelineZoomControls from "./TimelineZoomControls";
import { TimelineParameters, useTimelineParameters } from "./useTimelineParameters";

gql`
    fragment Timeline_ContentItem on ContentItem {
        id
        contentTypeName
        name
        isHidden
        layoutData
    }

    fragment Timeline_ContentItem_WithData on ContentItem {
        ...Timeline_ContentItem
        data
    }

    fragment Timeline_ContentPerson on ContentPerson {
        id
        name
        affiliation
    }

    fragment Timeline_ContentGroupPerson on ContentGroupPerson {
        id
        priority
        roleName
        person {
            ...Timeline_ContentPerson
        }
    }

    fragment Timeline_ContentGroup on ContentGroup {
        id
        contentGroupTypeName
        title
        abstractContentItems: contentItems(where: { contentTypeName: { _eq: ABSTRACT } }) {
            ...Timeline_ContentItem_WithData
        }
        people {
            ...Timeline_ContentGroupPerson
        }
    }

    fragment Timeline_Event_FullInfo on Event {
        id
        roomId
        intendedRoomModeName
        name
        startTime
        durationSeconds
        contentGroup {
            ...Timeline_ContentGroup
        }
    }

    fragment Timeline_Event on Event {
        id
        roomId
        name
        startTime
        durationSeconds
        contentGroupId
    }

    fragment Timeline_Room on Room {
        id
        name
        currentModeName
        priority
    }

    fragment Timeline_ContentGroup_PartialInfo on ContentGroup {
        id
        title
    }

    query Timeline_SelectEvent($id: uuid!) {
        Event_by_pk(id: $id) {
            ...Timeline_Event_FullInfo
        }
    }

    query Timeline_SelectRooms($conferenceId: uuid!) {
        Room(where: { conferenceId: { _eq: $conferenceId }, roomPrivacyName: { _in: [PUBLIC, PRIVATE] }, events: {} }) {
            ...Timeline_Room
        }
        Event(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Timeline_Event
        }
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Timeline_ContentGroup_PartialInfo
        }
    }
`;

function ConferenceTimelineInner({
    rooms: unsortedRooms,
    events,
    contentGroups,
}: {
    rooms: ReadonlyArray<Timeline_RoomFragment>;
    events: ReadonlyArray<Timeline_EventFragment>;
    contentGroups: ReadonlyArray<Timeline_ContentGroup_PartialInfoFragment>;
}): JSX.Element {
    const conference = useConference();
    useNoPrimaryMenuButtons();

    const rooms = useMemo(() => {
        return [...unsortedRooms].sort((x, y) => x.name.localeCompare(y.name)).sort((x, y) => x.priority - y.priority);
    }, [unsortedRooms]);

    const timeBarWidth = 90;
    const roomRowWidth = Math.min(500, Math.max(200, window.innerWidth / rooms.length - timeBarWidth - 70));
    const borderColour = useColorModeValue("gray.400", "gray.400");

    const timeBarF = useCallback(
        (key: string, mt?: string) => (
            <TimeBar key={key} width={timeBarWidth} borderColour={borderColour} marginTop={mt} />
        ),
        [borderColour, timeBarWidth]
    );

    const alternateBgColor = useColorModeValue("blue.100", "blue.700");

    const rowInterval = Math.max(1, Math.round((window.innerWidth - 340) / roomRowWidth));
    const timeBarSeparation = "2em";

    const roomNameBoxes = useMemo(
        () =>
            rooms.reduce(
                (acc, room, idx) => [
                    ...acc,
                    idx > 0 && idx % rowInterval === 0 ? (
                        <RoomNameBox
                            key={"filler-" + idx}
                            room={""}
                            width={timeBarWidth}
                            showBottomBorder={true}
                            borderColour={borderColour}
                            backgroundColor={alternateBgColor}
                            marginLeft={timeBarSeparation}
                        />
                    ) : undefined,
                    <RoomNameBox
                        key={room.id}
                        room={room}
                        width={roomRowWidth}
                        showBottomBorder={true}
                        borderColour={borderColour}
                        backgroundColor={idx % 2 === 1 ? alternateBgColor : undefined}
                    />,
                ],
                [] as (JSX.Element | undefined)[]
            ),
        [alternateBgColor, borderColour, roomRowWidth, rooms, rowInterval, timeBarWidth]
    );

    const [scrollCallbacks, setScrollCallbacks] = useState<Map<string, (ev: Timeline_EventFragment) => void>>(
        new Map()
    );

    const totalW =
        50 +
        useMemo(
            () =>
                rooms.reduce(
                    (acc, _room, idx) =>
                        idx % rowInterval === 0 ? acc + timeBarWidth + roomRowWidth : acc + roomRowWidth,
                    0
                ),
            [roomRowWidth, rooms, rowInterval]
        );
    const roomTimelines = useMemo(
        () =>
            rooms.reduce(
                (acc, room, idx) => [
                    ...acc,
                    idx % rowInterval === 0
                        ? timeBarF("timeline-" + idx, idx > 0 ? timeBarSeparation : undefined)
                        : undefined,
                    <Box
                        key={room.id}
                        h="100%"
                        w={roomRowWidth + "px"}
                        borderBottomWidth={idx !== rooms.length - 1 ? 1 : 0}
                        borderBottomStyle="solid"
                        borderBottomColor={borderColour}
                    >
                        <RoomTimeline
                            room={room}
                            hideTimeShiftButtons={true}
                            hideTimeZoomButtons={true}
                            width={roomRowWidth}
                            setScrollToEvent={(cb) => {
                                setScrollCallbacks((old) => {
                                    const newMap = new Map(old);
                                    newMap.set(room.id, cb);
                                    return newMap;
                                });
                            }}
                            events={events}
                            contentGroups={contentGroups}
                        />
                    </Box>,
                ],
                [] as (JSX.Element | undefined)[]
            ),
        [borderColour, contentGroups, events, roomRowWidth, rooms, rowInterval, timeBarF]
    );

    const roomMarkers = useGenerateMarkers("100%", "", true, false, false);

    const scrollToEvent = useCallback(
        (ev: Timeline_EventFragment) => {
            const cb = scrollCallbacks.get(ev.roomId);
            cb?.(ev);
        },
        [scrollCallbacks]
    );

    const [scrollToNow, setScrollToNow] = useState<{ f: () => void }>({
        f: () => {
            /*EMPTY*/
        },
    });

    const labeledNowMarker = useMemo(
        () => (
            <NowMarker
                showLabel
                setScrollToNow={(cb) => {
                    setScrollToNow({ f: cb });
                }}
            />
        ),
        []
    );

    const title = useTitle(`Schedule of ${conference.shortName}`);

    const { visibleTimeSpanSeconds } = useScrollerParams();
    const { fullTimeSpanSeconds } = useTimelineParameters();

    const innerHeightPx = (1920 * fullTimeSpanSeconds) / visibleTimeSpanSeconds;

    return (
        <Box h="calc(100vh - 150px)" w="100%" maxW={totalW}>
            {title}
            <Flex w="100%" h="100%" flexDir="column" p={2}>
                <Flex w="100%" direction="row" justify="center" alignItems="center">
                    <Heading as="h1" mr={4}>
                        Schedule
                    </Heading>
                    <DayList rooms={rooms} events={events} scrollToEvent={scrollToEvent} scrollToNow={scrollToNow.f} />
                    <TimelineZoomControls />
                </Flex>
                <Box
                    cursor="pointer"
                    as={ScrollContainer}
                    w="100%"
                    borderColor={borderColour}
                    borderWidth={1}
                    borderStyle="solid"
                    hideScrollbars={false}
                >
                    <Flex
                        direction="column"
                        w="100%"
                        justifyContent="stretch"
                        alignItems="flex-start"
                        role="region"
                        aria-label="Conference schedule"
                    >
                        <Box
                            flex="1 0 max-content"
                            role="list"
                            aria-label="Rooms"
                            display="flex"
                            justifyContent="stretch"
                            alignItems="stretch"
                        >
                            <RoomNameBox
                                room="Rooms"
                                width={timeBarWidth}
                                showBottomBorder={true}
                                borderColour={borderColour}
                                backgroundColor={alternateBgColor}
                            />
                            {roomNameBoxes}
                        </Box>
                        <Box h={innerHeightPx + "px"} role="region" aria-label="Room schedules">
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    boxSizing: "border-box",
                                    transition: "none",
                                    overflow: "hidden",
                                    position: "relative",
                                    display: "flex",
                                }}
                            >
                                {roomMarkers}
                                <NowMarker />
                                {labeledNowMarker}
                                {roomTimelines}
                            </div>
                        </Box>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
}

function ConferenceTimelineIntermediaryWrapper({
    rooms,
    events,
    contentGroups,
}: {
    rooms: ReadonlyArray<Timeline_RoomFragment>;
    events: ReadonlyArray<Timeline_EventFragment>;
    contentGroups: ReadonlyArray<Timeline_ContentGroup_PartialInfoFragment>;
}): JSX.Element {
    const { earliestStart, latestEnd } = useMemo<{ earliestStart: number; latestEnd: number }>(() => {
        return events.reduce<{ earliestStart: number; latestEnd: number }>(
            (x, event) => {
                const startT = Date.parse(event.startTime);
                const endT = startT + event.durationSeconds * 1000;
                if (startT < x.earliestStart) {
                    if (endT > x.latestEnd) {
                        return {
                            earliestStart: startT,
                            latestEnd: endT,
                        };
                    } else {
                        return {
                            earliestStart: startT,
                            latestEnd: x.latestEnd,
                        };
                    }
                } else if (endT > x.latestEnd) {
                    return {
                        earliestStart: x.earliestStart,
                        latestEnd: endT,
                    };
                }
                return x;
            },
            { earliestStart: Number.POSITIVE_INFINITY, latestEnd: Number.NEGATIVE_INFINITY }
        );
    }, [events]);

    return (
        <TimelineParameters earliestEventStart={earliestStart} latestEventEnd={latestEnd}>
            <ScrollerProvider>
                <ConferenceTimelineInner rooms={rooms} events={events} contentGroups={contentGroups} />
            </ScrollerProvider>
        </TimelineParameters>
    );
}

function ConferenceTimelineFetchWrapper(): JSX.Element {
    const conference = useConference();
    const roomsResult = useTimeline_SelectRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    return (
        <ApolloQueryWrapper<
            Timeline_SelectRoomsQuery,
            unknown,
            {
                rooms: ReadonlyArray<Timeline_RoomFragment>;
                events: ReadonlyArray<Timeline_EventFragment>;
                contentGroups: ReadonlyArray<Timeline_ContentGroup_PartialInfoFragment>;
            }
        >
            queryResult={roomsResult}
            getter={(x) => ({ rooms: x.Room, events: x.Event, contentGroups: x.ContentGroup })}
        >
            {(data) => <ConferenceTimelineIntermediaryWrapper {...data} />}
        </ApolloQueryWrapper>
    );
}

export default function ConferenceTimeline(): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceManageSchedule]}
        >
            <ConferenceTimelineFetchWrapper />
        </RequireAtLeastOnePermissionWrapper>
    );
}
