import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { gql } from "@apollo/client";
import { SettingsIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, useDisclosure, useToast, VStack } from "@chakra-ui/react";
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

            if ((computedState.videoTrack || computedState.audioTrack) && !openTokProps.publisher["camera"]) {
                console.log("Publishing camera");
                await openTokMethods.publish({
                    name: "camera",
                    element: videoContainerRef.current,
                    options: {
                        videoSource: computedState.videoTrack?.getSettings().deviceId,
                        audioSource: computedState.audioTrack?.getSettings().deviceId,
                        insertMode: "append",
                        style: {},
                        height: 300,
                        width: 300,
                    },
                });
            }
        },
        [computedState.videoTrack, computedState.audioTrack, openTokMethods, openTokProps.publisher]
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

    const leaveRoom = useCallback(() => {
        if (openTokProps.isSessionConnected) {
            openTokMethods.disconnectSession();
        }
    }, [openTokMethods, openTokProps.isSessionConnected]);

    return (
        <Box minH="100%" display="grid" gridTemplateRows="1fr auto">
            <Box position="relative">
                <VStack justifyContent="center" height="100%" position="absolute" width="100%">
                    <Box height="50%">
                        <PreJoin />
                    </Box>
                </VStack>
                <Box
                    position="absolute"
                    pointerEvents="none"
                    width="100%"
                    height="100%"
                    ref={videoContainerRef}
                    overflowY="auto"
                ></Box>
            </Box>
            <VonageRoomControlBar onJoinRoom={joinRoom} onLeaveRoom={leaveRoom} />
        </Box>
    );
}

const AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

function PreJoin(): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);
    const toast = useToast();

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

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [state.cameraStream, toast]);

    return (
        <HStack>
            <Box position="relative">
                <Box position="absolute" width="50%" top="50%" left="50%" transform="translate(-50%,-50%)">
                    <PlaceholderImage colour="black" />
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
            <VStack alignItems="left">
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
                    <Button onClick={stopMicrophone}>
                        <FAIcon icon="microphone-slash" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop microphone</span>
                    </Button>
                ) : (
                    <Button onClick={startMicrophone}>
                        <FAIcon icon="microphone" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                    </Button>
                )}
            </VStack>
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

    return (
        <>
            <HStack p={2}>
                <Button mr="auto" leftIcon={<SettingsIcon />} onClick={onOpen}>
                    Settings
                </Button>
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
