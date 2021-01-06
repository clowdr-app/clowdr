import * as R from "ramda";
import { useCallback, useEffect, useState } from "react";
import type { RoomEventDetailsFragment, RoomEventsFragment } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";

interface Result {
    currentRoomEvent: RoomEventDetailsFragment | null;
    nextRoomEvent: RoomEventDetailsFragment | null;
    withinThreeMinutesOfEvent: boolean;
}

export function useCurrentRoomEvent(roomEvents: RoomEventsFragment): Result {
    const [currentRoomEvent, setCurrentRoomEvent] = useState<RoomEventDetailsFragment | null>(null);
    const getCurrentEvent = useCallback(() => {
        const now = new Date().getTime();
        const eventsNow = roomEvents.events.filter((event) => {
            const startTime = Date.parse(event.startTime);
            const endTime = Date.parse(event.endTime);
            return startTime < now && now < endTime;
        });
        if (eventsNow.length > 0) {
            setCurrentRoomEvent(eventsNow[0]);
        } else {
            setCurrentRoomEvent(null);
        }
    }, [roomEvents.events]);
    usePolling(getCurrentEvent, 10000, true);

    const [withinThreeMinutesOfEvent, setWithinThreeMinutesOfEvent] = useState<boolean>(false);
    const getWithinThreeMinutesOfEvent = useCallback(() => {
        const now = new Date().getTime();
        const eventsSoon = roomEvents.events.filter((event) => {
            const startTime = Date.parse(event.startTime);
            const endTime = Date.parse(event.endTime);
            return startTime - 3 * 60 * 1000 < now && now < endTime + 3 * 60 * 1000;
        });
        setWithinThreeMinutesOfEvent(eventsSoon.length > 0);
    }, [roomEvents.events]);
    usePolling(getWithinThreeMinutesOfEvent, 10000, true);

    const [nextRoomEvent, setNextRoomEvent] = useState<RoomEventDetailsFragment | null>(null);
    const getNextEvent = useCallback(() => {
        const now = new Date().getTime();
        const sortedEvents = R.sortBy((event) => event.startTime, roomEvents.events);
        const futureEvents = sortedEvents.filter((event) => Date.parse(event.startTime) > now);
        setNextRoomEvent(futureEvents.length > 0 ? futureEvents[0] : null);
    }, [roomEvents.events]);

    usePolling(getNextEvent, 10000, true);

    useEffect(() => {
        getCurrentEvent();
        getWithinThreeMinutesOfEvent();
        getNextEvent();
    }, [getCurrentEvent, getNextEvent, getWithinThreeMinutesOfEvent]);

    return { currentRoomEvent, withinThreeMinutesOfEvent, nextRoomEvent };
}
