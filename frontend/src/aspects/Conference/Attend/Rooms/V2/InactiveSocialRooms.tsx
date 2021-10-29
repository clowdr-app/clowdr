import { Spinner } from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { RoomParticipantDetailsFragment, SocialRoomFragment } from "../../../../../generated/graphql";
import { useGetSocialRoomsQuery } from "../../../../../generated/graphql";
import useRoomParticipants from "../../../../Room/useRoomParticipants";
import { useConference } from "../../../useConference";
import RoomSummary from "./RoomsSummary";

gql`
    query GetSocialRooms($conferenceId: uuid!) {
        socialRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { _or: [{ events: {} }, { chat: { enableMandatoryPin: { _eq: true } } }] }
                originatingItemId: { _is_null: true }
                originatingEventId: { _is_null: true }
            }
            order_by: { name: asc }
        ) {
            ...SocialRoom
        }
    }

    fragment SocialRoom on room_Room {
        id
        name
        priority
        chatId
        conferenceId
        originatingItemId
        originatingEventId
    }
`;

export default function InactiveSocialRooms(): JSX.Element {
    const conference = useConference();
    const [result] = useGetSocialRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
        requestPolicy: "cache-and-network",
    });
    const roomParticipants = useRoomParticipants();

    if (roomParticipants === undefined || roomParticipants === false) {
        return <></>;
    }

    if (result.fetching && !result?.data) {
        return <Spinner label="Loading rooms" />;
    }

    return <InactiveSocialRoomsInner roomParticipants={roomParticipants} rooms={result.data?.socialRooms ?? []} />;
}

function InactiveSocialRoomsInner({
    rooms,
    roomParticipants,
}: {
    rooms: readonly SocialRoomFragment[];
    roomParticipants: readonly RoomParticipantDetailsFragment[];
}): JSX.Element {
    const activeRoomIds = useMemo(() => R.uniq(roomParticipants.map((x) => x.roomId)), [roomParticipants]);
    const sortedRooms = useMemo(
        () =>
            R.sortBy<SocialRoomFragment>(
                (x) => x.priority,
                R.sortBy(
                    (x) => x.name,
                    R.filter((x) => !activeRoomIds.includes(x.id), rooms)
                )
            ).map((room) => ({ roomId: room.id })),
        [rooms, activeRoomIds]
    );

    return <RoomSummary rooms={sortedRooms} />;
}
