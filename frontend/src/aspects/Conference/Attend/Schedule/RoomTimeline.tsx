import { Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    Timeline_EventFragment,
    Timeline_RoomFragment,
    Timeline_SelectRoomQuery,
    useTimeline_SelectRoomQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import EventBox from "./EventBox";
import Scroller from "./Scroller";
import TimelineZoomControls from "./TimelineZoomControls";
import { TimelineParameters } from "./useTimelineParameters";

function RoomTimelineContents({
    groupedEvents,
    room,
}: {
    groupedEvents: Timeline_EventFragment[][];
    room: Timeline_RoomFragment;
}): JSX.Element {
    const eventBoxes = useMemo(
        () => groupedEvents.map((events) => <EventBox roomName={room.name} key={events[0].id} sortedEvents={events} />),
        [groupedEvents, room.name]
    );
    return <>{eventBoxes}</>;
}

function RoomTimelineInner({
    room,
    hideTimeZoomButtons = true,
    useScroller = false,
    height = 50,
    backgroundColor,
}: {
    room: Timeline_RoomFragment;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
        height?: number;
        backgroundColor?: string;
}): JSX.Element {
    const groupedEvents = useMemo(() => {
        const result: Timeline_EventFragment[][] = [];
        const sortedEvents = [...room.events].sort((x, y) => Date.parse(x.startTime) - Date.parse(y.startTime));

        let currentEventsGroup: Timeline_EventFragment[] = [];
        for (let idx = 0; idx < sortedEvents.length; idx++) {
            const event = sortedEvents[idx];
            const compareEvent = currentEventsGroup.length > 0 ? currentEventsGroup[0] : undefined;
            if (
                !compareEvent ||
                (compareEvent.contentGroup &&
                    compareEvent.contentGroup.id === event.contentGroup?.id &&
                    Math.abs(
                        Date.parse(event.startTime) -
                            (Date.parse(compareEvent.startTime) + compareEvent.durationSeconds * 1000)
                    ) <
                        1000 * 600)
            ) {
                currentEventsGroup.push(event);
            } else {
                result.push(currentEventsGroup);
                currentEventsGroup = [event];
            }
        }
        if (currentEventsGroup.length > 0) {
            result.push(currentEventsGroup);
        }

        return result;
    }, [room.events]);

    return (
        <Box pos="relative" w="100%" h={height + "px"} backgroundColor={backgroundColor}>
            {useScroller ? (
                <Scroller height={height}>
                    <RoomTimelineContents groupedEvents={groupedEvents} room={room} />
                </Scroller>
            ) : (
                <RoomTimelineContents groupedEvents={groupedEvents} room={room} />
            )}
            {!hideTimeZoomButtons ? (
                <Box pos="absolute" top="0" right="0">
                    <TimelineZoomControls />
                </Box>
            ) : undefined}
        </Box>
    );
}

function RoomTimelineFetchWrapper({
    roomId,
    hideTimeZoomButtons = false,
    useScroller = true,
    height,
    backgroundColor,
}: {
    roomId: string;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
    backgroundColor?: string;
}): JSX.Element {
    const roomResult = useTimeline_SelectRoomQuery({
        variables: {
            id: roomId,
        },
    });

    const eventInfo = useMemo(
        () =>
            roomResult.data?.Room_by_pk?.events.reduce(
                (x, event) => {
                    const startT = Date.parse(event.startTime);
                    const endT = startT + event.durationSeconds * 1000;
                    if (startT < x.roomEarliest) {
                        if (endT > x.roomLatest) {
                            return {
                                roomEarliest: startT,
                                roomLatest: endT,
                            };
                        } else {
                            return {
                                roomEarliest: startT,
                                roomLatest: x.roomLatest,
                            };
                        }
                    } else if (endT > x.roomLatest) {
                        return {
                            roomEarliest: x.roomEarliest,
                            roomLatest: endT,
                        };
                    }
                    return x;
                },
                { roomEarliest: Number.POSITIVE_INFINITY, roomLatest: Number.NEGATIVE_INFINITY }
            ),
        [roomResult.data?.Room_by_pk?.events]
    );

    return (
        <ApolloQueryWrapper<Timeline_SelectRoomQuery, unknown, Timeline_RoomFragment>
            queryResult={roomResult}
            getter={(x) => x.Room_by_pk}
        >
            {(room) => (
                <TimelineParameters
                    earliestEventStart={eventInfo?.roomEarliest ?? 0}
                    latestEventEnd={eventInfo?.roomLatest ?? 0}
                >
                    <RoomTimelineInner
                        room={room}
                        hideTimeZoomButtons={hideTimeZoomButtons}
                        useScroller={useScroller}
                        height={height}
                        backgroundColor={backgroundColor}
                    />
                </TimelineParameters>
            )}
        </ApolloQueryWrapper>
    );
}

type Props = {
    room: string | Timeline_RoomFragment;
    hideTimeShiftButtons?: boolean;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
};

export default function RoomTimeline({ room, ...props }: Props): JSX.Element {
    if (typeof room === "string") {
        return <RoomTimelineFetchWrapper roomId={room} {...props} />;
    } else {
        return <RoomTimelineInner room={room} {...props} />;
    }
}
