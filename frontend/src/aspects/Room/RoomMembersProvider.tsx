import { AuthHeader } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useGetRoomMembersQuery } from "../../generated/graphql";
import { makeContext } from "../GQL/make-context";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import type { RoomMembersInfos } from "./useRoomMembers";
import { RoomMembersContext } from "./useRoomMembers";

gql`
    query GetRoomMembers($roomId: uuid!) {
        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {
            ...RoomMember
        }
    }

    fragment RoomMember on room_RoomMembership {
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
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId]
    );
    const [{ fetching: loading, error, data }] = useGetRoomMembersQuery({
        variables: {
            roomId,
        },
        context,
    });
    useQueryErrorToast(error, true, "RoomMembersProvider:GetRoomMembers");

    const value: RoomMembersInfos = useMemo(
        () => (data ? data.room_RoomMembership : loading ? false : undefined),
        [data, loading]
    );

    return <RoomMembersContext.Provider value={value}>{children}</RoomMembersContext.Provider>;
}
