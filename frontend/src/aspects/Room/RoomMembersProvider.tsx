import { gql } from "@apollo/client";
import React from "react";
import { useGetRoomMembersSubscription } from "../../generated/graphql";
import { RoomMembersContext } from "./useRoomMembers";

gql`
    subscription GetRoomMembers($roomId: uuid!) {
        Room_by_pk(id: $roomId) {
            ...RoomPeople
        }
    }

    fragment RoomPeople on Room {
        roomPeople(order_by: { attendee: { displayName: asc } }) {
            id
            roomPersonRoleName
            attendee {
                displayName
                id
            }
        }
    }
`;

export default function RoomMembersProvider({
    roomId,
    children,
}: {
    roomId: string;
    children: string | React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const { loading, error, data } = useGetRoomMembersSubscription({
        variables: {
            roomId,
        },
    });

    const value = loading ? undefined : error ? false : data?.Room_by_pk ?? false;

    return <RoomMembersContext.Provider value={value}>{children}</RoomMembersContext.Provider>;
}
