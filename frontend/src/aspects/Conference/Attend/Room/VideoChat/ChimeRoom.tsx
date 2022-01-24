import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import * as portals from "react-reverse-portal";
import type { RoomPage_RoomDetailsFragment} from "../../../../../generated/graphql";
import { useGetRoomChimeDataMutation } from "../../../../../generated/graphql";
import { useSharedRoomContext } from "../../../../Room/useSharedRoomContext";
import { FormattedMessage, useIntl } from "react-intl";

gql`
    mutation GetRoomChimeData($roomId: uuid!) {
        joinRoomChimeSession(roomId: $roomId) {
            registrant
            meeting
            message
        }
    }
`;

export function VideoChatChimeRoom({
    room,
    enable,
}: {
    room: RoomPage_RoomDetailsFragment;
    enable: boolean;
}): JSX.Element {
    const sharedRoomContext = useSharedRoomContext();

    const [getRoomChimeData] = useGetRoomChimeDataMutation({
        variables: {
            roomId: room.id,
        },
    });

    const getMeetingData = useCallback(async () => {
        const result = await getRoomChimeData();
        if (!result.data?.joinRoomChimeSession?.registrant || !result.data.joinRoomChimeSession.meeting) {
            throw new Error(`Could not join meeting: ${result.data?.joinRoomChimeSession?.message}`);
        }
        return {
            attendeeInfo: result.data.joinRoomChimeSession.registrant,
            meetingInfo: result.data.joinRoomChimeSession.meeting,
        };
    }, [getRoomChimeData]);

    return sharedRoomContext ? (
        <portals.OutPortal
            node={sharedRoomContext.chimePortalNode}
            disable={!enable}
            roomId={room.id}
            getMeetingData={getMeetingData}
        />
    ) : (
        <FormattedMessage 
            id="Conference.Attend.Room.VideoChat.ChimeRoom.CannotLoad"
            defaultMessage="Cannot load breakout room"
        />
    );
}
