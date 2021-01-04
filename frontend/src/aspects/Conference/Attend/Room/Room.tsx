import React from "react";
import type { RoomDetailsFragment } from "../../../../generated/graphql";
import { BreakoutRoom } from "./BreakoutRoom";
import { EventRoom } from "./EventRoom";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

export function Room({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const currentRoomEvent = useCurrentRoomEvent(roomDetails);

    return currentRoomEvent ? <EventRoom roomDetails={roomDetails} /> : <BreakoutRoom roomDetails={roomDetails} />;
}
