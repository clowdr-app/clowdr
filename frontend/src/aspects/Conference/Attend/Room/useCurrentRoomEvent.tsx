import * as R from "ramda";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Room_EventSummaryFragment } from "../../../../generated/graphql";
import { Schedule_Mode_Enum } from "../../../../generated/graphql";
import usePolling from "../../../Hooks/usePolling";

interface Result {
    currentRoomEvent: Room_EventSummaryFragment | null;
    nextRoomEvent: Room_EventSummaryFragment | null;
    nonCurrentLiveEvents: Room_EventSummaryFragment[] | null;
    nonCurrentLiveEventsInNext20Mins: Room_EventSummaryFragment[] | null;
    withinStreamLatencySinceBroadcastEvent: boolean;
    withinThreeMinutesOfBroadcastEvent: boolean;
    broadcastEventStartsAt: number;
    externalEventStartsAt: number;
}

export function useCurrentRoomEvent(roomEvents: readonly Room_EventSummaryFragment[]): Result {
    const broadcastEvents = useMemo(
        () => roomEvents.filter((event) => Schedule_Mode_Enum.Livestream === event.modeName),
        [roomEvents]
    );

    const externalEvents = useMemo(
        () => roomEvents.filter((event) => event.modeName === Schedule_Mode_Enum.External),
        [roomEvents]
    );

    const [currentRoomEvent, setCurrentRoomEvent] = useState<Room_EventSummaryFragment | null>(null);
    const getCurrentEvent = useCallback(() => {
        const now = Date.now();
        const eventsNow = roomEvents.filter((event) => {
            const scheduledStartTime = Date.parse(event.scheduledStartTime);
            const scheduledEndTime = Date.parse(event.scheduledEndTime);
            return scheduledStartTime <= now && now < scheduledEndTime;
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
            const scheduledStartTime = Date.parse(event.scheduledStartTime);
            const scheduledEndTime = Date.parse(event.scheduledEndTime);
            return scheduledStartTime - 3 * 60 * 1000 < now && now < scheduledEndTime + 3 * 60 * 1000;
        });
        setWithinThreeMinutesOfBroadcastEvent(eventsSoon.length > 0);
    }, [broadcastEvents]);

    const [withinStreamLatencySinceBroadcastEvent, setWithinStreamLatencySinceBroadcastEvent] =
        useState<boolean>(false);
    const getWithinStreamLatencySinceBroadcastEvent = useCallback(() => {
        const now = Date.now();
        const maybeOngoingStreams = broadcastEvents.filter((event) => {
            const scheduledStartTime = Date.parse(event.scheduledStartTime);
            const scheduledEndTime = Date.parse(event.scheduledEndTime);
            return scheduledStartTime < now && now < scheduledEndTime + 45 * 1000;
        });
        setWithinStreamLatencySinceBroadcastEvent(maybeOngoingStreams.length > 0);
    }, [broadcastEvents]);

    const [broadcastEventStartsAt, setBroadcastEventStartsAt] = useState<number>(Number.MAX_SAFE_INTEGER);
    const computeSecondsUntilBroadcastEvent = useCallback(() => {
        setBroadcastEventStartsAt(
            broadcastEvents.reduce(
                (acc, ev) => Math.min(acc, Date.parse(ev.scheduledStartTime)),
                Number.MAX_SAFE_INTEGER
            )
        );
    }, [broadcastEvents]);

    const [externalEventStartsAt, setExternalEventEventStartsAt] = useState<number>(Number.MAX_SAFE_INTEGER);
    const computeSecondsUntilExternalEventEvent = useCallback(() => {
        setExternalEventEventStartsAt(
            externalEvents.reduce(
                (acc, ev) => Math.min(acc, Date.parse(ev.scheduledStartTime)),
                Number.MAX_SAFE_INTEGER
            )
        );
    }, [externalEvents]);

    const frequentUpdate = useCallback(() => {
        computeSecondsUntilExternalEventEvent();
        computeSecondsUntilBroadcastEvent();
    }, [computeSecondsUntilBroadcastEvent, computeSecondsUntilExternalEventEvent]);
    usePolling(frequentUpdate, 1000, true);

    const [nextRoomEvent, setNextRoomEvent] = useState<Room_EventSummaryFragment | null>(null);
    const getNextEvent = useCallback(() => {
        const now = Date.now();
        const sortedEvents = R.sortBy((event) => Date.parse(event.scheduledStartTime), roomEvents);
        const futureEvents = sortedEvents.filter((event) => Date.parse(event.scheduledStartTime) > now);
        setNextRoomEvent(futureEvents.length > 0 ? futureEvents[0] : null);
    }, [roomEvents]);

    const [nonCurrentLiveEvents, setNonCurrentEvents] = useState<Room_EventSummaryFragment[] | null>(null);
    const getNonCurrentEvents = useCallback(() => {
        const now = Date.now();
        const filteredEvents = roomEvents.filter((event) => {
            if (event.modeName !== Schedule_Mode_Enum.Livestream) {
                return false;
            }

            const start = Date.parse(event.scheduledStartTime);
            const end = Date.parse(event.scheduledEndTime);
            return start > now && now < end;
        });
        const sortedEvents = R.sortBy((event) => Date.parse(event.scheduledStartTime), filteredEvents);
        setNonCurrentEvents(sortedEvents);
    }, [roomEvents]);

    const [nonCurrentLiveEventsInNext20Mins, setNonCurrentEventsInNext20Mins] = useState<
        Room_EventSummaryFragment[] | null
    >(null);
    const getNonCurrentEventsInNext20Mins = useCallback(() => {
        const now = Date.now();
        const cutoff = now + 20 * 60 * 1000;
        const filteredEvents = roomEvents.filter((event) => {
            if (event.modeName !== Schedule_Mode_Enum.Livestream) {
                return false;
            }

            const start = Date.parse(event.scheduledStartTime);
            const end = Date.parse(event.scheduledEndTime);
            return start > now && now < end && start <= cutoff;
        });
        const sortedEvents = R.sortBy((event) => Date.parse(event.scheduledStartTime), filteredEvents);
        setNonCurrentEventsInNext20Mins(sortedEvents);
    }, [roomEvents]);

    const infrequentUpdate = useCallback(() => {
        getWithinThreeMinutesOfEvent();
        getWithinStreamLatencySinceBroadcastEvent();
        getCurrentEvent();
        getNextEvent();
        getNonCurrentEvents();
        getNonCurrentEventsInNext20Mins();
    }, [
        getCurrentEvent,
        getNextEvent,
        getNonCurrentEvents,
        getNonCurrentEventsInNext20Mins,
        getWithinStreamLatencySinceBroadcastEvent,
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
            withinStreamLatencySinceBroadcastEvent,
            nextRoomEvent,
            nonCurrentLiveEvents,
            nonCurrentLiveEventsInNext20Mins,
            broadcastEventStartsAt,
            externalEventStartsAt,
        }),
        [
            currentRoomEvent,
            nextRoomEvent,
            nonCurrentLiveEvents,
            nonCurrentLiveEventsInNext20Mins,
            broadcastEventStartsAt,
            externalEventStartsAt,
            withinStreamLatencySinceBroadcastEvent,
            withinThreeMinutesOfBroadcastEvent,
        ]
    );

    return result;
}
