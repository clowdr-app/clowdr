import React from "react";
import type { RoomPeopleFragment } from "../../generated/graphql";

type RoomMembersInfos = RoomPeopleFragment | false | undefined;

export const RoomMembersContext = React.createContext<RoomMembersInfos>(undefined);

export default function useRoomMembers(): RoomMembersInfos {
    return React.useContext(RoomMembersContext);
}
