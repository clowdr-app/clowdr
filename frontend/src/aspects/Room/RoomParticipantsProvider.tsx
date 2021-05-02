import { gql } from "@apollo/client";
import React from "react";
import { useGetAllRoomParticipantsQuery, useGetRoomParticipantsSubscription } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { RoomParticipantsContext } from "./useRoomParticipants";

gql`
    subscription GetRoomParticipants($conferenceId: uuid!, $roomId: uuid!) {
        room_Participant(where: { conferenceId: { _eq: $conferenceId }, roomId: { _eq: $roomId } }) {
            ...RoomParticipantDetails
        }
    }

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

function ParticipantsProvider_Subd({
    children,
    roomId,
}: {
    children: string | React.ReactNode | React.ReactNodeArray;
    roomId: string;
}): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useGetRoomParticipantsSubscription({
        variables: {
            conferenceId: conference.id,
            roomId,
        },
    });

    const value = loading ? undefined : error ? false : data?.RoomParticipant ?? false;

    return <RoomParticipantsContext.Provider value={value}>{children}</RoomParticipantsContext.Provider>;
}

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
        pollInterval: 30000,
        fetchPolicy: "network-only",
    });

    const value = loading ? undefined : error ? false : data?.RoomParticipant ?? false;

    return <RoomParticipantsContext.Provider value={value}>{children}</RoomParticipantsContext.Provider>;
}

export default function ParticipantsProvider({
    children,
    roomId,
}: {
    children: string | React.ReactNode | React.ReactNodeArray;
    roomId?: string;
}): JSX.Element {
    const mRegistrant = useMaybeCurrentRegistrant();
    if (!mRegistrant) {
        return <RoomParticipantsContext.Provider value={[]}>{children}</RoomParticipantsContext.Provider>;
    }

    if (roomId) {
        return <RoomParticipantsProvider_Subd roomId={roomId}>{children}</RoomParticipantsProvider_Subd>;
    } else {
        return <RoomParticipantsProvider_Polling>{children}</RoomParticipantsProvider_Polling>;
    }
}
