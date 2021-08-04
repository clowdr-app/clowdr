import { gql } from "@apollo/client";
import { Box, Table, Text, Th, Tr, useColorModeValue, useToken, VStack } from "@chakra-ui/react";
import * as luxon from "luxon";
import * as R from "ramda";
import React, { useMemo, useRef } from "react";
import {
    ScheduleV2_RoomFragment,
    ScheduleV2_TagFragment,
    Schedule_Event_Bool_Exp,
    useScheduleV2_RoomsQuery,
    useScheduleV2_TagsQuery,
} from "../../../../../generated/graphql";
import { useConference } from "../../../useConference";
import Day from "./Day";

gql`
    fragment ScheduleV2_Room on room_Room {
        id
        name
        # colour
        priority
    }

    query ScheduleV2_Rooms($conferenceId: uuid!) {
        room_Room(where: { conferenceId: { _eq: $conferenceId }, events: {} }) {
            ...ScheduleV2_Room
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

export default function Schedule({
    earliestStartingTime: earliestStartingTime_UnknownTZ,
    latestEndingTime: latestEndingTime_UnknownTZ,
    eventFilter,
}: {
    earliestStartingTime: luxon.DateTime;
    latestEndingTime: luxon.DateTime;
    eventFilter?: Schedule_Event_Bool_Exp;
}): JSX.Element {
    const timezone = useMemo(() => new luxon.LocalZone(), []);
    const earliestStartingTime = useMemo(
        () => earliestStartingTime_UnknownTZ.setZone(timezone),
        [earliestStartingTime_UnknownTZ, timezone]
    );
    const latestEndingTime = useMemo(
        () => latestEndingTime_UnknownTZ.setZone(timezone),
        [latestEndingTime_UnknownTZ, timezone]
    );
    const startsOfDaysTimes = useMemo(() => {
        const result: luxon.DateTime[] = [];

        const oneDay: luxon.DurationInput = { days: 1 };
        for (
            let currentDayTime = earliestStartingTime.startOf("day");
            currentDayTime.toMillis() <= latestEndingTime.toMillis();
            currentDayTime = currentDayTime.plus(oneDay)
        ) {
            result.push(currentDayTime);
        }

        return result;
    }, [earliestStartingTime, latestEndingTime]);

    const wasTodayInRangeAtLoad = useMemo(() => {
        const startOfTodayTime = luxon.DateTime.now().setZone(timezone).startOf("day");
        return startsOfDaysTimes.some((startOfDayTime) => startOfDayTime.toMillis() === startOfTodayTime.toMillis());
    }, [startsOfDaysTimes, timezone]);
    const shouldAutoScrollToNow = useRef<boolean>(wasTodayInRangeAtLoad);

    const conference = useConference();

    const tagsQueryObj = useMemo(
        () => ({
            variables: {
                conferenceId: conference.id,
            },
        }),
        [conference.id]
    );
    const tagsResponse = useScheduleV2_TagsQuery(tagsQueryObj);
    const sortedTags = useMemo<ScheduleV2_TagFragment[]>(
        () =>
            tagsResponse.data?.collection_Tag
                ? R.sortWith(
                      [(x, y) => x.priority - y.priority, (x, y) => x.name.localeCompare(y.name)],
                      tagsResponse.data.collection_Tag
                  )
                : [],
        [tagsResponse.data?.collection_Tag]
    );

    const roomsQueryObj = useMemo(
        () => ({
            variables: {
                conferenceId: conference.id,
            },
        }),
        [conference.id]
    );
    const roomsResponse = useScheduleV2_RoomsQuery(roomsQueryObj);

    const sortedRooms = useMemo<ScheduleV2_RoomFragment[]>(
        () =>
            roomsResponse.data?.room_Room
                ? R.sortWith(
                      [(x, y) => x.priority - y.priority, (x, y) => x.name.localeCompare(y.name)],
                      roomsResponse.data.room_Room
                  )
                : [],
        [roomsResponse.data?.room_Room]
    );

    const { dayRefs, dayEls } = useMemo(() => {
        const dayRefsResult: React.Ref<HTMLTableRowElement>[] = [];
        const dayElsResult: JSX.Element[] = [];

        for (const startOfDayTime of startsOfDaysTimes) {
            const ref = React.createRef<HTMLTableRowElement>();
            const el = (
                <Day
                    key={startOfDayTime.toMillis()}
                    startOfDayTime={startOfDayTime}
                    eventFilter={eventFilter}
                    sortedRooms={sortedRooms}
                    sortedTags={sortedTags}
                    timezone={timezone}
                    ref={ref}
                    renderImmediately={startsOfDaysTimes.length <= 4}
                />
            );
            dayRefsResult.push(ref);
            dayElsResult.push(el);
        }

        return {
            dayRefs: dayRefsResult,
            dayEls: dayElsResult,
        };
    }, [eventFilter, sortedRooms, sortedTags, startsOfDaysTimes, timezone]);

    const scrollbarColour = useColorModeValue("gray.500", "gray.200");
    const scrollbarBackground = useColorModeValue("gray.200", "gray.500");
    const scrollbarColourT = useToken("colors", scrollbarColour);
    const scrollbarBackgroundT = useToken("colors", scrollbarBackground);

    const timeBoxBgColor = useColorModeValue("gray.50", "gray.900");
    const roomHeadingBgColor = useColorModeValue("gray.50", "gray.900");

    return (
        <VStack w="100%" overflow="hidden">
            <Text py={2}>
                This schedule view is an early prototype we are using to gather user feedback and to demonstrate the
                direction we are headed in. Important features like accessibility properties, jump-to-day/jump-to-now
                and other features are yet to be implemented.
            </Text>
            <Box
                pos="relative"
                h="100%"
                maxH="95vh"
                w="97%"
                overflow="auto"
                css={{
                    scrollbarWidth: "thin",
                    scrollbarColor: `${scrollbarColour} ${scrollbarBackground}`,
                    "&::-webkit-scrollbar": {
                        width: "6px",
                        height: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                        width: "8px",
                        height: "8px",
                        background: scrollbarBackgroundT,
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: scrollbarColourT,
                        borderRadius: "24px",
                    },
                }}
                onScroll={() => {
                    // TODO: Does this event trigger when auto-scroll is activated?
                    // If so, somehow we have to eliminate the loop
                    shouldAutoScrollToNow.current = false;
                }}
            >
                <Table
                    variant="unstyled"
                    maxW="100%"
                    minW={`calc(${sortedRooms.length * 350}px + 4em)`}
                    __css={{ tableLayout: "fixed", borderCollapse: "separate", borderSpacing: "3px 0" }}
                >
                    <Tr>
                        <Th
                            pos="sticky"
                            top={0}
                            left={0}
                            bgColor={timeBoxBgColor}
                            zIndex={3}
                            whiteSpace="nowrap"
                            minW="min-content"
                            maxW="8em"
                            w="6em"
                            overflow="hidden"
                        >
                            Time
                        </Th>
                        {sortedRooms.map((room) => (
                            <Th
                                key={room.id}
                                pos="sticky"
                                top={0}
                                bgColor={roomHeadingBgColor} /* TODO: bgColor={room.colour} */
                                whiteSpace="nowrap"
                                zIndex={1}
                                textAlign="center"
                                w="350px"
                            >
                                {room.name}
                            </Th>
                        ))}
                    </Tr>
                    {dayEls}
                </Table>
            </Box>
        </VStack>
    );
}
