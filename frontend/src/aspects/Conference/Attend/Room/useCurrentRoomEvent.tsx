import { useEffect, useState } from "react";
import type { RoomEventDetailsFragment, RoomEventsFragment } from "../../../../generated/graphql";

export function useCurrentRoomEvent(roomEvents: RoomEventsFragment): RoomEventDetailsFragment | null {
    const [currentRoomEvent, setCurrentRoomEvent] = useState<RoomEventDetailsFragment | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
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
        }, 10000);
        return () => clearInterval(interval);
    }, [roomEvents]);

    return currentRoomEvent;
}
