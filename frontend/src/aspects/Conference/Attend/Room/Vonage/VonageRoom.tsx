import { Box, Flex, useToast, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useUserId from "../../../../Auth/useUserId";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import usePolling from "../../../../Generic/usePolling";
import { OpenTokProvider } from "../../../../Vonage/OpenTokProvider";
import { useOpenTok } from "../../../../Vonage/useOpenTok";
import { VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
import useCurrentAttendee, { useMaybeCurrentAttendee } from "../../../useCurrentAttendee";
import PlaceholderImage from "../PlaceholderImage";
import { PreJoin } from "../PreJoin";
import { usePublisherControl } from "./usePublisherControl";
import { VonageOverlay } from "./VonageOverlay";
import { VonageRoomControlBar } from "./VonageRoomControlBar";
import { VonageSubscriber } from "./VonageSubscriber";

export function VonageRoom({
    vonageSessionId,
    getAccessToken,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
}): JSX.Element {
    const mAttendee = useMaybeCurrentAttendee();

    return (
        <VonageRoomStateProvider>
            <OpenTokProvider>
                <ChatProfileModalProvider>
                    {mAttendee ? <VonageRoomInner vonageSessionId={vonageSessionId} getAccessToken={getAccessToken} /> : undefined}
                </ChatProfileModalProvider>
            </OpenTokProvider>
        </VonageRoomStateProvider>
    );
}

function VonageRoomInner({
    vonageSessionId,
    getAccessToken,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
}): JSX.Element {
    const maxVideoStreams = 1;
    const [openTokProps, openTokMethods] = useOpenTok();
    const userId = useUserId();
    const attendee = useCurrentAttendee();
    const toast = useToast();
    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);
    usePublisherControl(cameraPublishContainerRef, screenPublishContainerRef);

    useEffect(() => {
        if (openTokProps.isSessionConnected) {
            openTokMethods.disconnectSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonageSessionId]);

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

    const [streamLastActive, setStreamLastActive] = useState<{ [streamId: string]: number }>({});
    const setStreamActivity = useCallback(
        (streamId: string, activity: boolean) => {
            if (activity) {
                setStreamLastActive({
                    ...streamLastActive,
                    [streamId]: Date.now(),
                });
            }
        },
        [streamLastActive]
    );

    const [enableStreams, setEnableStreams] = useState<string[] | null>(null);
    const updateEnabledStreams = useCallback(() => {
        if (openTokProps.streams.filter((stream) => stream.videoType === "camera").length <= maxVideoStreams) {
            setEnableStreams(null);
        } else {
            const activeStreams = R.sortWith([R.descend((pair) => pair[1])], R.toPairs(streamLastActive)).map(
                (pair) => pair[0]
            );
            const selectedActiveStreams = activeStreams.slice(0, Math.min(activeStreams.length, maxVideoStreams));

            // todo: fill up rest of the available video slots with inactive streams

            setEnableStreams(selectedActiveStreams);
        }
    }, [openTokProps.streams, streamLastActive]);
    useEffect(() => {
        updateEnabledStreams();
    }, [updateEnabledStreams]);
    usePolling(updateEnabledStreams, 5000, true);

    return (
        <Box display="grid" gridTemplateRows="1fr auto">
            <Box display="none" ref={screenPublishContainerRef} />
            <Box maxH="80vh" height={receivingScreenShare ? "70vh" : undefined} overflowY="auto" position="relative">
                <Flex width="100%" height="auto" flexWrap="wrap" overflowY="auto">
                    {openTokProps.isSessionConnected && !openTokProps.publisher["camera"] ? (
                        <Box position="relative" w={300} h={300}>
                            <Box
                                position="absolute"
                                left="0.4rem"
                                bottom="0.2rem"
                                zIndex="200"
                                width="100%"
                                overflow="hidden"
                            >
                                <VonageOverlay connectionData={JSON.stringify({ attendeeId: attendee.id })} />
                            </Box>
                            <PlaceholderImage />
                        </Box>
                    ) : (
                        <></>
                    )}
                    <Box
                        w={300}
                        h={300}
                        ref={cameraPublishContainerRef}
                        display={openTokProps.isSessionConnected && openTokProps.publisher["camera"] ? "block" : "none"}
                    ></Box>

                    {R.sortWith(
                        [
                            R.descend((stream) => !enableStreams || !!enableStreams.includes(stream.streamId)),
                            R.ascend(R.prop("creationTime")),
                        ],
                        openTokProps.streams.filter((s) => s.videoType === "camera")
                    ).map((stream) => (
                        <Box key={stream.streamId} w={300} h={300}>
                            <VonageSubscriber
                                stream={stream}
                                onChangeActivity={(activity) => setStreamActivity(stream.streamId, activity)}
                                enableVideo={!enableStreams || !!enableStreams.includes(stream.streamId)}
                            />
                        </Box>
                    ))}
                    {openTokProps.connections
                        .filter(
                            (connection) =>
                                userId &&
                                !connection.data.includes(userId) &&
                                !openTokProps.streams.find(
                                    (stream) => stream.connection.connectionId === connection.connectionId
                                )
                        )
                        .map((connection) => (
                            <Box key={connection.connectionId} position="relative" w={300} h={300}>
                                <Box
                                    position="absolute"
                                    left="0.4rem"
                                    bottom="0.2rem"
                                    zIndex="200"
                                    width="100%"
                                    overflow="hidden"
                                >
                                    <VonageOverlay connectionData={connection.data} />
                                </Box>
                                <PlaceholderImage />
                            </Box>
                        ))}
                </Flex>

                <Box
                    position="absolute"
                    width="100%"
                    height="100%"
                    top="0"
                    left="0"
                    zIndex={300}
                    hidden={!receivingScreenShare}
                >
                    {openTokProps.streams
                        .filter((stream) => stream.videoType === "screen")
                        .map((stream) => (
                            <VonageSubscriber key={stream.streamId} stream={stream} enableVideo={true} />
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
