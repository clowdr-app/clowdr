import { gql } from "@urql/core";
import type { PropsWithChildren } from "react";
import React, { useContext } from "react";
import { useGetAllRoomParticipantsQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { EnableRoomParticipantsPollingContext } from "./EnableRoomParticipantsPollingContext";
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

function ParticipantsProvider_Polling({ children }: PropsWithChildren<Record<string, unknown>>): JSX.Element {
    const conference = useConference();
    const { paused } = useContext(EnableRoomParticipantsPollingContext);
    const { loading, error, data } = useGetAllRoomParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: paused ? 0 : 60000,
        fetchPolicy: "network-only",
    });

    const value = loading ? undefined : error ? false : data?.room_Participant ?? false;

    return <RoomParticipantsContext.Provider value={value}>{children}</RoomParticipantsContext.Provider>;
}

export default function ParticipantsProvider({ children }: PropsWithChildren<Record<string, unknown>>): JSX.Element {
    const mRegistrant = useMaybeCurrentRegistrant();
    if (!mRegistrant) {
        return <RoomParticipantsContext.Provider value={[]}>{children}</RoomParticipantsContext.Provider>;
    }

    return <ParticipantsProvider_Polling>{children}</ParticipantsProvider_Polling>;
}
