import { gql } from "@apollo/client";
import { Button, Text } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useGetRoomVonageTokenMutation } from "../../../../generated/graphql";
import useOpenTok from "../../../Vonage/useOpenTok";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }
`;

export default function VonageRoom({ roomId }: { roomId: string }): JSX.Element {
    const [openTokProps, openTokMethods] = useOpenTok();
    const [getRoomVonageToken] = useGetRoomVonageTokenMutation({
        variables: {
            roomId,
        },
    });

    const joinRoom = useCallback(async () => {
        const result = await getRoomVonageToken();

        if (!result.data?.joinRoomVonageSession?.accessToken || !result.data.joinRoomVonageSession.sessionId) {
            return;
        }

        const session = await openTokMethods.initSession({
            apiKey: import.meta.env.SNOWPACK_PUBLIC_OPENTOK_API_KEY,
            sessionId: result.data.joinRoomVonageSession.sessionId,
            sessionOptions: {},
        });

        await openTokMethods.initPublisher({
            element: "my-video",
            name: "camera",
            options: {},
        });

        await openTokMethods.connectSession(result.data.joinRoomVonageSession.accessToken, session);

        await openTokMethods.publishPublisher({ name: "camera" });
    }, [getRoomVonageToken, openTokMethods]);

    return (
        <>
            <div id="my-video"></div>
            {openTokProps.session && openTokProps.session.connection ? (
                <Text>Connected</Text>
            ) : (
                <Button onClick={joinRoom}>Join room</Button>
            )}
        </>
    );
}
