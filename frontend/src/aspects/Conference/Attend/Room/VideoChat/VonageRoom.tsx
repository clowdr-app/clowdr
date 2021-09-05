import { gql } from "@apollo/client";
import { Spinner, Text, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import * as portals from "react-reverse-portal";
import {
    RoomPage_RoomDetailsFragment,
    useGetRoomVonageSessionIdQuery,
    useGetRoomVonageTokenMutation,
} from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import { useSharedRoomContext } from "../../../../Room/useSharedRoomContext";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }

    query GetRoomVonageSessionId($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            publicVonageSessionId
        }
    }
`;

export function VideoChatVonageRoom({
    room,
    enable,
}: {
    room: RoomPage_RoomDetailsFragment;
    enable: boolean;
}): JSX.Element {
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

    const [publicVonageSessionId, setPublicVonageSessionId] = useState<string | null | undefined>(
        room.publicVonageSessionId
    );
    useEffect(() => {
        setPublicVonageSessionId(room.publicVonageSessionId);
    }, [room.publicVonageSessionId]);

    const roomVonageSessionIdResponse = useGetRoomVonageSessionIdQuery({
        skip: true,
    });
    const attempts = React.useRef<number>(0);
    const lastAttempt = React.useRef<number>(Date.now());
    const now = useRealTime(1000);
    useEffect(() => {
        if (!publicVonageSessionId && attempts.current < 3 && now - lastAttempt.current > 3000) {
            attempts.current++;
            lastAttempt.current = now;

            (async () => {
                const response = await roomVonageSessionIdResponse.refetch({
                    roomId: room.id,
                });
                if (response.data?.room_Room_by_pk?.publicVonageSessionId) {
                    setPublicVonageSessionId(response.data.room_Room_by_pk.publicVonageSessionId);
                }
            })();
        }
    }, [publicVonageSessionId, room.id, roomVonageSessionIdResponse, now]);

    return publicVonageSessionId && sharedRoomContext ? (
        <portals.OutPortal
            node={sharedRoomContext.vonagePortalNode}
            vonageSessionId={publicVonageSessionId}
            disable={!enable}
            getAccessToken={getAccessToken}
            isBackstageRoom={false}
        />
    ) : (
        <VStack spacing={2} p={4}>
            <Text>Please wait while the video-chat initializes...</Text>
            <Spinner />
        </VStack>
    );
}
