import { gql } from "@urql/core";
import React, { useCallback, useContext } from "react";
import * as portals from "react-reverse-portal";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import { useGetRoomChimeDataMutation } from "../../../../../generated/graphql";
import { SharedRoomContext } from "../../../../Room/SharedRoomContextProvider";
import useCurrentRegistrant from "../../../useCurrentRegistrant";

gql`
    mutation GetRoomChimeData($roomId: uuid!, $registrantId: uuid!) {
        joinRoomChimeSession(roomId: $roomId, registrantId: $registrantId) {
            registrant
            meeting
            message
        }
    }
`;

export function VideoChatChime({ room, enable }: { room: RoomPage_RoomDetailsFragment; enable: boolean }): JSX.Element {
    const sharedRoomContext = useContext(SharedRoomContext);
    const registrant = useCurrentRegistrant();

    const [, getRoomChimeData] = useGetRoomChimeDataMutation();

    const getMeetingData = useCallback(async () => {
        const result = await getRoomChimeData({
            roomId: room.id,
            registrantId: registrant.id,
        });
        if (!result.data?.joinRoomChimeSession?.registrant || !result.data.joinRoomChimeSession.meeting) {
            throw new Error(`Could not join meeting: ${result.data?.joinRoomChimeSession?.message}`);
        }
        return {
            attendeeInfo: result.data.joinRoomChimeSession.registrant,
            meetingInfo: result.data.joinRoomChimeSession.meeting,
        };
    }, [getRoomChimeData, registrant.id, room.id]);

    return sharedRoomContext ? (
        <portals.OutPortal
            node={sharedRoomContext.chimePortalNode}
            disable={!enable}
            roomId={room.id}
            getMeetingData={getMeetingData}
        />
    ) : (
        <>Cannot load breakout room</>
    );
}
