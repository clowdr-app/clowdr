import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import { RoomDetailsFragment, useGetRoomVonageTokenMutation } from "../../../../generated/graphql";
import { OpenTokProvider } from "../../../Vonage/OpenTokProvider";
import { VonageRoomStateProvider } from "../../../Vonage/useVonageRoom";
import { VonageRoom } from "./Vonage/VonageRoom";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }
`;

export function BreakoutVonageRoom({ room }: { room: RoomDetailsFragment }): JSX.Element {
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

    return room.publicVonageSessionId ? (
        <VonageRoomStateProvider>
            <OpenTokProvider>
                <VonageRoom vonageSessionId={room.publicVonageSessionId} getAccessToken={getAccessToken} />
            </OpenTokProvider>
        </VonageRoomStateProvider>
    ) : (
        <>No breakout session exists </>
    );
}
