import { gql } from "@urql/core";
import type { PropsWithChildren} from "react";
import React, { useContext, useEffect } from "react";
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
    const [{ fetching: loading, error, data }, refetchGetAllRoomParticipantsQuery] = useGetAllRoomParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
        requestPolicy: "network-only",
    });
    const { start, stop } = usePolling(refetchGetAllRoomParticipantsQuery, 60000, paused);
    useEffect(() => {
        if (paused) {
            stop();
        } else {
            start();
        }
    }, [paused, start, stop]);

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
