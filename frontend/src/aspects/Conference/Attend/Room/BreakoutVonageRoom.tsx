import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import * as portals from "react-reverse-portal";
import { RoomPage_RoomDetailsFragment, useGetRoomVonageTokenMutation } from "../../../../generated/graphql";
import { useSharedRoomContext } from "../../../Room/useSharedRoomContext";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }
`;

export function BreakoutVonageRoom({ room }: { room: RoomPage_RoomDetailsFragment }): JSX.Element {
    const sharedRoomContext = useSharedRoomContext();

    const [getRoomVonageToken] = useGetRoomVonageTokenMutation({
        variables: {
            roomId: room.id,
        },
    });

    const getAccessToken = useCallback(async () => {
        const result = await getRoomVonageToken();
        if (!result.data?.joinRoomVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinRoomVonageSession.accessToken;
    }, [getRoomVonageToken]);

    //todo: when chime/vonage chooser is available, use it here
    return room.publicVonageSessionId && sharedRoomContext ? (
        <portals.OutPortal
            node={sharedRoomContext.vonagePortalNode}
            vonageSessionId={room.publicVonageSessionId}
            getAccessToken={getAccessToken}
            isBackstageRoom={false}
        />
    ) : (
        <>No breakout session exists</>
    );
}
