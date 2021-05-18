import React from "react";
import type { RoomMemberFragment } from "../../generated/graphql";

export type RoomMembersInfos = readonly RoomMemberFragment[] | false | undefined;

export const RoomMembersContext = React.createContext<RoomMembersInfos>(undefined);

export default function useRoomMembers(): RoomMembersInfos {
    return React.useContext(RoomMembersContext);
}
