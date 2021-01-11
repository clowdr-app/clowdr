import { Box, Flex, useToast, VStack } from "@chakra-ui/react";
import React, { useCallback, useMemo, useRef } from "react";
import useUserId from "../../../../Auth/useUserId";
import { useOpenTok } from "../../../../Vonage/useOpenTok";
import PlaceholderImage from "../PlaceholderImage";
import { PreJoin } from "../PreJoin";
import { usePublisherControl } from "./usePublisherControl";
import { VonageRoomControlBar } from "./VonageRoomControlBar";
import { VonageSubscriber } from "./VonageSubscriber";

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
    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);
    usePublisherControl(cameraPublishContainerRef, screenPublishContainerRef);

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
            await openTokMethods.initSessionAndConnect({
                apiKey: import.meta.env.SNOWPACK_PUBLIC_OPENTOK_API_KEY,
                sessionId: vonageSessionId,
                sessionOptions: {},
                token: accessToken,
            });
        } catch (e) {
            console.error("Failed to join room", e);
            toast({
                status: "error",
                description: "Cannot connect to room",
            });
        }
    }, [getAccessToken, openTokMethods, toast, vonageSessionId]);

    const leaveRoom = useCallback(() => {
        if (openTokProps.isSessionConnected) {
            openTokMethods.disconnectSession();
        }
    }, [openTokMethods, openTokProps.isSessionConnected]);

    const receivingScreenShare = useMemo(() => openTokProps.streams.find((s) => s.videoType === "screen"), [
        openTokProps.streams,
    ]);

    return (
        <Box display="grid" gridTemplateRows="1fr auto">
            <Box display="none" ref={screenPublishContainerRef} />
            <Box maxH="80vh" height={receivingScreenShare ? "70vh" : undefined} overflowY="auto" position="relative">
                <Flex width="100%" height="auto" flexWrap="wrap" ref={cameraPublishContainerRef} overflowY="auto">
                    {openTokProps.isSessionConnected && !openTokProps.publisher["camera"] ? (
                        <Box position="relative" w={300} h={300}>
                            <PlaceholderImage />
                        </Box>
                    ) : (
                        <></>
                    )}
                    {openTokProps.streams
                        .filter(
                            (stream) =>
                                stream.videoType === "camera" &&
                                !(
                                    openTokProps.publisher["camera"] &&
                                    stream.connection.connectionId ===
                                        openTokProps.publisher["camera"].stream?.connection.connectionId
                                )
                        )
                        .map((stream) => (
                            <Box key={stream.streamId} w={300} h={300}>
                                <VonageSubscriber stream={stream} />
                            </Box>
                        ))}
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
                <Box position="absolute" width="100%" height="100%" top="0" left="0" hidden={!receivingScreenShare}>
                    {openTokProps.streams
                        .filter((stream) => stream.videoType === "screen")
                        .map((stream) => (
                            <VonageSubscriber key={stream.streamId} stream={stream} />
                        ))}
                </Box>
                {openTokProps.isSessionConnected ? (
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
