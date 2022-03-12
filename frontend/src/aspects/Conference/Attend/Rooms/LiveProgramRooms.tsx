import * as R from "ramda";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "urql";
import type { RoomTile_GetRoomQuery, RoomTile_GetRoomQueryVariables } from "../../../../generated/graphql";
import { RoomTile_GetRoomDocument } from "../../../../generated/graphql";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useLiveEvents } from "../../../LiveEvents/LiveEvents";
import RoomSummary from "./RoomsSummary";

export default function LiveProgramRooms(): JSX.Element {
    const { liveEventsByRoom } = useLiveEvents();

    const roomIds = useMemo(
        () => R.sortBy((x) => liveEventsByRoom[x][0].room.name, Object.keys(liveEventsByRoom)),
        [liveEventsByRoom]
    );

    return <RoomSummary rooms={roomIds.map((roomId) => ({ roomId, eventId: liveEventsByRoom[roomId][0].id }))} />;
}

export function usePreloadedLiveProgramRooms(): void {
    const [shouldPreload, setShouldPreload] = useState<boolean>(false);
    const lastPreloadTime = useRef<number>(0);
    const { liveEventsInNextHour } = useLiveEvents();
    const now60s = useRealTime(60 * 1000);
    const preloadEvents = useMemo(
        () =>
            liveEventsInNextHour.filter((event) => {
                const timeDiff = Date.parse(event.scheduledStartTime) - now60s;
                return 0 < timeDiff && timeDiff <= 10 * 60 * 1000;
            }),
        [liveEventsInNextHour, now60s]
    );
    useEffect(() => {
        let tId: number | undefined;
        if (preloadEvents.length > 0) {
            tId = setTimeout(
                (() => {
                    setShouldPreload(true);
                }) as TimerHandler,
                Math.random() * 7 * 60 * 1000
            );
        } else {
            setShouldPreload(false);
        }
        return () => {
            if (tId !== undefined) {
                clearTimeout(tId);
            }
        };
    }, [preloadEvents]);

    const client = useClient();
    useEffect(() => {
        if (shouldPreload && Date.now() - lastPreloadTime.current > 30 * 60 * 1000) {
            lastPreloadTime.current = Date.now();
            preloadEvents
                .filter((event) => !!event.room)
                .map((event) =>
                    client.query<RoomTile_GetRoomQuery, RoomTile_GetRoomQueryVariables>(RoomTile_GetRoomDocument, {
                        eventId: event.id,
                        roomId: event.room.id,
                        withEvent: true,
                    })
                );
        }
    }, [client, preloadEvents, shouldPreload]);
}
