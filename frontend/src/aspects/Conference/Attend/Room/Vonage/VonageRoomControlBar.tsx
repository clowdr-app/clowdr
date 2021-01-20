import { CheckCircleIcon, NotAllowedIcon, SettingsIcon } from "@chakra-ui/icons";
import { Box, Button, Tag, TagLabel, TagLeftIcon, useToast, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import FAIcon from "../../../../Icons/FAIcon";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";
import { StateType } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";

export function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
    joining,
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
    joining: boolean;
}): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const vonage = useVonageGlobalState();

    const [isOpening, setIsOpening] = useState<boolean>(false);
    const [userMediaPermissionGranted, setUserMediaPermissionGranted] = useState<{
        camera: boolean;
        microphone: boolean;
    }>({
        camera: false,
        microphone: false,
    });
    const [deviceModalState, setDeviceModalState] = useState<{
        isOpen: boolean;
        showCamera: boolean;
        showMicrophone: boolean;
    }>({
        isOpen: false,
        showCamera: false,
        showMicrophone: false,
    });

    const [startCameraOnClose, setStartCameraOnClose] = useState<boolean>(false);
    const [startMicrophoneOnClose, setStartMicrophoneOnClose] = useState<boolean>(false);

    const toast = useToast();

    const onClose = useCallback(
        (madeSelection: boolean, cameraId: string | null = null, microphoneId: string | null = null) => {
            if (madeSelection) {
                if (cameraId && cameraId !== state.preferredCameraId) {
                    dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId });
                }

                if (microphoneId && microphoneId !== state.preferredMicrophoneId) {
                    dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId });
                }

                if (startCameraOnClose && cameraId) {
                    dispatch({
                        type: VonageRoomStateActionType.SetCameraIntendedState,
                        cameraEnabled: true,
                    });
                }

                if (startMicrophoneOnClose && microphoneId) {
                    dispatch({
                        type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                        microphoneEnabled: true,
                    });
                }
            }

            setStartCameraOnClose(false);
            setStartMicrophoneOnClose(false);

            setDeviceModalState({
                ...deviceModalState,
                isOpen: false,
            });
        },
        [
            deviceModalState,
            dispatch,
            startCameraOnClose,
            startMicrophoneOnClose,
            state.preferredCameraId,
            state.preferredMicrophoneId,
        ]
    );
    const onOpen = useCallback(
        (video: boolean, audio: boolean) => {
            setIsOpening(true);
            (async () => {
                try {
                    if (
                        (video && !userMediaPermissionGranted.camera) ||
                        (audio && !userMediaPermissionGranted.microphone)
                    ) {
                        try {
                            await navigator.mediaDevices.getUserMedia({ video, audio });
                        } catch (e) {
                            // if you try to get user media while mic/cam are active, you run into an error
                            const msg = e.toString();
                            if (!msg.includes("Concurrent") || !msg.includes("limit")) {
                                throw e;
                            }
                        }
                        setUserMediaPermissionGranted({
                            camera: userMediaPermissionGranted.camera || video,
                            microphone: userMediaPermissionGranted.microphone || audio,
                        });
                    }
                    setDeviceModalState({
                        isOpen: true,
                        showCamera: video,
                        showMicrophone: audio,
                    });
                } catch (e) {
                    toast({
                        status: "error",
                        title: "Unable to get media devices - was permission denied?",
                        description: e.message ?? e.toString(),
                        isClosable: true,
                        duration: 15000,
                        position: "bottom",
                    });
                    setUserMediaPermissionGranted({
                        camera: video ? false : userMediaPermissionGranted.camera,
                        microphone: audio ? false : userMediaPermissionGranted.microphone,
                    });
                } finally {
                    setIsOpening(false);
                }
            })();
        },
        [toast, userMediaPermissionGranted.camera, userMediaPermissionGranted.microphone]
    );

    const startCamera = useCallback(() => {
        if (!state.preferredCameraId) {
            setStartCameraOnClose(true);
            onOpen(true, false);
        } else {
            dispatch({
                type: VonageRoomStateActionType.SetCameraIntendedState,
                cameraEnabled: true,
            });
        }
    }, [dispatch, onOpen, state.preferredCameraId]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [dispatch]);

    const startMicrophone = useCallback(() => {
        if (!state.preferredMicrophoneId) {
            setStartMicrophoneOnClose(true);
            onOpen(false, true);
        } else {
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: true,
            });
        }
    }, [dispatch, onOpen, state.preferredMicrophoneId]);

    const stopMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
        });
    }, [dispatch]);

    const startScreenShare = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetScreenShareIntendedState,
            screenEnabled: true,
        });
    }, [dispatch]);

    const stopScreenShare = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetScreenShareIntendedState,
            screenEnabled: false,
        });
    }, [dispatch]);

    const receivingScreenShare = useMemo(
        () =>
            vonage.state.type === StateType.Connected
                ? vonage.state.streams.find((s) => s.videoType === "screen")
                : false,
        [vonage.state]
    );

    return (
        <>
            <VStack my={4}>
                <Wrap p={2}>
                    <WrapItem>
                        <Box>
                            {vonage.state.type === StateType.Connected ? (
                                <Button colorScheme="green" onClick={onLeaveRoom}>
                                    Leave Room
                                </Button>
                            ) : (
                                <Button
                                    colorScheme="green"
                                    w="10em"
                                    h="6ex"
                                    fontSize="xl"
                                    onClick={onJoinRoom}
                                    isLoading={joining}
                                >
                                    Join Room
                                </Button>
                            )}
                        </Box>
                    </WrapItem>
                    <WrapItem>
                        <Button isLoading={isOpening} leftIcon={<SettingsIcon />} onClick={() => onOpen(true, true)}>
                            Settings
                        </Button>
                    </WrapItem>
                    {state.cameraStream ? (
                        <WrapItem>
                            <Button onClick={stopCamera} colorScheme="purple">
                                <FAIcon icon="video" iconStyle="s" />
                                <span style={{ marginLeft: "1rem" }}>Stop camera</span>
                            </Button>
                        </WrapItem>
                    ) : (
                        <WrapItem>
                            <Button isLoading={isOpening} onClick={startCamera}>
                                <FAIcon icon="video-slash" iconStyle="s" />
                                <span style={{ marginLeft: "1rem" }}>Start camera</span>
                            </Button>
                        </WrapItem>
                    )}
                    {state.microphoneStream ? (
                        <WrapItem>
                            <Button onClick={stopMicrophone} colorScheme="purple">
                                <FAIcon icon="microphone" iconStyle="s" />
                                <span style={{ marginLeft: "1rem" }}>Stop microphone</span>
                            </Button>
                        </WrapItem>
                    ) : (
                        <WrapItem>
                            <Button isLoading={isOpening} onClick={startMicrophone}>
                                <FAIcon icon="microphone-slash" iconStyle="s" />
                                <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                            </Button>
                        </WrapItem>
                    )}
                    {vonage.state.type === StateType.Connected && receivingScreenShare ? (
                        <WrapItem>
                            <Tag
                                size="sm"
                                variant="outline"
                                colorScheme="blue"
                                px={2}
                                py="4px"
                                ml={1}
                                mr="auto"
                                maxW="190px"
                            >
                                <TagLeftIcon as={CheckCircleIcon} />
                                <TagLabel whiteSpace="normal">
                                    Someone else is sharing their screen at the moment
                                </TagLabel>
                            </Tag>
                        </WrapItem>
                    ) : vonage.state.type === StateType.Connected && state.screenShareIntendedEnabled ? (
                        <WrapItem>
                            <Button onClick={stopScreenShare} mr="auto" colorScheme="red">
                                <FAIcon icon="desktop" iconStyle="s" mr="auto" />
                                <span style={{ marginLeft: "1rem" }}>Stop sharing</span>
                            </Button>
                        </WrapItem>
                    ) : vonage.state.type === StateType.Connected &&
                      vonage.state.initialisedState.screenSharingSupported ? (
                        <WrapItem>
                            <Button onClick={startScreenShare} mr="auto">
                                <FAIcon icon="desktop" iconStyle="s" mr="auto" />
                                <span style={{ marginLeft: "1rem" }}>Share screen</span>
                            </Button>
                        </WrapItem>
                    ) : vonage.state.type === StateType.Initialised && vonage.state.screenSharingSupported ? (
                        <WrapItem>
                            <Tag
                                size="sm"
                                variant="outline"
                                colorScheme="blue"
                                px={2}
                                py="4px"
                                ml={1}
                                mr="auto"
                                maxW="170px"
                            >
                                <TagLeftIcon as={CheckCircleIcon} />
                                <TagLabel whiteSpace="normal">Screen sharing available after you join</TagLabel>
                            </Tag>
                        </WrapItem>
                    ) : (
                        <WrapItem>
                            <Tag
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                px={2}
                                py="4px"
                                ml={1}
                                mr="auto"
                                maxW="190px"
                            >
                                <TagLeftIcon as={NotAllowedIcon} />
                                <TagLabel whiteSpace="normal">Screen sharing is not supported by your browser</TagLabel>
                            </Tag>
                        </WrapItem>
                    )}
                </Wrap>
            </VStack>
            <DeviceChooserModal
                cameraId={
                    state.cameraStream?.getVideoTracks()[0].getSettings().deviceId ?? state.preferredCameraId ?? null
                }
                microphoneId={
                    state.microphoneStream?.getAudioTracks()[0].getSettings().deviceId ??
                    state.preferredMicrophoneId ??
                    null
                }
                isOpen={deviceModalState.isOpen}
                showCamera={deviceModalState.showCamera}
                showMicrophone={deviceModalState.showMicrophone}
                onClose={onClose}
                onOpen={() => onOpen(true, true)}
            />
        </>
    );
}
