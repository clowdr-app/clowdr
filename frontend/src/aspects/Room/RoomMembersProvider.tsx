import { gql } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import { RegistrantDataFragment, useGetRoomMembersQuery } from "../../generated/graphql";
import { useRegistrantsContext } from "../Conference/RegistrantsContext";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { RoomMembersContext, RoomMembersInfo, RoomMembersInfos } from "./useRoomMembers";

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

    const registrantsCtx = useRegistrantsContext();
    const [value, setValue] = useState<RoomMembersInfos | false>(false);
    const onRegistrantUpdated = useCallback((data: RegistrantDataFragment) => {
        setValue((oldVals) => {
            return oldVals
                ? oldVals.map((x) =>
                      x.member.registrantId === data.id
                          ? {
                                ...x,
                                registrant: data,
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
            data.room_RoomPerson.forEach((person) => {
                if (person.registrantId) {
                    registrantsCtx.subscribe({ registrant: person.registrantId }, onRegistrantUpdated);
                }
            });

            setValue((oldVals) => {
                if (oldVals) {
                    const addedMembers = data.room_RoomPerson.filter((x) => !oldVals.some((y) => y.member.id === x.id));
                    return [
                        ...addedMembers.map((member) => ({ member })),
                        ...(oldVals
                            ? oldVals.reduce<RoomMembersInfo[]>((acc, member) => {
                                  const updated = data.room_RoomPerson.find((y) => y.id === member.member.id);
                                  if (updated) {
                                      return [
                                          ...acc,
                                          {
                                              registrant: member.registrant,
                                              member: updated,
                                          },
                                      ];
                                  }
                                  return acc;
                              }, [])
                            : []),
                    ];
                } else {
                    return data.room_RoomPerson.map((member) => ({
                        member,
                    }));
                }
            });
        }
    }, [registrantsCtx, data, error, loading, onRegistrantUpdated]);

    return <RoomMembersContext.Provider value={value}>{children}</RoomMembersContext.Provider>;
}
