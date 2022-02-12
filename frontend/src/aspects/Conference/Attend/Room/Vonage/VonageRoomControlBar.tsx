import { CheckCircleIcon } from "@chakra-ui/icons";
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
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    Portal,
    Spinner,
    Tag,
    TagLabel,
    TagLeftIcon,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    VStack,
    WrapItem,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { Mutex } from "async-mutex";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { gql } from "urql";
import { useGetRoomChatIdQuery, useToggleVonageRecordingStateMutation } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import type { ChatState } from "../../../../Chat/ChatGlobalState";
import QuickSendEmote from "../../../../Chat/Compose/QuickSendEmote";
import { useGlobalChatState } from "../../../../Chat/GlobalChatStateProvider";
import { makeContext } from "../../../../GQL/make-context";
import useIsNarrowView from "../../../../Hooks/useIsNarrowView";
import { devicesToFriendlyName } from "../VideoChat/PermissionInstructions";
import LayoutChooser from "./Components/LayoutChooser";
import PlayVideoMenuButton from "./Components/PlayVideoMenu";
import SubtitlesPanel from "./Components/SubtitlesPanel";
import DeviceChooserModal from "./DeviceChooserModal";
import { VonageComputedStateContext } from "./State/VonageComputedStateContext";
import { StateType } from "./State/VonageGlobalState";
import { useVonageGlobalState } from "./State/VonageGlobalStateProvider";
import { useVonageLayout } from "./State/VonageLayoutProvider";
import { useVonageRoom, VonageRoomStateActionType } from "./State/VonageRoomProvider";

gql`
    mutation ToggleVonageRecordingState($vonageSessionId: String!, $recordingActive: Boolean!) {
        toggleVonageRecordingState(vonageSessionId: $vonageSessionId, recordingActive: $recordingActive) {
            allowed
            recordingState
        }
    }
`;

export function VonageRoomControlBar({
    onCancelJoinRoom,
    roomId,
    eventId,
}: {
    onCancelJoinRoom?: () => void;
    roomId?: string;
    eventId?: string;
}): JSX.Element {
    const { state, dispatch, settings } = useVonageRoom();
    const vonage = useVonageGlobalState();
    const { layoutChooser_isOpen, layoutChooser_onOpen, layoutChooser_onClose } = useVonageLayout();
    const { isRecordingActive, joining, joinRoom, leaveRoom, onTranscriptRef } = useContext(VonageComputedStateContext);

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
                    settings.onPermissionsProblem(
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
            settings,
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
                    settings.onPermissionsProblem(
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
        [settings, userMediaPermissionGranted.camera, userMediaPermissionGranted.microphone]
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

    const globalChatState = useGlobalChatState();
    const [chat, setChat] = useState<ChatState | null>(null);
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId]
    );
    const [roomChatIdResponse] = useGetRoomChatIdQuery({
        variables: {
            roomId,
        },
        pause: !roomId,
        context,
    });
    const chatId = roomChatIdResponse.data?.room_Room_by_pk?.chatId;
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (chatId) {
            unsubscribe = globalChatState.observeChatId(chatId, setChat);
        } else {
            setChat(null);
        }
        return () => {
            unsubscribe?.();
        };
    }, [chatId, globalChatState]);

    const controlBarBgColor = useColorModeValue(
        "RoomControlBar.backgroundColor-light",
        "RoomControlBar.backgroundColor-dark"
    );

    const [subtitlesVisible, setSubtitlesVisible] = useState<boolean>(false);
    return (
        <>
            {vonage.state.type === StateType.Connected && subtitlesVisible && (
                <SubtitlesPanel onTranscriptRef={onTranscriptRef} />
            )}
            <LayoutChooser />
            <Flex
                p={2}
                direction={buttonsDirection}
                justifyContent="flex-end"
                alignItems={vonage.state.type === StateType.Connected ? "center" : "stretch"}
                flexWrap="wrap"
                gridRowGap={2}
                gridColumnGap={2}
                w={vonage.state.type === StateType.Connected ? "100%" : "auto"}
                bgColor={controlBarBgColor}
            >
                <ControlBarButtonGroup
                    label="Devices"
                    icon="headset"
                    noCollapse={vonage.state.type !== StateType.Connected}
                >
                    <ControlBarButton
                        label="Configure mic/cam"
                        text="Settings"
                        isLoading={isOpening}
                        icon="cog"
                        onClick={() => onOpen(true, !joining || !settings.requireMicrophoneOrCamera)}
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{ active: "Mute", inactive: "Unmute" }}
                        text={{ active: "Mute", inactive: "Unmute" }}
                        icon={{ active: "microphone", inactive: "microphone-slash" }}
                        isActive={Boolean(state.microphoneStream) && state.microphoneIntendedEnabled}
                        onClick={{ active: stopMicrophone, inactive: startMicrophone }}
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{ active: "Stop camera", inactive: "Start camera" }}
                        text={{ active: "Stop camera", inactive: "Start camera" }}
                        icon={{ active: "video", inactive: "video-slash" }}
                        isActive={Boolean(state.cameraStream) && state.cameraIntendedEnabled}
                        onClick={{ active: stopCamera, inactive: startCamera }}
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{ active: "Stop sharing screen", inactive: "Start sharing screen" }}
                        icon="desktop"
                        isLimited={
                            vonage.state.type === StateType.Connected
                                ? receivingScreenShareCount >= settings.maximumSimultaneousScreenShares
                                    ? settings.maximumSimultaneousScreenShares === 1
                                        ? "Someone else is sharing their screen at the moment"
                                        : "No more screens can be shared at the moment"
                                    : state.screenShareIntendedEnabled
                                    ? false
                                    : vonage.state.initialisedState.screenSharingSupported
                                    ? false
                                    : "Your browser does not support sharing your screen."
                                : vonage.state.type === StateType.Initialised
                                ? vonage.state.screenSharingSupported
                                    ? "Screen sharing available after you join"
                                    : "Your browser does not support sharing your screen."
                                : false
                        }
                        isVisible={
                            Boolean(settings.maximumSimultaneousScreenShares) &&
                            (vonage.state.type === StateType.Initialised || vonage.state.type === StateType.Connected)
                        }
                        isActive={state.screenShareIntendedEnabled}
                        onClick={{ active: stopScreenShare, inactive: startScreenShare }}
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{ active: "Hide subtitles", inactive: "Show subtitles" }}
                        icon={{
                            active: { style: "s", icon: "closed-captioning" },
                            inactive: { style: "r", icon: "closed-captioning" },
                        }}
                        isVisible={vonage.state.type === StateType.Connected}
                        isActive={subtitlesVisible}
                        onClick={() => setSubtitlesVisible((old) => !old)}
                        isEnabled={!joining}
                    />
                </ControlBarButtonGroup>
                <WrapItem flex="1 1 auto" />
                <ControlBarButtonGroup label="Layout & recording" isVisible={vonage.state.type === StateType.Connected}>
                    <ControlBarButton
                        label={{ active: "Stop recording", inactive: "Start recording" }}
                        icon={{ active: "circle", inactive: { style: "r", icon: "dot-circle" } }}
                        isVisible={vonage.state.type === StateType.Connected && !settings.isBackstageRoom}
                        isLimited={
                            !settings.canControlRecording ? (isRecordingActive ? "Recording" : "Not recording") : false
                        }
                        isLoading={toggleVonageRecordingResponse.fetching}
                        isActive={isRecordingActive}
                        isDestructive
                        onClick={() => {
                            if (vonage.state.type === StateType.Connected) {
                                setRecentlyToggledRecording(true);
                                toggleVonageRecording({
                                    vonageSessionId: vonage.state.session.sessionId,
                                    recordingActive: !isRecordingActive,
                                });
                            }
                        }}
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{ active: "Cancel", inactive: "Layout" }}
                        icon="th-large"
                        isVisible={vonage.state.type === StateType.Connected}
                        isActive={layoutChooser_isOpen}
                        onClick={layoutChooser_isOpen ? layoutChooser_onClose : layoutChooser_onOpen}
                        isEnabled={!joining}
                    />
                </ControlBarButtonGroup>
                {vonage.state.type === StateType.Connected &&
                settings.canControlRecording &&
                !settings.isBackstageRoom ? (
                    <PlayVideoMenuButton roomId={roomId} eventId={eventId} />
                ) : undefined}
                {vonage.state.type === StateType.Connected && chat ? (
                    <Popover placement="top">
                        <PopoverTrigger>
                            <IconButton
                                size="sm"
                                colorScheme="RoomControlBarButton"
                                icon={<FAIcon iconStyle="s" icon="smile" />}
                                aria-label="Send an emote"
                            />
                        </PopoverTrigger>
                        <Portal>
                            <PopoverContent>
                                <PopoverArrow />
                                <PopoverBody p={0}>
                                    <QuickSendEmote chat={chat} />
                                </PopoverBody>
                            </PopoverContent>
                        </Portal>
                    </Popover>
                ) : undefined}
                <WrapItem flex="1 1 auto" />
                {vonage.state.type === StateType.Connected ? (
                    <Button size="sm" colorScheme="DestructiveActionButton" onClick={leaveRoom}>
                        Leave
                    </Button>
                ) : (
                    <Tooltip
                        label={
                            settings.requireMicrophoneOrCamera &&
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
                                onClick={joining ? onCancelJoinRoom : joinRoom}
                                isLoading={!onCancelJoinRoom && joining}
                                isDisabled={
                                    !joining &&
                                    settings.requireMicrophoneOrCamera &&
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
                                        {joining
                                            ? settings.joiningRoomButtonText ?? "Waiting to be admitted"
                                            : settings.joinRoomButtonText ?? "Join room"}
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
                                    leaveRoom();
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
        </>
    );
}

function ControlBarButtonGroup({
    label,
    icon,
    children,
    noCollapse = false,
    isVisible = true,
}: React.PropsWithChildren<{
    label: string;
    icon?: string | IconProps;
    isVisible?: boolean;
    noCollapse?: boolean;
}>): JSX.Element {
    const narrowView = useIsNarrowView();
    const { isOpen, onClose, onToggle } = useDisclosure();

    return !isVisible ? (
        <></>
    ) : narrowView && !noCollapse ? (
        <Popover isOpen={isOpen} onClose={onClose} placement="top">
            <PopoverTrigger>
                <ControlBarButton
                    label={label}
                    isActive={isOpen}
                    icon={icon ? icon : { active: "chevron-down", inactive: "chevron-up" }}
                    onClick={onToggle}
                />
            </PopoverTrigger>
            <PopoverContent onClick={onClose} w="calc(2.5rem + 6px)">
                <PopoverArrow />
                <PopoverBody>
                    <VStack>{children}</VStack>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    ) : (
        <>{children}</>
    );
}

interface IconProps {
    icon: string;
    style: "b" | "s" | "r";
}

interface ControlBarButtonProps {
    label:
        | string
        | {
              active: string;
              inactive: string;
          };
    text?:
        | string
        | {
              active: string;
              inactive: string;
          };
    icon: string | IconProps | { active: string | IconProps; inactive: string | IconProps };

    isVisible?: boolean;
    isLoading?: boolean;
    isActive?: boolean;
    isEnabled?: boolean;
    isLimited?: false | string;
    isDestructive?: boolean;

    onClick: (() => void) | { active: () => void; inactive: () => void };
}

const ControlBarButton = React.forwardRef<HTMLButtonElement, ControlBarButtonProps>(function ControlBarButton(
    {
        label,
        text,
        icon,
        isVisible = true,
        isLoading = false,
        isActive,
        isEnabled = true,
        isLimited = false,
        isDestructive = false,
        onClick,
    }: ControlBarButtonProps,
    ref
): JSX.Element {
    const iconProps = useMemo(
        () =>
            typeof icon === "string"
                ? ({ icon, style: "s" } as IconProps)
                : "active" in icon
                ? isActive
                    ? typeof icon.active === "string"
                        ? ({ icon: icon.active, style: "s" } as IconProps)
                        : icon.active
                    : typeof icon.inactive === "string"
                    ? ({ icon: icon.inactive, style: "s" } as IconProps)
                    : icon.inactive
                : icon,
        [icon, isActive]
    );
    const labelValue = typeof label === "string" ? label : isActive ? label.active : label.inactive;
    const textValue = text && (typeof text === "string" ? text : isActive ? text.active : text.inactive);
    const onClickValue = typeof onClick === "function" ? onClick : isActive ? onClick.active : onClick.inactive;
    const vonage = useVonageGlobalState();

    return isVisible ? (
        isLimited ? (
            <Tag
                size="sm"
                variant="outline"
                colorScheme="RoomControlBarNotice"
                px={2}
                py="4px"
                ml={1}
                mr="auto"
                maxW="190px"
                ref={ref}
            >
                <TagLeftIcon as={CheckCircleIcon} />
                <TagLabel whiteSpace="normal">{isLimited}</TagLabel>
            </Tag>
        ) : (
            <Tooltip label={labelValue}>
                <Button
                    size="sm"
                    isLoading={isLoading}
                    leftIcon={<FAIcon iconStyle={iconProps.style} icon={iconProps.icon} />}
                    iconSpacing={vonage.state.type === StateType.Connected ? 0 : undefined}
                    onClick={onClickValue}
                    isDisabled={!isEnabled}
                    colorScheme={
                        isActive === undefined
                            ? "RoomControlBarButton"
                            : isActive
                            ? isDestructive
                                ? "DestructiveActionButton"
                                : "ActiveRoomControlBarButton"
                            : "InactiveRoomControlBarButton"
                    }
                    aria-label={labelValue}
                    w={vonage.state.type === StateType.Connected ? "2.5em" : undefined}
                    ref={ref}
                >
                    {vonage.state.type === StateType.Connected ? "" : textValue}
                </Button>
            </Tooltip>
        )
    ) : (
        <></>
    );
});
