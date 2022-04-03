import { Spinner } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { SocialRoomFragment } from "../../../../generated/graphql";
import { useGetSocialRoomsQuery } from "../../../../generated/graphql";
import { makeContext } from "../../../GQL/make-context";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useConference } from "../../useConference";
import RoomsSummary from "./RoomsSummary";

export default function ActiveSocialRooms({ alignLeft }: { alignLeft?: boolean }): JSX.Element {
    const conference = useConference();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.IncludeRoomIds]: "true",
            }),
        []
    );
    const [result] = useGetSocialRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });

    if (result.fetching && !result?.data) {
        return <Spinner label="Loading rooms" />;
    }

    return <ActiveSocialRoomsInner rooms={result.data?.room_Room ?? []} alignLeft={alignLeft} />;
}

function ActiveSocialRoomsInner({
    rooms,
    alignLeft,
}: {
    rooms: readonly SocialRoomFragment[];
    alignLeft?: boolean;
}): JSX.Element {
    const roomIds = useMemo(() => rooms.map((x) => x.id), [rooms]);
    const roomParticipants = useRoomParticipants(roomIds);
    const sortedRooms = useMemo(
        () =>
            !roomParticipants
                ? []
                : R.sortBy<SocialRoomFragment>(
                      (x) => x.priority,
                      R.sortBy(
                          (x) => x.name,
                          R.filter((x) => Boolean(roomParticipants[x.id]?.length), rooms)
                      )
                  ).map((room) => room.id),
        [rooms, roomParticipants]
    );

    return <RoomsSummary rooms={sortedRooms} alignLeft={alignLeft} />;
}
