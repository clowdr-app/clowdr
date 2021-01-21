import { Alert, AlertIcon, AlertTitle, Box, Flex, useToast, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useUserId from "../../../../Auth/useUserId";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import usePolling from "../../../../Generic/usePolling";
import { useVonageRoom, VonageRoomStateActionType, VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
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
    disable,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    disable: boolean;
}): JSX.Element {
    const mAttendee = useMaybeCurrentAttendee();

    const location = useLocation();
    const locationParts = (location.pathname.startsWith("/") ? location.pathname.substr(1) : location.pathname).split(
        "/"
    );
    // Array(5) [ "conference", "demo2021", "room", "96b73184-a5ae-4356-81d7-5f99689d1413" ]
    const roomCouldBeInUse = locationParts[0] === "conference" && locationParts[2] === "room";

    return (
        <VonageRoomStateProvider>
            <ChatProfileModalProvider>
                {mAttendee ? (
                    <VonageRoomInner
                        vonageSessionId={vonageSessionId}
                        stop={!roomCouldBeInUse || disable}
                        getAccessToken={getAccessToken}
                    />
                ) : undefined}
            </ChatProfileModalProvider>
        </VonageRoomStateProvider>
    );
}

function VonageRoomInner({
    vonageSessionId,
    getAccessToken,
    stop,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    stop: boolean;
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
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
        });
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [connected, dispatch, vonage]);

    useEffect(() => {
        if (stop) {
            leaveRoom();
        }
    }, [leaveRoom, stop]);

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
                } else if (!state.screenShareIntendedEnabled && screen) {
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

    const screenSharingActive = receivingScreenShare || screen;
    const participantWidth = screenSharingActive ? 150 : 300;

    return (
        <Box>
            <VonageRoomControlBar onJoinRoom={joinRoom} onLeaveRoom={leaveRoom} joining={joining} />
            <Box position="relative" mb={8} width="100%">
                <Box
                    position="relative"
                    maxH="80vh"
                    hidden={!screen}
                    height={"70vh"}
                    width="100%"
                    mb={2}
                    zIndex={300}
                    overflow="hidden"
                >
                    <Box
                        ref={screenPublishContainerRef}
                        position="absolute"
                        zIndex="100"
                        left="0"
                        top="0"
                        height="100%"
                        width="100%"
                    />
                    <Box
                        position="absolute"
                        zIndex="200"
                        left="0"
                        top="0"
                        height="100%"
                        width="100%"
                        pointerEvents="none"
                    />
                    <Box position="absolute" left="0.4rem" bottom="0.35rem" zIndex="200" width="100%">
                        <VonageOverlay connectionData={JSON.stringify({ attendeeId: attendee.id })} />
                    </Box>
                </Box>

                <Box
                    maxH="80vh"
                    height={receivingScreenShare ? "70vh" : undefined}
                    width="100%"
                    mb={2}
                    zIndex={300}
                    hidden={!receivingScreenShare}
                >
                    {streams
                        .filter((stream) => stream.videoType === "screen")
                        .map((stream) => (
                            <VonageSubscriber key={stream.streamId} stream={stream} enableVideo={true} />
                        ))}
                </Box>

                <Flex
                    width="100%"
                    height="auto"
                    flexWrap={screenSharingActive ? "nowrap" : "wrap"}
                    overflowX={screenSharingActive ? "auto" : "hidden"}
                    overflowY={screenSharingActive ? "hidden" : "auto"}
                >
                    {connected && !camera ? (
                        <Box position="relative" w={participantWidth} h={participantWidth}>
                            <Box position="absolute" left="0" bottom="0" zIndex="200" width="100%" overflow="hidden">
                                <VonageOverlay connectionData={JSON.stringify({ attendeeId: attendee.id })} />
                            </Box>
                            <PlaceholderImage />
                        </Box>
                    ) : (
                        <></>
                    )}

                    <Box w={participantWidth} h={participantWidth} display={connected && camera ? "block" : "none"}>
                        <Box position="relative" height="100%" width="100%" overflow="hidden">
                            <Box
                                ref={cameraPublishContainerRef}
                                position="absolute"
                                zIndex="100"
                                left="0"
                                top="0"
                                height="100%"
                                width="100%"
                            />
                            <Box
                                position="absolute"
                                zIndex="200"
                                left="0"
                                top="0"
                                height="100%"
                                width="100%"
                                pointerEvents="none"
                            />
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
                        </Box>
                    </Box>

                    {R.sortWith(
                        [
                            R.descend((stream) => !enableStreams || !!enableStreams.includes(stream.streamId)),
                            R.ascend(R.prop("creationTime")),
                        ],
                        streams.filter((s) => s.videoType === "camera" || !s.videoType)
                    ).map((stream) => (
                        <Box key={stream.streamId} w={participantWidth} h={participantWidth}>
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
                            <Box
                                key={connection.connectionId}
                                position="relative"
                                w={participantWidth}
                                h={participantWidth}
                            >
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
                {connected && connections.length <= 1 ? (
                    <Alert status="info">
                        <AlertIcon />
                        <AlertTitle>Nobody else has joined the room at the moment</AlertTitle>
                    </Alert>
                ) : (
                    <></>
                )}

                {joining || connected ? (
                    <></>
                ) : (
                    <VStack justifyContent="center" height="100%" width="100%">
                        <PreJoin cameraPreviewRef={cameraPreviewRef} />
                    </VStack>
                )}
            </Box>
        </Box>
    );
}
