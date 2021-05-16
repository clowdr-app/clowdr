import { CheckCircleIcon, NotAllowedIcon, SettingsIcon } from "@chakra-ui/icons";
import { Button, Stack, Tag, TagLabel, TagLeftIcon, useToast } from "@chakra-ui/react";
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
    joinRoomButtonText = "Join Room",
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
    joining: boolean;
    joinRoomButtonText?: string;
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

    /*
    BCP: Might be useful to play with the color and size of the join room buttom -- e.g., 
                                    colorScheme="red"
                                    w="12em"
                                    h="8ex"
    */
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
                <Button isLoading={isOpening} leftIcon={<SettingsIcon />} onClick={() => onOpen(true, true)}>
                    Choose microphone / camera
                </Button>
                {state.microphoneStream ? (
                    <Button onClick={stopMicrophone} colorScheme="purple">
                        <FAIcon icon="microphone" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Mute</span>
                    </Button>
                ) : (
                    <Button isLoading={isOpening} onClick={startMicrophone}>
                        <FAIcon icon="microphone-slash" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Unmute</span>
                    </Button>
                )}
                {state.cameraStream ? (
                    <Button onClick={stopCamera} colorScheme="purple">
                        <FAIcon icon="video" iconStyle="s" />
                        <span style={{ marginLeft: "1rem" }}>Stop video</span>
                    </Button>
                ) : (
                    <Button isLoading={isOpening} onClick={startCamera}>
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
                    <Button onClick={stopScreenShare} mr="auto" colorScheme="red">
                        <FAIcon icon="desktop" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop sharing</span>
                    </Button>
                ) : vonage.state.type === StateType.Connected &&
                  vonage.state.initialisedState.screenSharingSupported ? (
                    <Button onClick={startScreenShare} mr="auto">
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
                    <Button colorScheme="green" onClick={onLeaveRoom}>
                        Leave Room
                    </Button>
                ) : (
                    <Button
                        size="xl"
                        colorScheme="green"
                        h="auto"
                        py={4}
                        fontSize="xl"
                        onClick={onJoinRoom}
                        isLoading={joining}
                    >
                        {joinRoomButtonText}
                    </Button>
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
