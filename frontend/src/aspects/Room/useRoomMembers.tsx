import React from "react";
import type { AttendeeDataFragment, RoomMemberFragment } from "../../generated/graphql";

export type RoomMembersInfo = { member: RoomMemberFragment; attendee?: AttendeeDataFragment | null };

export type RoomMembersInfos = RoomMembersInfo[] | false | undefined;

export const RoomMembersContext = React.createContext<RoomMembersInfos>(undefined);

export default function useRoomMembers(): RoomMembersInfos {
    return React.useContext(RoomMembersContext);
}
