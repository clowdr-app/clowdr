import { Spinner, Text, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useContext, useEffect, useState } from "react";
import * as portals from "react-reverse-portal";
import { useClient } from "urql";
import type {
    GetRoomVonageSessionIdQuery,
    GetRoomVonageSessionIdQueryVariables,
    RoomPage_RoomDetailsFragment,
} from "../../../../../generated/graphql";
import { GetRoomVonageSessionIdDocument } from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Hooks/useRealTime";
import { SharedRoomContext } from "../../../../Room/SharedRoomContextProvider";
import { useGetAccessToken } from "../Vonage/useGetAccessToken";
import { RecordingAlert } from "./RecordingAlert";

gql`
    query GetRoomVonageSessionId($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            publicVonageSessionId
        }
    }
`;

export function VideoChatVonage({
    room,
    eventId,
    enable,
    eventIsFuture,
    isPresenterOrChairOrOrganizer,
}: {
    room: RoomPage_RoomDetailsFragment;
    eventId: string | undefined;
    enable: boolean;
    eventIsFuture: boolean;
    isPresenterOrChairOrOrganizer: boolean;
}): JSX.Element {
    const sharedRoomContext = useContext(SharedRoomContext);

    const [publicVonageSessionId, setPublicVonageSessionId] = useState<string | null | undefined>(
        room.publicVonageSessionId
    );
    useEffect(() => {
        setPublicVonageSessionId(room.publicVonageSessionId);
    }, [room.publicVonageSessionId]);

    const { getAccessToken, completeGetAccessToken } = useGetAccessToken(room.id, eventId);

    const attempts = React.useRef<number>(0);
    const lastAttempt = React.useRef<number>(Date.now());
    const now = useRealTime(1000);
    const client = useClient();
    useEffect(() => {
        if (!publicVonageSessionId && attempts.current < 3 && now - lastAttempt.current > 3000) {
            attempts.current++;
            lastAttempt.current = now;

            (async () => {
                const response = await client
                    .query<GetRoomVonageSessionIdQuery, GetRoomVonageSessionIdQueryVariables>(
                        GetRoomVonageSessionIdDocument,
                        {
                            roomId: room.id,
                        }
                    )
                    .toPromise();
                if (response.data?.room_Room_by_pk?.publicVonageSessionId) {
                    setPublicVonageSessionId(response.data.room_Room_by_pk.publicVonageSessionId);
                }
            })();
        }
    }, [publicVonageSessionId, room.id, client, now]);

    return publicVonageSessionId && sharedRoomContext ? (
        <>
            <portals.OutPortal
                node={sharedRoomContext.vonagePortalNode}
                vonageSessionId={publicVonageSessionId}
                disable={!enable}
                getAccessToken={getAccessToken}
                isBackstageRoom={false}
                canControlRecording={(!eventId && !room.item) || isPresenterOrChairOrOrganizer}
                roomId={room.id}
                eventId={eventId}
            />
            <RecordingAlert
                isOpen={completeGetAccessToken.current !== undefined}
                eventIsFuture={eventIsFuture}
                onAccept={completeGetAccessToken.current?.resolve}
                onReject={completeGetAccessToken.current?.reject}
            />
        </>
    ) : (
        <VStack spacing={2} p={4}>
            <Text>Please wait while the video-chat initializes...</Text>
            <Spinner />
        </VStack>
    );
}
