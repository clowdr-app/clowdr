import { gql } from "@apollo/client";
import React from "react";
import { useGetAllRoomParticipantsQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { RoomParticipantsContext } from "./useRoomParticipants";

gql`
    query GetAllRoomParticipants($conferenceId: uuid!) {
        room_Participant(where: { conferenceId: { _eq: $conferenceId } }) {
            ...RoomParticipantDetails
        }
    }

    fragment RoomParticipantDetails on room_Participant {
        conferenceId
        id
        roomId
        registrantId
    }
`;

function ParticipantsProvider_Polling({
    children,
}: {
    children: string | React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useGetAllRoomParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 1200000,
        fetchPolicy: "network-only",
    });

    const value = loading ? undefined : error ? false : data?.room_Participant ?? false;

    return <RoomParticipantsContext.Provider value={value}>{children}</RoomParticipantsContext.Provider>;
}

export default function ParticipantsProvider({
    children,
}: {
    children: string | React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const mRegistrant = useMaybeCurrentRegistrant();
    if (!mRegistrant) {
        return <RoomParticipantsContext.Provider value={[]}>{children}</RoomParticipantsContext.Provider>;
    }

    return <ParticipantsProvider_Polling>{children}</ParticipantsProvider_Polling>;
}
