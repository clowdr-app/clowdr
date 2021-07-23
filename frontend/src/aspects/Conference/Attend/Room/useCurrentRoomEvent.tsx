import * as R from "ramda";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Room_EventSummaryFragment, Room_Mode_Enum } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";

interface Result {
    currentRoomEvent: Room_EventSummaryFragment | null;
    nextRoomEvent: Room_EventSummaryFragment | null;
    nonCurrentLiveEvents: Room_EventSummaryFragment[] | null;
    nonCurrentLiveEventsInNext20Mins: Room_EventSummaryFragment[] | null;
    withinThreeMinutesOfBroadcastEvent: boolean;
    broadcastEventStartsAt: number;
    zoomEventStartsAt: number;
}

export function useCurrentRoomEvent(roomEvents: readonly Room_EventSummaryFragment[]): Result {
    const broadcastEvents = useMemo(
        () =>
            roomEvents.filter((event) =>
                [Room_Mode_Enum.Prerecorded, Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(
                    event.intendedRoomModeName
                )
            ),
        [roomEvents]
    );

    const zoomEvents = useMemo(
        () => roomEvents.filter((event) => event.intendedRoomModeName === Room_Mode_Enum.Zoom),
        [roomEvents]
    );

    const [currentRoomEvent, setCurrentRoomEvent] = useState<Room_EventSummaryFragment | null>(null);
    const getCurrentEvent = useCallback(() => {
        const now = Date.now();
        const eventsNow = roomEvents.filter((event) => {
            const startTime = Date.parse(event.startTime);
            const endTime = Date.parse(event.endTime);
            return startTime <= now && now < endTime;
        });
        if (eventsNow.length > 0) {
            setCurrentRoomEvent(eventsNow[0]);
        } else {
            setCurrentRoomEvent(null);
        }
    }, [roomEvents]);

    const [withinThreeMinutesOfBroadcastEvent, setWithinThreeMinutesOfBroadcastEvent] = useState<boolean>(false);
    const getWithinThreeMinutesOfEvent = useCallback(() => {
        const now = Date.now();
        const eventsSoon = broadcastEvents.filter((event) => {
            const startTime = Date.parse(event.startTime);
            const endTime = Date.parse(event.endTime);
            return startTime - 3 * 60 * 1000 < now && now < endTime + 3 * 60 * 1000;
        });
        setWithinThreeMinutesOfBroadcastEvent(eventsSoon.length > 0);
    }, [broadcastEvents]);

    const [broadcastEventStartsAt, setBroadcastEventStartsAt] = useState<number>(Number.MAX_SAFE_INTEGER);
    const computeSecondsUntilBroadcastEvent = useCallback(() => {
        setBroadcastEventStartsAt(
            broadcastEvents.reduce((acc, ev) => Math.min(acc, Date.parse(ev.startTime)), Number.MAX_SAFE_INTEGER)
        );
    }, [broadcastEvents]);

    const [zoomEventStartsAt, setZoomEventStartsAt] = useState<number>(Number.MAX_SAFE_INTEGER);
    const computeSecondsUntilZoomEvent = useCallback(() => {
        setZoomEventStartsAt(
            zoomEvents.reduce((acc, ev) => Math.min(acc, Date.parse(ev.startTime)), Number.MAX_SAFE_INTEGER)
        );
    }, [zoomEvents]);

    const frequentUpdate = useCallback(() => {
        computeSecondsUntilZoomEvent();
        computeSecondsUntilBroadcastEvent();
    }, [computeSecondsUntilBroadcastEvent, computeSecondsUntilZoomEvent]);
    usePolling(frequentUpdate, 1000, true);

    const [nextRoomEvent, setNextRoomEvent] = useState<Room_EventSummaryFragment | null>(null);
    const getNextEvent = useCallback(() => {
        const now = Date.now();
        const sortedEvents = R.sortBy((event) => Date.parse(event.startTime), roomEvents);
        const futureEvents = sortedEvents.filter((event) => Date.parse(event.startTime) > now);
        setNextRoomEvent(futureEvents.length > 0 ? futureEvents[0] : null);
    }, [roomEvents]);

    const [nonCurrentLiveEvents, setNonCurrentEvents] = useState<Room_EventSummaryFragment[] | null>(null);
    const getNonCurrentEvents = useCallback(() => {
        const now = Date.now();
        const filteredEvents = roomEvents.filter((event) => {
            if (
                event.intendedRoomModeName !== Room_Mode_Enum.Presentation &&
                event.intendedRoomModeName !== Room_Mode_Enum.QAndA
            ) {
                return false;
            }

            const start = Date.parse(event.startTime);
            const end = Date.parse(event.endTime);
            return start > now && now < end;
        });
        const sortedEvents = R.sortBy((event) => Date.parse(event.startTime), filteredEvents);
        setNonCurrentEvents(sortedEvents);
    }, [roomEvents]);

    const [nonCurrentLiveEventsInNext20Mins, setNonCurrentEventsInNext20Mins] = useState<
        Room_EventSummaryFragment[] | null
    >(null);
    const getNonCurrentEventsInNext20Mins = useCallback(() => {
        const now = Date.now();
        const cutoff = now + 20 * 60 * 1000;
        const filteredEvents = roomEvents.filter((event) => {
            if (
                event.intendedRoomModeName !== Room_Mode_Enum.Presentation &&
                event.intendedRoomModeName !== Room_Mode_Enum.QAndA
            ) {
                return false;
            }

            const start = Date.parse(event.startTime);
            const end = Date.parse(event.endTime);
            return start > now && now < end && start <= cutoff;
        });
        const sortedEvents = R.sortBy((event) => Date.parse(event.startTime), filteredEvents);
        setNonCurrentEventsInNext20Mins(sortedEvents);
    }, [roomEvents]);

    const infrequentUpdate = useCallback(() => {
        getWithinThreeMinutesOfEvent();
        getCurrentEvent();
        getNextEvent();
        getNonCurrentEvents();
        getNonCurrentEventsInNext20Mins();
    }, [
        getCurrentEvent,
        getNextEvent,
        getNonCurrentEvents,
        getNonCurrentEventsInNext20Mins,
        getWithinThreeMinutesOfEvent,
    ]);
    usePolling(infrequentUpdate, 10000, true);

    useEffect(() => {
        infrequentUpdate();
    }, [infrequentUpdate]);

    const result = useMemo(
        () => ({
            currentRoomEvent,
            withinThreeMinutesOfBroadcastEvent,
            nextRoomEvent,
            nonCurrentLiveEvents,
            nonCurrentLiveEventsInNext20Mins,
            broadcastEventStartsAt,
            zoomEventStartsAt,
        }),
        [
            currentRoomEvent,
            nextRoomEvent,
            nonCurrentLiveEvents,
            nonCurrentLiveEventsInNext20Mins,
            broadcastEventStartsAt,
            zoomEventStartsAt,
            withinThreeMinutesOfBroadcastEvent,
        ]
    );

    return result;
}
