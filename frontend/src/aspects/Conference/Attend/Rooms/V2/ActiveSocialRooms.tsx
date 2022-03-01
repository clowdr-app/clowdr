import * as R from "ramda";
import React, { useMemo } from "react";
import type { RoomParticipantDetailsFragment } from "../../../../../generated/graphql";
import { useLiveEvents } from "../../../../LiveEvents/LiveEvents";
import useRoomParticipants from "../../../../Room/useRoomParticipants";
import RoomSummary from "./RoomsSummary";

export default function ActiveSocialRooms({
    excludeLiveEventRooms,
    alignLeft,
}: {
    excludeLiveEventRooms: boolean;
    alignLeft?: boolean;
}): JSX.Element {
    const roomParticipants = useRoomParticipants();

    if (roomParticipants) {
        return (
            <ActiveSocialRoomsInner
                roomParticipants={roomParticipants}
                excludeLiveEventRooms={excludeLiveEventRooms}
                alignLeft={alignLeft}
            />
        );
    } else {
        return <></>;
    }
}

function ActiveSocialRoomsInner({
    roomParticipants,
    excludeLiveEventRooms,
    alignLeft,
}: {
    roomParticipants: readonly RoomParticipantDetailsFragment[];
    excludeLiveEventRooms: boolean;
    alignLeft?: boolean;
}): JSX.Element {
    const { liveEventsByRoom } = useLiveEvents();

    const rooms = useMemo(() => {
        const result = R.uniq(roomParticipants.map((x) => x.roomId)).map((roomId) => ({ roomId }));
        if (excludeLiveEventRooms) {
            return result.filter((x) => !(x.roomId in liveEventsByRoom));
        } else {
            return result;
        }
    }, [roomParticipants, excludeLiveEventRooms, liveEventsByRoom]);

    return <RoomSummary rooms={rooms} alignLeft={alignLeft} />;
}
