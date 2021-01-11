import React from "react";
import type { RoomParticipantDetailsFragment } from "../../generated/graphql";

type RoomParticipantsInfos = readonly RoomParticipantDetailsFragment[] | false | undefined;

export const RoomParticipantsContext = React.createContext<RoomParticipantsInfos>(undefined);

export default function useRoomParticipants(): RoomParticipantsInfos {
    return React.useContext(RoomParticipantsContext);
}
