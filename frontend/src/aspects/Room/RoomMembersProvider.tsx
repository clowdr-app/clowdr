import { gql } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import { AttendeeDataFragment, useGetRoomMembersSubscription } from "../../generated/graphql";
import { useAttendeesContext } from "../Conference/AttendeesContext";
import { RoomMembersContext, RoomMembersInfo, RoomMembersInfos } from "./useRoomMembers";

gql`
    subscription GetRoomMembers($roomId: uuid!) {
        RoomPerson(where: { roomId: { _eq: $roomId } }) {
            ...RoomMember
        }
    }

    fragment RoomMember on RoomPerson {
        id
        roomPersonRoleName
        attendeeId
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

    const attendeesCtx = useAttendeesContext();
    const [value, setValue] = useState<RoomMembersInfos | false>(false);
    const onAttendeeUpdated = useCallback((data: AttendeeDataFragment) => {
        setValue((oldVals) => {
            return oldVals
                ? oldVals.map((x) =>
                      x.member.attendeeId === data.id
                          ? {
                                ...x,
                                attendee: data,
                            }
                          : x
                  )
                : oldVals;
        });
    }, []);

    useEffect(() => {
        if (error) {
            setValue(false);
        } else if (!loading && data) {
            data.RoomPerson.map((person) => attendeesCtx.subscribe(person.attendeeId, onAttendeeUpdated));

            setValue((oldVals) => {
                if (oldVals) {
                    const addedMembers = data.RoomPerson.filter((x) => !oldVals.some((y) => y.member.id === x.id));
                    return [
                        ...addedMembers.map((member) => ({ member })),
                        ...(oldVals
                            ? oldVals.reduce<RoomMembersInfo[]>((acc, member) => {
                                  const updated = data.RoomPerson.find((y) => y.id === member.member.id);
                                  if (updated) {
                                      return [
                                          ...acc,
                                          {
                                              attendee: member.attendee,
                                              member: updated,
                                          },
                                      ];
                                  }
                                  return acc;
                              }, [])
                            : []),
                    ];
                } else {
                    return data.RoomPerson.map((member) => ({
                        member,
                    }));
                }
            });
        }
    }, [attendeesCtx, data, error, loading, onAttendeeUpdated]);

    return <RoomMembersContext.Provider value={value}>{children}</RoomMembersContext.Provider>;
}
