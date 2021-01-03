import { Box } from "@chakra-ui/react";
import React, { useEffect, useMemo } from "react";
import {
    Timeline_EventFragment,
    Timeline_RoomFragment,
    Timeline_SelectRoomQuery,
    useTimeline_SelectRoomQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import EventBox from "./EventBox";
import Scoller from "./Scroller";
import TimelineShiftButtons from "./TimelineShiftButtons";
import TimelineZoomControls from "./TimelineZoomControls";
import useTimelineParameters, { TimelineParameters } from "./useTimelineParameters";

function RoomTimelineInner({
    room,
    hideTimeShiftButtons = true,
    hideTimeZoomButtons = true,
    useScroller = false,
    height = 50,
}: {
    room: Timeline_RoomFragment;
    hideTimeShiftButtons?: boolean;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
}): JSX.Element {
    const params = useTimelineParameters();

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

    const contents = useMemo(() => {
        return groupedEvents.map((events) => (
            <EventBox roomName={room.name} key={events[0].id} sortedEvents={events} />
        ));
    }, [groupedEvents, room.name]);

    useEffect(() => {
        for (const event of room.events) {
            params.notifyEventStart(Date.parse(event.startTime));
            params.notifyEventEnd(Date.parse(event.startTime) + event.durationSeconds * 1000);
        }
    }, [params, room.events]);

    return (
        <Box pos="relative" w="100%" h={height}>
            {useScroller ? (
                <Scoller
                    visibleTimeSpanSeconds={params.visibleTimeSpanSeconds}
                    fullTimeSpanSeconds={params.fullTimeSpanSeconds}
                    startAtTimeOffsetSeconds={params.startTimeOffsetSeconds}
                    height={height}
                >
                    {contents}
                </Scoller>
            ) : (
                contents
            )}
            {!hideTimeZoomButtons ? (
                <Box pos="absolute" top="0" right="0">
                    <TimelineZoomControls />
                </Box>
            ) : undefined}
            {!hideTimeShiftButtons ? <TimelineShiftButtons /> : undefined}
        </Box>
    );
}

function RoomTimelineFetchWrapper({
    roomId,
    hideTimeShiftButtons = false,
    hideTimeZoomButtons = false,
    useScroller = true,
    height,
}: {
    roomId: string;
    hideTimeShiftButtons?: boolean;
    hideTimeZoomButtons?: boolean;
    useScroller?: boolean;
    height?: number;
}): JSX.Element {
    const roomResult = useTimeline_SelectRoomQuery({
        variables: {
            id: roomId,
        },
    });
    return (
        <ApolloQueryWrapper<Timeline_SelectRoomQuery, unknown, Timeline_RoomFragment>
            queryResult={roomResult}
            getter={(x) => x.Room_by_pk}
        >
            {(room) => (
                <TimelineParameters>
                    <RoomTimelineInner
                        room={room}
                        hideTimeShiftButtons={hideTimeShiftButtons}
                        hideTimeZoomButtons={hideTimeZoomButtons}
                        useScroller={useScroller}
                        height={height}
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
