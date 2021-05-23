import * as R from "ramda";
import React, { useMemo } from "react";
import { useLiveEvents } from "../../../../LiveEvents/LiveEvents";
import RoomSummary from "./RoomsSummary";

export default function LiveProgramRooms(): JSX.Element {
    const { liveEventsByRoom } = useLiveEvents();

    const roomIds = useMemo(() => R.sortBy((x) => liveEventsByRoom[x][0].room.name, Object.keys(liveEventsByRoom)), [
        liveEventsByRoom,
    ]);

    return <RoomSummary rooms={roomIds.map((roomId) => ({ roomId, eventId: liveEventsByRoom[roomId][0].id }))} />;
}
