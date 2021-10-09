import React, { PropsWithChildren, useContext, useEffect } from "react";
import { gql } from "urql";
import { useGetAllRoomParticipantsQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import usePolling from "../Generic/usePolling";
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
    const [{ fetching: loading, error, data }, refetch] = useGetAllRoomParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pause: paused,
        requestPolicy: "cache-and-network",
    });
    const { start: startPolling, stop: stopPolling } = usePolling(refetch, 60000, false);
    useEffect(() => {
        if (paused) {
            stopPolling();
        } else {
            startPolling();
        }
    }, [paused, startPolling, stopPolling]);

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
