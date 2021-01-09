import { gql } from "@apollo/client";
import { Box, Flex, useToast, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef } from "react";
import {
    RoomDetailsFragment,
    RoomEventDetailsFragment,
    useGetEventVonageTokenMutation,
    useGetRoomVonageTokenMutation,
} from "../../../../generated/graphql";
import useUserId from "../../../Auth/useUserId";
import { OpenTokProvider } from "../../../Vonage/OpenTokProvider";
import { useOpenTok } from "../../../Vonage/useOpenTok";
import PlaceholderImage from "./PlaceholderImage";
import { PreJoin } from "./PreJoin";
import { usePublisherControl } from "./usePublisherControl";
import { VonageRoomControlBar } from "./VonageRoomControlBar";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }

    mutation GetEventVonageToken($eventId: uuid!) {
        joinEventVonageSession(eventId: $eventId) {
            accessToken
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
        <OpenTokProvider>
            <VonageRoom vonageSessionId={room.publicVonageSessionId} getAccessToken={getAccessToken} />
        </OpenTokProvider>
    ) : (
        <>No breakout session exists </>
    );
}

export function EventVonageRoom({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const [getEventVonageToken] = useGetEventVonageTokenMutation({
        variables: {
            eventId: event.id,
        },
    });

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken();
        if (!result.data?.joinEventVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken]);

    return event.eventVonageSession ? (
        <OpenTokProvider>
            <VonageRoom vonageSessionId={event.eventVonageSession.sessionId} getAccessToken={getAccessToken} />
        </OpenTokProvider>
    ) : (
        <>No video session exists </>
    );
}

export function VonageRoom({
    vonageSessionId,
    getAccessToken,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
}): JSX.Element {
    const [openTokProps, openTokMethods] = useOpenTok();
    const userId = useUserId();
    const toast = useToast();
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);
    usePublisherControl(videoContainerRef);

    useEffect(() => {
        async function initSession() {
            if (!vonageSessionId) {
                return;
            }

            if (openTokProps.isSessionInitialized) {
                return;
            }

            await openTokMethods.initSession({
                apiKey: import.meta.env.SNOWPACK_PUBLIC_OPENTOK_API_KEY,
                sessionId: vonageSessionId,
                sessionOptions: {},
            });
        }
        initSession();
    }, [openTokMethods, openTokProps.isSessionInitialized, vonageSessionId]);

    const joinRoom = useCallback(async () => {
        console.log("Joining room");
        let accessToken;
        try {
            accessToken = await getAccessToken();
        } catch (e) {
            toast({
                status: "error",
                title: "Failed to join room",
                description: "Could not retrieve access token",
            });
            return;
        }

        try {
            if (!openTokProps.session) {
                throw new Error("No session");
            }

            await openTokMethods.connectSession(accessToken, openTokProps.session);
        } catch (e) {
            console.error("Failed to join room", e);
            toast({
                status: "error",
                description: "Cannot connect to room",
            });
        }
    }, [getAccessToken, openTokMethods, openTokProps.session, toast]);

    const leaveRoom = useCallback(() => {
        if (openTokProps.isSessionConnected) {
            openTokMethods.disconnectSession();
        }
    }, [openTokMethods, openTokProps.isSessionConnected]);

    return (
        <Box display="grid" gridTemplateRows="1fr auto">
            <Box maxH="80vh" overflowY="auto">
                <Flex width="100%" height="auto" flexWrap="wrap" ref={videoContainerRef} overflowY="auto">
                    {openTokProps.isSessionConnected && !openTokProps.publisher["camera"] ? (
                        <Box position="relative" w={300} h={300}>
                            <PlaceholderImage />
                        </Box>
                    ) : (
                        <></>
                    )}
                    {openTokProps.connections
                        .filter(
                            (connection) =>
                                userId &&
                                !connection.data.includes(userId) &&
                                !openTokProps.subscribers.find(
                                    (subscriber) =>
                                        subscriber.stream?.connection.connectionId === connection.connectionId
                                )
                        )
                        .map((connection) => (
                            <Box key={connection.connectionId} position="relative" w={300} h={300}>
                                <PlaceholderImage />
                            </Box>
                        ))}
                </Flex>
                {openTokProps.session?.connection ? (
                    <></>
                ) : (
                    <VStack justifyContent="center" height="100%" width="100%">
                        <PreJoin cameraPreviewRef={cameraPreviewRef} />
                    </VStack>
                )}
            </Box>
            <VonageRoomControlBar
                onJoinRoom={joinRoom}
                onLeaveRoom={leaveRoom}
                inRoom={openTokProps.isSessionConnected}
            />
        </Box>
    );
}
