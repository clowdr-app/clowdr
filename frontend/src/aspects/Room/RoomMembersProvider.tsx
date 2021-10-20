import { gql } from "@apollo/client";
import React, { useMemo } from "react";
import { useGetRoomMembersQuery } from "../../generated/graphql";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import type { RoomMembersInfos } from "./useRoomMembers";
import { RoomMembersContext } from "./useRoomMembers";

gql`
    query GetRoomMembers($roomId: uuid!) {
        room_RoomPerson(where: { roomId: { _eq: $roomId } }) {
            ...RoomMember
        }
    }

    fragment RoomMember on room_RoomPerson {
        id
        roomId
        personRoleName
        registrantId
    }
`;

export default function RoomMembersProvider({
    roomId,
    children,
}: {
    roomId: string;
    children: string | React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const { loading, error, data } = useGetRoomMembersQuery({
        variables: {
            roomId,
        },
    });
    useQueryErrorToast(error, true, "RoomMembersProvider:GetRoomMembers");

    const value: RoomMembersInfos = useMemo(() => (data ? data.room_RoomPerson : loading ? false : undefined), [
        data,
        loading,
    ]);

    return <RoomMembersContext.Provider value={value}>{children}</RoomMembersContext.Provider>;
}
