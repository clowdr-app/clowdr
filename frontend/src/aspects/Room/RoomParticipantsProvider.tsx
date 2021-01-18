import { gql } from "@apollo/client";
import React from "react";
import { useGetRoomParticipantsQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { RoomParticipantsContext } from "./useRoomParticipants";

gql`
    query GetRoomParticipants($conferenceId: uuid!) {
        RoomParticipant(where: { conferenceId: { _eq: $conferenceId } }) {
            ...RoomParticipantDetails
        }
    }

    fragment RoomParticipantDetails on RoomParticipant {
        attendeeId
        conferenceId
        id
        roomId
        attendee {
            id
            displayName
        }
    }
`;

export default function RoomParticipantsProvider({
    children,
}: {
    children: string | React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useGetRoomParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 2000,
    });

    const value = loading ? undefined : error ? false : data?.RoomParticipant ?? false;

    return <RoomParticipantsContext.Provider value={value}>{children}</RoomParticipantsContext.Provider>;
}
