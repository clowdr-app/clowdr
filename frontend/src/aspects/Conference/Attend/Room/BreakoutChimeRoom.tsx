import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import * as portals from "react-reverse-portal";
import { RoomPage_RoomDetailsFragment, useGetRoomChimeDataMutation } from "../../../../generated/graphql";
import { useSharedRoomContext } from "../../../Room/useSharedRoomContext";

gql`
    mutation GetRoomChimeData($roomId: uuid!) {
        joinRoomChimeSession(roomId: $roomId) {
            attendee
            meeting
            message
        }
    }
`;

export function BreakoutChimeRoom({ room }: { room: RoomPage_RoomDetailsFragment }): JSX.Element {
    const sharedRoomContext = useSharedRoomContext();

    const [getRoomChimeData] = useGetRoomChimeDataMutation({
        variables: {
            roomId: room.id,
        },
    });

    const getMeetingData = useCallback(async () => {
        const result = await getRoomChimeData();
        if (!result.data?.joinRoomChimeSession?.attendee || !result.data.joinRoomChimeSession.meeting) {
            throw new Error(`Could not join meeting: ${result.data?.joinRoomChimeSession?.message}`);
        }
        return {
            attendeeInfo: result.data.joinRoomChimeSession.attendee,
            meetingInfo: result.data.joinRoomChimeSession.meeting,
        };
    }, [getRoomChimeData]);

    //todo: when chime/vonage chooser is available, use it here
    return sharedRoomContext ? (
        <portals.OutPortal node={sharedRoomContext.chimePortalNode} roomId={room.id} getMeetingData={getMeetingData} />
    ) : (
        <>Cannot load breakout room</>
    );
}
