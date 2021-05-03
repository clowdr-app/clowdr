import React from "react";
import type { RegistrantDataFragment, RoomMemberFragment } from "../../generated/graphql";

export type RoomMembersInfo = { member: RoomMemberFragment; registrant?: RegistrantDataFragment | null };

export type RoomMembersInfos = RoomMembersInfo[] | false | undefined;

export const RoomMembersContext = React.createContext<RoomMembersInfos>(undefined);

export default function useRoomMembers(): RoomMembersInfos {
    return React.useContext(RoomMembersContext);
}
