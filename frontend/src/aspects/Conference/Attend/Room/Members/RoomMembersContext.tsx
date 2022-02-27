import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { PropsWithChildren } from "react";
import React, { createContext, useMemo } from "react";
import { gql } from "urql";
import type { RoomMemberFragment } from "../../../../../generated/graphql";
import {
    Registrant_RegistrantRole_Enum,
    Room_PersonRole_Enum,
    useGetRoomMembersQuery,
} from "../../../../../generated/graphql";
import { makeContext } from "../../../../GQL/make-context";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import useCurrentRegistrant from "../../../useCurrentRegistrant";

gql`
    query GetRoomMembers($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            managementModeName
            roomMemberships {
                ...RoomMember
            }
        }
    }

    fragment RoomMember on room_RoomMembership {
        id
        roomId
        personRoleName
        registrantId
    }
`;

interface Props {
    roomId: string;
}

interface Result {
    roomMembers?: readonly RoomMemberFragment[];
    loading: boolean;
    canAddMembersAs?: HasuraRoleName;
}

function useValue(props: Props): Result {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: props.roomId,
            }),
        [props.roomId]
    );
    const [{ fetching: loading, error, data }] = useGetRoomMembersQuery({
        variables: {
            roomId: props.roomId,
        },
        context,
    });
    useQueryErrorToast(error, true, "RoomMembersProvider:GetRoomMembers");

    const currentRegistrant = useCurrentRegistrant();

    const canAddMembersAs =
        data?.room_Room_by_pk?.roomMemberships?.find((r) => r.registrantId === currentRegistrant.id)?.personRoleName ===
        Room_PersonRole_Enum.Admin
            ? HasuraRoleName.RoomAdmin
            : currentRegistrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer
            ? HasuraRoleName.ConferenceOrganizer
            : undefined;

    return {
        roomMembers: data?.room_Room_by_pk?.roomMemberships,
        loading,
        canAddMembersAs,
    };
}

export const RoomMembersContext = createContext({} as ReturnType<typeof useValue>);

export function RoomMembersProvider(props: PropsWithChildren<Props>): JSX.Element {
    return <RoomMembersContext.Provider value={useValue(props)}>{props.children}</RoomMembersContext.Provider>;
}

export type RoomMembersInfos = readonly RoomMemberFragment[] | false | undefined;
