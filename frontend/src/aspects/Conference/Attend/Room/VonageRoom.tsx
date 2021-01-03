import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { gql } from "@apollo/client";
import { SettingsIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, useColorModeValue, useDisclosure, useToast, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGetRoomVonageTokenMutation } from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import useOpenTok from "../../../Vonage/useOpenTok";
import useSessionEventHandler, { EventMap } from "../../../Vonage/useSessionEventHandler";
import { useVonageRoom, VonageRoomStateActionType } from "../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";
import PlaceholderImage from "./PlaceholderImage";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }
`;

export default function VonageRoom({
    roomId,
}: // publicVonageSessionId,
{
    roomId: string;
    // publicVonageSessionId: string;
}): JSX.Element {
    const [openTokProps, openTokMethods] = useOpenTok();
    const { state, computedState, dispatch } = useVonageRoom();
    const [vonageSessionId, setVonageSessionId] = useState<string | null>(null);
    const [getRoomVonageToken] = useGetRoomVonageTokenMutation({
        variables: {
            roomId,
        },
    });
    const toast = useToast();
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);

    // useEffect(() => {
    //     return () => {
    //         dispatch({
    //             cameraEnabled: false,
    //             type: VonageRoomStateActionType.SetCameraIntendedState,
    //         });
    //     };
    // }, [dispatch]);

    useEffect(() => {
        async function fn() {
            const result = await getRoomVonageToken();
            setVonageSessionId(result.data?.joinRoomVonageSession?.sessionId ?? null);
        }
        fn();
    }, [getRoomVonageToken]);

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
    }, [getRoomVonageToken, openTokMethods, openTokProps.isSessionInitialized, vonageSessionId]);

    const joinRoom = useCallback(async () => {
        console.log("Joining room");
        const result = await getRoomVonageToken();

        if (!result.data?.joinRoomVonageSession?.accessToken || !result.data.joinRoomVonageSession.sessionId) {
            return;
        }

        try {
            if (!openTokProps.session) {
                throw new Error("No session");
            }

            await openTokMethods.connectSession(result.data.joinRoomVonageSession.accessToken, openTokProps.session);
        } catch (e) {
            console.error("Failed to join room", e);
            toast({
                status: "error",
                description: "Cannot connect to room",
            });
        }
    }, [getRoomVonageToken, openTokMethods, openTokProps.session, toast]);

    useEffect(() => {
        if (!videoContainerRef.current) {
            throw new Error("No element to publish to");
        }

        if (computedState.videoTrack && openTokProps.publisher["camera"]) {
            openTokMethods.republish({
                name: "camera",
                element: videoContainerRef.current,
                options: {
                    videoSource: computedState.videoTrack?.getSettings().deviceId,
                    audioSource: computedState.audioTrack?.getSettings().deviceId,
                    publishAudio: state.microphoneIntendedEnabled,
                    publishVideo: state.cameraIntendedEnabled,
                    insertMode: "append",
                    style: {},
                    facingMode: "user",
                    height: 300,
                    width: 300,
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedState.videoTrack]);

    useEffect(() => {
        if (!videoContainerRef.current) {
            throw new Error("No element to publish to");
        }

        if (openTokProps.publisher["camera"] && !state.cameraIntendedEnabled) {
            openTokMethods.republish({
                name: "camera",
                element: videoContainerRef.current,
                options: {
                    videoSource: computedState.videoTrack?.getSettings().deviceId,
                    audioSource: computedState.audioTrack?.getSettings().deviceId,
                    publishAudio: state.microphoneIntendedEnabled,
                    publishVideo: state.cameraIntendedEnabled,
                    insertMode: "append",
                    style: {},
                    facingMode: "user",
                    height: 300,
                    width: 300,
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.cameraIntendedEnabled]);

    useEffect(() => {
        if (openTokProps.publisher["camera"]) {
            if (computedState.audioTrack) {
                openTokProps.publisher["camera"].publishAudio(true);
                openTokProps.publisher["camera"].setAudioSource(computedState.audioTrack);
            } else {
                openTokProps.publisher["camera"].publishAudio(false);
                openTokProps.publisher["camera"].setAudioSource(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedState.audioTrack]);

    const streamCreatedHandler = useCallback(
        (event: EventMap["streamCreated"]) => {
            console.log("Stream created", event.stream.streamId);
            openTokMethods.subscribe({
                stream: event.stream,
                element: videoContainerRef.current ?? undefined,
                options: {
                    insertMode: "append",
                    height: "300",
                    width: "300",
                },
            });
        },
        [openTokMethods]
    );
    useSessionEventHandler("streamCreated", streamCreatedHandler, openTokProps.session);

    const streamDestroyedHandler = useCallback(
        (event: EventMap["streamDestroyed"]) => {
            console.log("Stream destroyed", event.stream.streamId);
            openTokMethods.unsubscribe({
                stream: event.stream,
            });
        },
        [openTokMethods]
    );
    useSessionEventHandler("streamDestroyed", streamDestroyedHandler, openTokProps.session);

    const sessionConnectedHandler = useCallback(
        async (event: EventMap["sessionConnected"]) => {
            console.log("Session connected", event.target.sessionId);

            if (!videoContainerRef.current) {
                throw new Error("No element to publish to");
            }

            if (!openTokProps.publisher["camera"]) {
                console.log("Publishing camera");
                await openTokMethods.publish({
                    name: "camera",
                    element: videoContainerRef.current,
                    options: {
                        videoSource: computedState.videoTrack?.getSettings().deviceId,
                        audioSource: computedState.audioTrack?.getSettings().deviceId,
                        publishAudio: state.microphoneIntendedEnabled,
                        publishVideo: state.cameraIntendedEnabled,
                        insertMode: "append",
                        style: {},
                        height: 300,
                        width: 300,
                    },
                });
            }
        },
        [
            openTokProps.publisher,
            openTokMethods,
            computedState.videoTrack,
            computedState.audioTrack,
            state.microphoneIntendedEnabled,
            state.cameraIntendedEnabled,
        ]
    );
    useSessionEventHandler("sessionConnected", sessionConnectedHandler, openTokProps.session);

    const sessionDisconnectedHandler = useCallback(
        (event: EventMap["sessionDisconnected"]) => {
            console.log("Session disconnected", event.target.sessionId);
            if (openTokProps.publisher["camera"]) {
                console.log("Unpublishing camera");
                openTokMethods.unpublish({ name: "camera" });
            }
        },
        [openTokMethods, openTokProps.publisher]
    );
    useSessionEventHandler("sessionDisconnected", sessionDisconnectedHandler, openTokProps.session);

    // const connectionCreatedHandler = useCallback(() => {

    // })

    const leaveRoom = useCallback(() => {
        if (openTokProps.isSessionConnected) {
            openTokMethods.disconnectSession();
        }
    }, [openTokMethods, openTokProps.isSessionConnected]);

    return (
        <Box minH="100%" display="grid" gridTemplateRows="1fr auto">
            <Box position="relative">
                <Box position="absolute" width="100%" height="100%" ref={videoContainerRef} overflowY="auto"></Box>
                {openTokProps.session?.connection ? (
                    <></>
                ) : (
                    <VStack justifyContent="center" height="100%" position="absolute" width="100%">
                        <Box height="50%">
                            <PreJoin cameraPreviewRef={cameraPreviewRef} />
                        </Box>
                    </VStack>
                )}
            </Box>
            <VonageRoomControlBar onJoinRoom={joinRoom} onLeaveRoom={leaveRoom} />
        </Box>
    );
}

const AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

function PreJoin({ cameraPreviewRef }: { cameraPreviewRef: React.RefObject<HTMLVideoElement> }): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const toast = useToast();
    const placeholderColour = useColorModeValue("black", "white");

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [cameraPreviewRef, state.cameraStream, toast]);

    return (
        <HStack>
            <Box position="relative">
                <Box position="absolute" width="50%" top="50%" left="50%" transform="translate(-50%,-50%)">
                    <PlaceholderImage colour={placeholderColour} />
                </Box>
                <video
                    ref={cameraPreviewRef}
                    autoPlay={true}
                    style={{
                        border: "1px solid gray",
                        height: "300px",
                        width: "300px",
                        objectFit: "cover",
                        transform: "rotateY(180deg)",
                    }}
                />
                <Box position="absolute" bottom="5" right="5">
                    {state.microphoneStream ? (
                        <VolumeMeter
                            audioContext={AudioContext}
                            height={50}
                            width={50}
                            shape={VmShape.VM_STEPPED}
                            stream={Optional.of(state.microphoneStream)}
                        />
                    ) : (
                        <></>
                    )}
                </Box>
            </Box>
        </HStack>
    );
}

function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
}): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const { isOpen, onClose, onOpen } = useDisclosure();

    const startCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: true,
        });
    }, [dispatch]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [dispatch]);

    const startMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: true,
        });
    }, [dispatch]);

    const stopMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
        });
    }, [dispatch]);

    return (
        <>
            <HStack p={2}>
                <Button leftIcon={<SettingsIcon />} onClick={onOpen}>
                    Settings
                </Button>
                {state.cameraStream ? (
                    <Button onClick={stopCamera}>
                        <FAIcon icon="video-slash" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop video</span>
                    </Button>
                ) : (
                    <Button onClick={startCamera}>
                        <FAIcon icon="video" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Start video</span>
                    </Button>
                )}
                {state.microphoneStream ? (
                    <Button onClick={stopMicrophone} mr="auto">
                        <FAIcon icon="microphone-slash" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop microphone</span>
                    </Button>
                ) : (
                    <Button onClick={startMicrophone} mr="auto">
                        <FAIcon icon="microphone" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                    </Button>
                )}
                <Button colorScheme="green" onClick={onJoinRoom}>
                    Join Room
                </Button>
                <Button colorScheme="green" onClick={onLeaveRoom}>
                    Leave Room
                </Button>
            </HStack>
            <DeviceChooserModal
                cameraId={
                    state.preferredCameraId ?? state.cameraStream?.getVideoTracks()[0].getSettings().deviceId ?? null
                }
                microphoneId={
                    state.preferredMicrophoneId ??
                    state.microphoneStream?.getAudioTracks()[0].getSettings().deviceId ??
                    null
                }
                isOpen={isOpen}
                onChangeCamera={(cameraId) =>
                    dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId })
                }
                onChangeMicrophone={(microphoneId) =>
                    dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId })
                }
                onClose={onClose}
                onOpen={onOpen}
            />
        </>
    );
}
