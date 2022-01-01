import { CheckCircleIcon, NotAllowedIcon, SettingsIcon } from "@chakra-ui/icons";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Box,
    Button,
    ButtonGroup,
    chakra,
    Flex,
    Heading,
    HStack,
    IconButton,
    Spinner,
    Tag,
    TagLabel,
    TagLeftIcon,
    Text,
    Tooltip,
    useDisclosure,
    VStack,
    WrapItem,
} from "@chakra-ui/react";
import { Mutex } from "async-mutex";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql } from "urql";
import { useToggleVonageRecordingStateMutation } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import { devicesToFriendlyName } from "../VideoChat/PermissionInstructions";
import type { DevicesProps } from "../VideoChat/PermissionInstructionsContext";
import LayoutChooser from "./Components/LayoutChooser";
import PlayVideoMenuButton from "./Components/PlayVideoMenu";
import DeviceChooserModal from "./DeviceChooserModal";
import { StateType } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";
import { useVonageLayout } from "./VonageLayoutProvider";

gql`
    mutation ToggleVonageRecordingState($vonageSessionId: String!, $recordingActive: Boolean!) {
        toggleVonageRecordingState(vonageSessionId: $vonageSessionId, recordingActive: $recordingActive) {
            allowed
            recordingState
        }
    }
`;

export function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
    onCancelJoinRoom,
    joining,
    joinRoomButtonText = "Join Room",
    joiningRoomButtonText = "Waiting to be admitted",
    requireMicrophoneOrCamera,
    onPermissionsProblem,
    isRecordingActive,
    isBackstage,
    canControlRecording,
    roomId,
    eventId,
}: {
    onJoinRoom: () => Promise<void>;
    onLeaveRoom: () => void;
    onCancelJoinRoom?: () => void;
    joining: boolean;
    joinRoomButtonText?: string;
    joiningRoomButtonText?: string;
    requireMicrophoneOrCamera: boolean;
    isRecordingActive: boolean;
    isBackstage: boolean;
    onPermissionsProblem: (devices: DevicesProps, title: string | null) => void;
    canControlRecording: boolean;
    roomId?: string;
    eventId?: string;
}): JSX.Element {
    const { state, dispatch, settings } = useVonageRoom();
    const vonage = useVonageGlobalState();
    const { layoutChooser_isOpen, layoutChooser_onOpen, layoutChooser_onClose } = useVonageLayout();

    const [toggleVonageRecordingResponse, toggleVonageRecording] = useToggleVonageRecordingStateMutation();

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

    // const toast = useToast();

    const onClose = useCallback(
        (
            madeSelection: "made-selection" | "cancelled" | "unable-to-list",
            cameraId: string | null = null,
            microphoneId: string | null = null
        ) => {
            switch (madeSelection) {
                case "made-selection":
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
                    break;

                case "unable-to-list":
                    onPermissionsProblem(
                        {
                            camera: deviceModalState.showCamera,
                            microphone: deviceModalState.showMicrophone,
                        },
                        `Could not list choices of ${devicesToFriendlyName(
                            {
                                camera: deviceModalState.showCamera,
                                microphone: deviceModalState.showMicrophone,
                            },
                            "or"
                        )}`
                    );
                    break;
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
            onPermissionsProblem,
            startCameraOnClose,
            startMicrophoneOnClose,
            state.preferredCameraId,
            state.preferredMicrophoneId,
        ]
    );
    const dialogOpenMutex = useRef(new Mutex());
    const onOpen = useCallback(
        async (video: boolean, audio: boolean) => {
            const release = await dialogOpenMutex.current.acquire();
            setIsOpening(true);
            (async () => {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const canSeeVideoDevices = devices
                        .filter((d) => d.kind === "videoinput")
                        .some((d) => d.label.length > 0);
                    const canSeeAudioDevices = devices
                        .filter((d) => d.kind === "audioinput")
                        .some((d) => d.label.length > 0);
                    if (
                        (video && (!userMediaPermissionGranted.camera || !canSeeVideoDevices)) ||
                        (audio && (!userMediaPermissionGranted.microphone || !canSeeAudioDevices))
                    ) {
                        let gotVideoPermission = false;
                        let gotAudioPermission = false;
                        if (video) {
                            try {
                                await navigator.mediaDevices.getUserMedia({ video });
                                gotVideoPermission = true;
                            } catch (err: any) {
                                // if you try to get user media while mic/cam are active, you run into an error
                                const msg = err.toString();
                                if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
                                    console.warn("No devices found by getUserMedia", { err, video });
                                } else if (!msg.includes("Concurrent") || !msg.includes("limit")) {
                                    throw err;
                                }
                            }
                        }
                        if (audio) {
                            try {
                                await navigator.mediaDevices.getUserMedia({ audio });
                                gotAudioPermission = true;
                            } catch (err: any) {
                                // if you try to get user media while mic/cam are active, you run into an error
                                const msg = err.toString();
                                if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
                                    console.warn("No devices found by getUserMedia", { err, audio });
                                } else if (!msg.includes("Concurrent") || !msg.includes("limit")) {
                                    throw err;
                                }
                            }
                        }
                        setUserMediaPermissionGranted({
                            camera: userMediaPermissionGranted.camera || gotVideoPermission,
                            microphone: userMediaPermissionGranted.microphone || gotAudioPermission,
                        });
                    }
                    setDeviceModalState({
                        isOpen: true,
                        showCamera: video,
                        showMicrophone: audio,
                    });
                } catch (err) {
                    console.log("Could not list device choices", { err });
                    onPermissionsProblem(
                        { camera: video, microphone: audio },
                        `Could not list choices of ${devicesToFriendlyName(
                            { camera: video, microphone: audio },
                            "and"
                        )}`
                    );
                    setUserMediaPermissionGranted({
                        camera: video ? false : userMediaPermissionGranted.camera,
                        microphone: audio ? false : userMediaPermissionGranted.microphone,
                    });
                } finally {
                    setIsOpening(false);
                    release();
                }
            })();
        },
        [onPermissionsProblem, userMediaPermissionGranted.camera, userMediaPermissionGranted.microphone]
    );

    const startCamera = useCallback(() => {
        if (!state.preferredCameraId) {
            setStartCameraOnClose(true);
            onOpen(true, false);
        } else if (state.cameraIntendedEnabled) {
            // Something must have desynced, so disable the camera
            dispatch({
                type: VonageRoomStateActionType.SetCameraIntendedState,
                cameraEnabled: false,
                explicitlyDisabled: true,
                onError: undefined,
            });
        } else {
            dispatch({
                type: VonageRoomStateActionType.SetCameraIntendedState,
                cameraEnabled: true,
                onError: () => {
                    dispatch({
                        type: VonageRoomStateActionType.ClearPreferredCamera,
                    });
                    setUserMediaPermissionGranted({
                        camera: false,
                        microphone: userMediaPermissionGranted.microphone,
                    });
                    // dispatch({
                    //     type: VonageRoomStateActionType.ClearPreferredMicrophone,
                    // });

                    setStartCameraOnClose(true);
                    onOpen(true, false);
                },
            });
        }
    }, [dispatch, onOpen, state.cameraIntendedEnabled, state.preferredCameraId, userMediaPermissionGranted.microphone]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
            explicitlyDisabled: true,
            onError: undefined,
        });
    }, [dispatch]);

    const startMicrophone = useCallback(() => {
        if (!state.preferredMicrophoneId) {
            setStartMicrophoneOnClose(true);
            onOpen(false, true);
        } else if (state.microphoneIntendedEnabled) {
            // Something must have desynced, so disable the microphone
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: false,
                explicitlyDisabled: true,
                onError: undefined,
            });
        } else {
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: true,
                onError: () => {
                    // dispatch({
                    //     type: VonageRoomStateActionType.ClearPreferredCamera,
                    // });
                    dispatch({
                        type: VonageRoomStateActionType.ClearPreferredMicrophone,
                    });
                    setUserMediaPermissionGranted({
                        camera: userMediaPermissionGranted.camera,
                        microphone: false,
                    });

                    setStartMicrophoneOnClose(true);
                    onOpen(false, true);
                },
            });
        }
    }, [
        dispatch,
        onOpen,
        state.microphoneIntendedEnabled,
        state.preferredMicrophoneId,
        userMediaPermissionGranted.camera,
    ]);

    const stopMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
            explicitlyDisabled: true,
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

    const receivingScreenShareCount = useMemo(
        () =>
            vonage.state.type === StateType.Connected
                ? vonage.state.streams.filter((s) => s.videoType === "screen").length
                : 0,
        [vonage.state]
    );

    const {
        isOpen: isRecordingAlertOpen,
        onOpen: onRecordingAlertOpen,
        onClose: onRecordingAlertClose,
    } = useDisclosure();
    const recordingAlert_LeastDestructiveRef = useRef<HTMLButtonElement | null>(null);
    const [recentlyConnected, setRecentlyConnected] = useState<boolean>(false);
    const [recentlyToggledRecording, setRecentlyToggledRecording] = useState<boolean>(false);
    useEffect(() => {
        if (!isRecordingActive || vonage.state.type !== StateType.Connected) {
            onRecordingAlertClose();
        }
    }, [isRecordingActive, onRecordingAlertClose, vonage.state.type]);
    useEffect(() => {
        let tId: number | undefined;
        if (vonage.state.type === StateType.Connected) {
            setRecentlyConnected(true);

            tId = setTimeout(
                (() => {
                    setRecentlyConnected(false);
                }) as TimerHandler,
                30000
            );
        } else {
            setRecentlyConnected(false);
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [vonage.state.type]);
    useEffect(() => {
        if (isRecordingActive && !recentlyConnected && !recentlyToggledRecording) {
            onRecordingAlertOpen();
        }
        setRecentlyToggledRecording(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecordingActive]);

    const buttonsDirection = vonage.state.type === StateType.Connected ? "row" : "column";

    useEffect(() => {
        if (vonage.state.type !== StateType.Connected) {
            layoutChooser_onClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonage.state.type]);

    return (
        <>
            <Flex
                p={2}
                direction={buttonsDirection}
                justifyContent="flex-end"
                alignItems={vonage.state.type === StateType.Connected ? "center" : "stretch"}
                flexWrap="wrap"
                gridRowGap={2}
                gridColumnGap={2}
                w={vonage.state.type === StateType.Connected ? "100%" : "auto"}
            >
                <Tooltip label="Configure mic/cam">
                    <IconButton
                        size="sm"
                        isLoading={isOpening}
                        icon={<SettingsIcon />}
                        onClick={() => onOpen(true, !joining || !requireMicrophoneOrCamera)}
                        isDisabled={joining}
                        colorScheme="RoomControlBarButton"
                        aria-label="Choose microphone / camera"
                    />
                </Tooltip>
                {state.microphoneStream && state.microphoneIntendedEnabled ? (
                    <Tooltip label="Mute">
                        <IconButton
                            size="sm"
                            onClick={stopMicrophone}
                            colorScheme="ActiveRoomControlBarButton"
                            isDisabled={joining}
                            icon={<FAIcon icon="microphone" iconStyle="s" />}
                            aria-label="Mute"
                        />
                    </Tooltip>
                ) : (
                    <Tooltip label="Unmute">
                        <IconButton
                            size="sm"
                            isLoading={isOpening}
                            onClick={startMicrophone}
                            isDisabled={joining}
                            colorScheme="InactiveRoomControlBarButton"
                            icon={<FAIcon icon="microphone-slash" iconStyle="s" />}
                            aria-label="Unmute"
                        />
                    </Tooltip>
                )}
                {state.cameraStream && state.cameraIntendedEnabled ? (
                    <Tooltip label="Stop camera">
                        <IconButton
                            size="sm"
                            onClick={stopCamera}
                            colorScheme="ActiveRoomControlBarButton"
                            isDisabled={joining}
                            icon={<FAIcon icon="video" iconStyle="s" />}
                            aria-label="Stop camera"
                        />
                    </Tooltip>
                ) : (
                    <Tooltip label="Start camera">
                        <IconButton
                            size="sm"
                            isLoading={isOpening}
                            onClick={startCamera}
                            isDisabled={joining}
                            colorScheme="InactiveRoomControlBarButton"
                            icon={<FAIcon icon="video-slash" iconStyle="s" />}
                            aria-label="Start camera"
                        />
                    </Tooltip>
                )}
                <WrapItem flex="1 1 auto" />
                {settings.maximumSimultaneousScreenShares ? (
                    vonage.state.type === StateType.Connected &&
                    receivingScreenShareCount >= settings.maximumSimultaneousScreenShares ? (
                        <Tag
                            size="sm"
                            variant="outline"
                            colorScheme="RoomControlBarNotice"
                            px={2}
                            py="4px"
                            ml={1}
                            mr="auto"
                            maxW="190px"
                        >
                            <TagLeftIcon as={CheckCircleIcon} />
                            <TagLabel whiteSpace="normal">
                                {settings.maximumSimultaneousScreenShares === 1
                                    ? "Someone else is sharing their screen at the moment"
                                    : "No more screens can be shared at the moment"}
                            </TagLabel>
                        </Tag>
                    ) : vonage.state.type === StateType.Connected && state.screenShareIntendedEnabled ? (
                        <Tooltip label="Stop sharing">
                            <IconButton
                                size="sm"
                                onClick={stopScreenShare}
                                mr="auto"
                                colorScheme="DestructiveActionButton"
                                isDisabled={joining}
                                icon={<FAIcon icon="desktop" iconStyle="s" />}
                                aria-label="Stop sharing"
                            />
                        </Tooltip>
                    ) : vonage.state.type === StateType.Connected &&
                      vonage.state.initialisedState.screenSharingSupported ? (
                        <Tooltip label="Share screen">
                            <IconButton
                                size="sm"
                                onClick={startScreenShare}
                                mr="auto"
                                isDisabled={joining}
                                colorScheme="RoomControlBarButton"
                                icon={<FAIcon icon="desktop" iconStyle="s" />}
                                aria-label="Share screen"
                            />
                        </Tooltip>
                    ) : vonage.state.type === StateType.Initialised && vonage.state.screenSharingSupported ? (
                        <Tag size="sm" variant="outline" colorScheme="RoomControlBarNotice">
                            <TagLeftIcon as={CheckCircleIcon} />
                            <TagLabel whiteSpace="normal">Screen sharing available after you join</TagLabel>
                        </Tag>
                    ) : (
                        <Tag size="sm" variant="outline" colorScheme="RoomControlBarNotice">
                            <TagLeftIcon as={NotAllowedIcon} />
                            <TagLabel whiteSpace="normal">Screen sharing is not supported by your browser</TagLabel>
                        </Tag>
                    )
                ) : undefined}
                {vonage.state.type === StateType.Connected && !isBackstage ? (
                    canControlRecording ? (
                        <Tooltip label={isRecordingActive ? "Stop recording" : "Start recording"}>
                            <IconButton
                                size="sm"
                                colorScheme={isRecordingActive ? "DestructiveActionButton" : "RoomControlBarButton"}
                                onClick={() => {
                                    if (vonage.state.type === StateType.Connected) {
                                        setRecentlyToggledRecording(true);
                                        toggleVonageRecording({
                                            vonageSessionId: vonage.state.session.sessionId,
                                            recordingActive: !isRecordingActive,
                                        });
                                    }
                                }}
                                isLoading={toggleVonageRecordingResponse.fetching}
                                icon={
                                    isRecordingActive ? (
                                        <FAIcon iconStyle="s" icon="circle" />
                                    ) : (
                                        <FAIcon iconStyle="r" icon="dot-circle" />
                                    )
                                }
                                aria-label={isRecordingActive ? "Stop recording" : "Start recording"}
                            />
                        </Tooltip>
                    ) : (
                        <Tag size="sm" variant="outline" colorScheme="RoomControlBarNotice">
                            {isRecordingActive ? (
                                <TagLabel overflow="visible">Recording</TagLabel>
                            ) : (
                                <TagLabel overflow="visible">Not recording</TagLabel>
                            )}
                        </Tag>
                    )
                ) : undefined}
                {vonage.state.type === StateType.Connected && canControlRecording && !isBackstage ? (
                    <PlayVideoMenuButton roomId={roomId} eventId={eventId} />
                ) : undefined}
                {/* TODO: Permissions */}
                {vonage.state.type === StateType.Connected && (isBackstage || canControlRecording) ? (
                    <Tooltip label={layoutChooser_isOpen ? "Cancel" : "Layout"}>
                        <IconButton
                            size="sm"
                            onClick={layoutChooser_isOpen ? layoutChooser_onClose : layoutChooser_onOpen}
                            colorScheme={layoutChooser_isOpen ? "PrimaryActionButton" : "RoomControlBarButton"}
                            aria-label={layoutChooser_isOpen ? "Cancel" : "Layout"}
                            icon={<FAIcon iconStyle="s" icon="th-large" />}
                        />
                    </Tooltip>
                ) : undefined}
                <WrapItem flex="1 1 auto" />
                {vonage.state.type === StateType.Connected ? (
                    <Button size="sm" colorScheme="DestructiveActionButton" onClick={onLeaveRoom}>
                        Leave
                    </Button>
                ) : (
                    <Tooltip
                        label={
                            requireMicrophoneOrCamera &&
                            !state.microphoneIntendedEnabled &&
                            !state.cameraIntendedEnabled
                                ? "Microphone or camera required"
                                : undefined
                        }
                    >
                        <Box w="100%">
                            <Button
                                w="100%"
                                size="xl"
                                colorScheme={joining ? "yellow" : "PrimaryActionButton"}
                                h="auto"
                                p={4}
                                variant="glowing"
                                onClick={joining ? onCancelJoinRoom : onJoinRoom}
                                isLoading={!onCancelJoinRoom && joining}
                                isDisabled={
                                    !joining &&
                                    requireMicrophoneOrCamera &&
                                    !state.microphoneIntendedEnabled &&
                                    !state.cameraIntendedEnabled
                                }
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
            </Flex>
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
            <AlertDialog
                isOpen={isRecordingAlertOpen}
                onClose={onRecordingAlertClose}
                leastDestructiveRef={recordingAlert_LeastDestructiveRef}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading as="h1" fontSize="md">
                            Recording has started
                        </Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <VStack>
                            <Text>
                                Recording of the video-call in this room has started. The recording will be managed by
                                the conference and be made available to you when recording ends. For further
                                information, please contact your conference organizers.
                            </Text>
                            <Text>You can find recordings under the My Stuff menu on the left.</Text>
                        </VStack>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup spacing={2}>
                            <Button
                                onClick={() => {
                                    onLeaveRoom();
                                    onRecordingAlertClose();
                                }}
                            >
                                Disconnect
                            </Button>
                            <Button
                                ref={recordingAlert_LeastDestructiveRef}
                                colorScheme="PrimaryActionButton"
                                onClick={() => onRecordingAlertClose()}
                            >
                                Ok, stay connected
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <LayoutChooser />
        </>
    );
}
