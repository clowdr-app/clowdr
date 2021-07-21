import { CheckCircleIcon, NotAllowedIcon, SettingsIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    chakra,
    HStack,
    Spinner,
    Stack,
    Tag,
    TagLabel,
    TagLeftIcon,
    Tooltip,
    useToast,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import FAIcon from "../../../../Icons/FAIcon";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";
import { StateType } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";

export function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
    onCancelJoinRoom,
    joining,
    joinRoomButtonText = "Join Room",
    joiningRoomButtonText = "Waiting to be admitted",
    requireMicrophone,
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
    onCancelJoinRoom?: () => void;
    joining: boolean;
    joinRoomButtonText?: string;
    joiningRoomButtonText?: string;
    requireMicrophone: boolean;
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
                if (cameraId) {
                    if (cameraId !== state.preferredCameraId) {
                        dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId });
                    }
                } else {
                    dispatch({ type: VonageRoomStateActionType.ClearPreferredCamera });
                }

                if (microphoneId) {
                    if (microphoneId !== state.preferredMicrophoneId) {
                        dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId });
                    }
                } else {
                    dispatch({ type: VonageRoomStateActionType.ClearPreferredMicrophone });
                }

                if (startCameraOnClose && cameraId) {
                    dispatch({
                        type: VonageRoomStateActionType.SetCameraIntendedState,
                        cameraEnabled: true,
                        onError: undefined,
                    });
                }

                if (startMicrophoneOnClose && microphoneId) {
                    dispatch({
                        type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                        microphoneEnabled: true,
                        onError: undefined,
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
                onError: () => {
                    dispatch({
                        type: VonageRoomStateActionType.ClearPreferredCamera,
                    });
                    dispatch({
                        type: VonageRoomStateActionType.ClearPreferredMicrophone,
                    });

                    setStartCameraOnClose(true);
                    onOpen(true, false);
                },
            });
        }
    }, [dispatch, onOpen, state.preferredCameraId]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
            onError: undefined,
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
                onError: () => {
                    dispatch({
                        type: VonageRoomStateActionType.ClearPreferredCamera,
                    });
                    dispatch({
                        type: VonageRoomStateActionType.ClearPreferredMicrophone,
                    });

                    setStartMicrophoneOnClose(true);
                    onOpen(false, true);
                },
            });
        }
    }, [dispatch, onOpen, state.preferredMicrophoneId]);

    const stopMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
            onError: undefined,
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
            <Stack
                p={2}
                direction={vonage.state.type === StateType.Connected ? "row" : "column"}
                justifyContent="center"
                alignItems="stretch"
                flexWrap="wrap"
                gridRowGap={vonage.state.type === StateType.Connected ? 2 : undefined}
            >
                <Button
                    isLoading={isOpening}
                    leftIcon={<SettingsIcon />}
                    onClick={() => onOpen(true, !joining || !requireMicrophone)}
                    isDisabled={joining}
                    colorScheme="blue"
                >
                    Choose microphone / camera
                </Button>
                {state.microphoneStream ? (
                    <Button onClick={stopMicrophone} colorScheme="purple" isDisabled={joining}>
                        <FAIcon icon="microphone" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Mute</span>
                    </Button>
                ) : (
                    <Button isLoading={isOpening} onClick={startMicrophone} isDisabled={joining} colorScheme="blue">
                        <FAIcon icon="microphone-slash" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Unmute</span>
                    </Button>
                )}
                {state.cameraStream ? (
                    <Button onClick={stopCamera} colorScheme="purple" isDisabled={joining}>
                        <FAIcon icon="video" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Stop video</span>
                    </Button>
                ) : (
                    <Button isLoading={isOpening} onClick={startCamera} isDisabled={joining} colorScheme="blue">
                        <FAIcon icon="video-slash" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Start video</span>
                    </Button>
                )}
                {vonage.state.type === StateType.Connected && receivingScreenShare ? (
                    <Tag size="sm" variant="outline" colorScheme="blue" px={2} py="4px" ml={1} mr="auto" maxW="190px">
                        <TagLeftIcon as={CheckCircleIcon} />
                        <TagLabel whiteSpace="normal">Someone else is sharing their screen at the moment</TagLabel>
                    </Tag>
                ) : vonage.state.type === StateType.Connected && state.screenShareIntendedEnabled ? (
                    <Button onClick={stopScreenShare} mr="auto" colorScheme="red" isDisabled={joining}>
                        <FAIcon icon="desktop" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop sharing</span>
                    </Button>
                ) : vonage.state.type === StateType.Connected &&
                  vonage.state.initialisedState.screenSharingSupported ? (
                    <Button onClick={startScreenShare} mr="auto" isDisabled={joining} colorScheme="blue">
                        <FAIcon icon="desktop" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Share screen</span>
                    </Button>
                ) : vonage.state.type === StateType.Initialised && vonage.state.screenSharingSupported ? (
                    <Tag size="md" variant="outline" colorScheme="blue">
                        <TagLeftIcon as={CheckCircleIcon} />
                        <TagLabel whiteSpace="normal">Screen sharing available after you join</TagLabel>
                    </Tag>
                ) : (
                    <Tag size="md" variant="outline" colorScheme="red">
                        <TagLeftIcon as={NotAllowedIcon} />
                        <TagLabel whiteSpace="normal">Screen sharing is not supported by your browser</TagLabel>
                    </Tag>
                )}
                {vonage.state.type === StateType.Connected ? (
                    <Button colorScheme="purple" onClick={onLeaveRoom}>
                        Leave Room
                    </Button>
                ) : (
                    <Tooltip
                        label={
                            requireMicrophone && !state.microphoneIntendedEnabled ? "Microphone required" : undefined
                        }
                    >
                        <Box w="100%">
                            <Button
                                w="100%"
                                size="xl"
                                colorScheme={joining ? "yellow" : "purple"}
                                h="auto"
                                py={4}
                                variant="glowing"
                                onClick={joining ? onCancelJoinRoom : onJoinRoom}
                                isLoading={!onCancelJoinRoom && joining}
                                isDisabled={!joining && requireMicrophone && !state.microphoneIntendedEnabled}
                                whiteSpace="normal"
                                overflow="hidden"
                                display="inline-flex"
                                flexDir="column"
                            >
                                <HStack alignItems="flex-end">
                                    {joining ? <Spinner size="sm" speed="2.5s" thickness="4px" /> : undefined}
                                    <chakra.span fontSize="xl">
                                        {joining ? joiningRoomButtonText : joinRoomButtonText}
                                    </chakra.span>
                                </HStack>
                                {joining ? (
                                    <chakra.span mt={2} fontSize="xs">
                                        (Click to cancel)
                                    </chakra.span>
                                ) : undefined}
                            </Button>
                        </Box>
                    </Tooltip>
                )}
            </Stack>
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
