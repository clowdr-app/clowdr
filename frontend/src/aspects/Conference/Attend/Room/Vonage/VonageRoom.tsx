import { Box, Flex, useToast, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useUserId from "../../../../Auth/useUserId";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import usePolling from "../../../../Generic/usePolling";
import { useVonageRoom, VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
import useCurrentAttendee, { useMaybeCurrentAttendee } from "../../../useCurrentAttendee";
import PlaceholderImage from "../PlaceholderImage";
import { PreJoin } from "../PreJoin";
import { useVonageComputedState } from "./useVonageComputedState";
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
            <ChatProfileModalProvider>
                {mAttendee ? (
                    <VonageRoomInner vonageSessionId={vonageSessionId} getAccessToken={getAccessToken} />
                ) : undefined}
            </ChatProfileModalProvider>
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
    const maxVideoStreams = 10;
    const { state, dispatch } = useVonageRoom();
    const { vonage, connected, connections, streams, screen, camera } = useVonageComputedState(
        getAccessToken,
        vonageSessionId
    );

    const userId = useUserId();
    const attendee = useCurrentAttendee();
    const toast = useToast();

    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);

    const [joining, setJoining] = useState<boolean>(false);

    const joinRoom = useCallback(async () => {
        console.log("Joining room");
        setJoining(true);

        try {
            await vonage.connectToSession();
            await vonage.publishCamera(
                cameraPublishContainerRef.current as HTMLElement,
                state.cameraIntendedEnabled ? state.preferredCameraId : null,
                state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null
            );
        } catch (e) {
            console.error("Failed to join room", e);
            toast({
                status: "error",
                description: "Cannot connect to room",
            });
        } finally {
            setJoining(false);
        }
    }, [
        vonage,
        state.cameraIntendedEnabled,
        state.preferredCameraId,
        state.microphoneIntendedEnabled,
        state.preferredMicrophoneId,
        toast,
    ]);

    const leaveRoom = useCallback(() => {
        if (connected) {
            try {
                vonage.disconnect();
            } catch (e) {
                console.warn("Failed to leave room", e);
            }
        }
        setJoining(false);
    }, [connected, vonage]);

    useEffect(() => {
        async function fn() {
            if (connected) {
                vonage.publishCamera(
                    cameraPublishContainerRef.current as HTMLElement,
                    state.cameraIntendedEnabled ? state.preferredCameraId : null,
                    state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null
                );
            }
        }
        fn();
    }, [
        connected,
        state.cameraIntendedEnabled,
        state.microphoneIntendedEnabled,
        state.preferredCameraId,
        state.preferredMicrophoneId,
        vonage,
    ]);

    useEffect(() => {
        async function fn() {
            if (connected) {
                if (state.screenShareIntendedEnabled && !screen) {
                    vonage.publishScreen(screenPublishContainerRef.current as HTMLElement);
                } else if (screen) {
                    vonage.unpublishScreen();
                }
            }
        }
        fn();
    }, [connected, screen, state.screenShareIntendedEnabled, vonage]);

    const receivingScreenShare = useMemo(() => streams.find((s) => s.videoType === "screen"), [streams]);

    const [streamLastActive, setStreamLastActive] = useState<{ [streamId: string]: number }>({});
    const setStreamActivity = useCallback((streamId: string, activity: boolean) => {
        if (activity) {
            setStreamLastActive((streamLastActiveData) => ({
                ...streamLastActiveData,
                [streamId]: Date.now(),
            }));
        }
    }, []);

    const [enableStreams, setEnableStreams] = useState<string[] | null>(null);
    const updateEnabledStreams = useCallback(() => {
        if (streams.filter((stream) => stream.videoType === "camera").length <= maxVideoStreams) {
            setEnableStreams(null);
        } else {
            const activeStreams = R.sortWith(
                [R.descend((pair) => pair[1]), R.ascend((pair) => pair[0])],
                R.toPairs(streamLastActive)
            ).map((pair) => pair[0]);
            const selectedActiveStreams = activeStreams.slice(0, Math.min(activeStreams.length, maxVideoStreams));

            // todo: fill up rest of the available video slots with inactive streams

            console.log("Enabled streams", selectedActiveStreams);

            setEnableStreams(selectedActiveStreams);
        }
    }, [streams, streamLastActive]);
    useEffect(() => {
        updateEnabledStreams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    usePolling(updateEnabledStreams, 3000, true);

    return (
        <Box display="grid" gridTemplateRows="1fr auto">
            <Box display="none" ref={screenPublishContainerRef} />
            <Box maxH="80vh" height={receivingScreenShare ? "70vh" : undefined} overflowY="auto" position="relative">
                <Flex width="100%" height="auto" flexWrap="wrap" overflowY="auto">
                    {connected && !camera ? (
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
                        display={connected && camera ? "block" : "none"}
                    />

                    {R.sortWith(
                        [
                            R.descend((stream) => !enableStreams || !!enableStreams.includes(stream.streamId)),
                            R.ascend(R.prop("creationTime")),
                        ],
                        streams.filter((s) => s.videoType === "camera" || !s.videoType)
                    ).map((stream) => (
                        <Box key={stream.streamId} w={300} h={300}>
                            <VonageSubscriber
                                stream={stream}
                                onChangeActivity={(activity) => setStreamActivity(stream.streamId, activity)}
                                enableVideo={!enableStreams || !!enableStreams.includes(stream.streamId)}
                            />
                        </Box>
                    ))}
                    {(connected ? connections : [])
                        .filter(
                            (connection) =>
                                userId &&
                                !connection.data.includes(userId) &&
                                !streams.find((stream) => stream.connection.connectionId === connection.connectionId)
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
                    {streams
                        .filter((stream) => stream.videoType === "screen")
                        .map((stream) => (
                            <VonageSubscriber key={stream.streamId} stream={stream} enableVideo={true} />
                        ))}
                </Box>
                {joining || connected ? (
                    <></>
                ) : (
                    <VStack justifyContent="center" height="100%" width="100%">
                        <PreJoin cameraPreviewRef={cameraPreviewRef} />
                    </VStack>
                )}
            </Box>
            <VonageRoomControlBar onJoinRoom={joinRoom} onLeaveRoom={leaveRoom} joining={joining} />
        </Box>
    );
}
