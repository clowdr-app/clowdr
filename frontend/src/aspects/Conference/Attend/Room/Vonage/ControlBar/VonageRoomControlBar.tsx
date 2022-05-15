import {
    Box,
    Button,
    chakra,
    Flex,
    HStack,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    Portal,
    Spinner,
    Tooltip,
    useColorModeValue,
    useToast,
    WrapItem,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { Mutex } from "async-mutex";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FullScreenHandle } from "react-full-screen";
import { gql } from "urql";
import { useGetRoomChatIdQuery, useToggleVonageRecordingStateMutation } from "../../../../../../generated/graphql";
import FAIcon from "../../../../../Chakra/FAIcon";
import type { ChatState } from "../../../../../Chat/ChatGlobalState";
import QuickSendEmote from "../../../../../Chat/Compose/QuickSendEmote";
import { useGlobalChatState } from "../../../../../Chat/GlobalChatStateProvider";
import { makeContext } from "../../../../../GQL/make-context";
import { devicesToFriendlyName } from "../../VideoChat/PermissionInstructions";
import LayoutChooser from "../Components/LayoutChooser";
import SubtitlesPanel from "../Components/SubtitlesPanel";
import DeviceChooserModal from "../DeviceChooserModal";
import { DisplayType } from "../State/useVonageDisplay";
import { VonageComputedStateContext } from "../State/VonageComputedStateContext";
import { StateType } from "../State/VonageGlobalState";
import { useVonageGlobalState } from "../State/VonageGlobalStateProvider";
import { useVonageLayout, VonageLayoutContext } from "../State/VonageLayoutProvider";
import { useVonageRoom, VonageRoomStateActionType } from "../State/VonageRoomProvider";
import { ControlBarButton } from "./ControlBarButton";
import { ControlBarButtonGroup } from "./ControlBarButtonGroup";
import PlayVideoMenuButton from "./PlayVideoMenu";

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
    fullScreenHandle,
}: {
    onCancelJoinRoom?: () => void;
    fullScreenHandle?: FullScreenHandle;
}): JSX.Element {
    const { state, dispatch, settings } = useVonageRoom();
    const vonage = useVonageGlobalState();
    const {
        layout: { layoutChooser_isOpen, layoutChooser_onOpen, layoutChooser_onClose },
        display,
    } = useVonageLayout();
    const { isRecordingActive, joining, joinRoom, leaveRoom, onTranscriptRef, setRecentlyToggledRecording } =
        useContext(VonageComputedStateContext);

    const [toggleVonageRecordingResponse, toggleVonageRecording] = useToggleVonageRecordingStateMutation();

    const [isOpening, setIsOpening] = useState<boolean>(false);
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
            madeSelection:
                | "made-selection"
                | "cancelled"
                | "no-devices-available"
                | "device-permissions-not-granted"
                | "unable-to-list",
            cameraId: string | null = null,
            microphoneId: string | null = null,
            overrideStartCameraOnClose = false,
            overrideStartMicrophoneOnClose = false
        ) => {
            switch (madeSelection) {
                case "made-selection":
                    if (cameraId !== state.preferredCameraId) {
                        if (cameraId) {
                            dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId });
                        } else {
                            dispatch({ type: VonageRoomStateActionType.ClearPreferredCamera });
                        }
                    }

                    if (microphoneId !== state.preferredMicrophoneId) {
                        if (microphoneId) {
                            dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId });
                        } else {
                            dispatch({ type: VonageRoomStateActionType.ClearPreferredMicrophone });
                        }
                    }

                    if ((overrideStartCameraOnClose || startCameraOnClose) && cameraId) {
                        dispatch({
                            type: VonageRoomStateActionType.SetCameraIntendedState,
                            cameraEnabled: true,
                            onError: undefined,
                        });
                    }

                    if ((overrideStartMicrophoneOnClose || startMicrophoneOnClose) && microphoneId) {
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
                        `Browser error: Unable to list ${devicesToFriendlyName(
                            {
                                camera: deviceModalState.showCamera,
                                microphone: deviceModalState.showMicrophone,
                            },
                            "or"
                        )} devices`
                    );
                    break;

                case "no-devices-available":
                    settings.onPermissionsProblem(
                        {
                            camera: deviceModalState.showCamera,
                            microphone: deviceModalState.showMicrophone,
                        },
                        `No ${devicesToFriendlyName(
                            {
                                camera: deviceModalState.showCamera,
                                microphone: deviceModalState.showMicrophone,
                            },
                            "or"
                        )} available`
                    );
                    break;

                case "device-permissions-not-granted":
                    settings.onPermissionsProblem(
                        {
                            camera: deviceModalState.showCamera,
                            microphone: deviceModalState.showMicrophone,
                        },
                        `Permission to access ${devicesToFriendlyName(
                            {
                                camera: deviceModalState.showCamera,
                                microphone: deviceModalState.showMicrophone,
                            },
                            "or"
                        )} denied`
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
        async (video: boolean, audio: boolean, autoSelectDevices: boolean) => {
            const release = await dialogOpenMutex.current.acquire();
            setIsOpening(true);
            (async () => {
                try {
                    const initialListOfDevices = await navigator.mediaDevices.enumerateDevices();
                    const initialListOfVideoDevices = initialListOfDevices.filter((d) => d.kind === "videoinput");
                    const initialListOfAudioDevices = initialListOfDevices.filter((d) => d.kind === "audioinput");
                    const canInitiallySeeVideoDevices = initialListOfVideoDevices.some((x) => x.label.length > 0);
                    const canInitiallySeeAudioDevices = initialListOfAudioDevices.some((x) => x.label.length > 0);

                    // Trigger permissions request
                    if (video && !canInitiallySeeVideoDevices) {
                        try {
                            await navigator.mediaDevices.getUserMedia({ video: true });
                        } catch (err: any) {
                            // if you try to get user media while mic/cam are active, you run into an error
                            const msg = err.toString();
                            if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
                                console.warn("No devices found by getUserMedia", { err, video });
                            } else if (msg.includes("NotAllowedError")) {
                                console.warn(
                                    "getUserMedia failed with NotAllowedError - permission has certainly been denied by the browser or operating system.",
                                    { err, video }
                                );
                            } else if (msg.includes("NotReadableError")) {
                                console.warn(
                                    "getUserMedia failed with NotReadableError - device is probably in use by another application.",
                                    { err, video }
                                );
                                // Don't re-throw this error if we're trying to open the settings dialog
                                if (autoSelectDevices) {
                                    throw err;
                                }
                            } else if (!msg.includes("Concurrent") || !msg.includes("limit")) {
                                throw err;
                            }
                        }
                    }

                    // Trigger permissions request
                    if (audio && !canInitiallySeeAudioDevices) {
                        try {
                            await navigator.mediaDevices.getUserMedia({ audio: true });
                        } catch (err: any) {
                            // if you try to get user media while mic/cam are active, you run into an error
                            const msg = err.toString();
                            if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
                                console.warn("No devices found by getUserMedia", { err, audio });
                            } else if (msg.includes("NotAllowedError")) {
                                console.warn(
                                    "getUserMedia failed with NotAllowedError - permission has certainly been denied by the browser or operating system.",
                                    { err, audio }
                                );
                            } else if (msg.includes("NotReadableError")) {
                                console.warn(
                                    "getUserMedia failed with NotReadableError - device is probably in use by another application.",
                                    { err, audio }
                                );
                                // Don't re-throw this error if we're trying to open the settings dialog
                                if (autoSelectDevices) {
                                    throw err;
                                }
                            } else if (!msg.includes("Concurrent") || !msg.includes("limit")) {
                                throw err;
                            }
                        }
                    }

                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const availableVideoDevices = devices.filter((d) => d.kind === "videoinput" && d.label.length > 0);
                    const availableAudioDevices = devices.filter((d) => d.kind === "audioinput" && d.label.length > 0);

                    let newPreferredCameraId = availableVideoDevices.some((x) => x.deviceId === state.preferredCameraId)
                        ? state.preferredCameraId
                        : null;
                    if (autoSelectDevices && video && availableVideoDevices.length > 0) {
                        newPreferredCameraId = availableVideoDevices[0].deviceId;
                    }

                    let newPreferredMicrophoneId = availableAudioDevices.some(
                        (x) => x.deviceId === state.preferredMicrophoneId
                    )
                        ? state.preferredMicrophoneId
                        : null;
                    if (autoSelectDevices && audio && availableAudioDevices.length > 0) {
                        newPreferredMicrophoneId = availableAudioDevices[0].deviceId;
                    }

                    const shouldOpenChooser =
                        !autoSelectDevices || (video && !newPreferredCameraId) || (audio && !newPreferredMicrophoneId);

                    if (shouldOpenChooser) {
                        setDeviceModalState({
                            isOpen: true,
                            showCamera: video,
                            showMicrophone: audio,
                        });
                    } else {
                        onClose("made-selection", newPreferredCameraId, newPreferredMicrophoneId, video, audio);
                    }
                } catch (err: any) {
                    if (video) {
                        dispatch({
                            type: VonageRoomStateActionType.ClearPreferredCamera,
                        });
                    }
                    if (audio) {
                        dispatch({
                            type: VonageRoomStateActionType.ClearPreferredMicrophone,
                        });
                    }

                    console.log("Could not access camera or microphone", { err });

                    if (err.toString().includes("NotReadableError")) {
                        settings.onPermissionsProblem(
                            { camera: video, microphone: audio },
                            `Browser error: ${devicesToFriendlyName(
                                { camera: video, microphone: audio },
                                "or"
                            )} unavailable (it is probably in use by another program)`
                        );
                    } else {
                        settings.onPermissionsProblem(
                            { camera: video, microphone: audio },
                            `Browser error: Unable to access ${devicesToFriendlyName(
                                { camera: video, microphone: audio },
                                "and"
                            )}`
                        );
                    }
                } finally {
                    setIsOpening(false);
                    release();
                }
            })();
        },
        [dispatch, onClose, settings, state.preferredCameraId, state.preferredMicrophoneId]
    );

    const startCamera = useCallback(() => {
        if (!state.preferredCameraId) {
            setStartCameraOnClose(true);
            onOpen(true, false, true);
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
                    setStartCameraOnClose(true);
                    onOpen(true, false, false);
                },
            });
        }
    }, [dispatch, onOpen, state.cameraIntendedEnabled, state.preferredCameraId]);

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
            onOpen(false, true, true);
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

                    setStartMicrophoneOnClose(true);
                    onOpen(false, true, false);
                },
            });
        }
    }, [dispatch, onOpen, state.microphoneIntendedEnabled, state.preferredMicrophoneId]);

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
                [AuthHeader.RoomId]: settings.roomId,
            }),
        [settings.roomId]
    );
    const [roomChatIdResponse] = useGetRoomChatIdQuery({
        variables: {
            roomId: settings.roomId,
        },
        pause: !settings.roomId,
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

    const [subtitlesVisible, _setSubtitlesVisible] = useState<boolean>(false);

    const layout = useContext(VonageLayoutContext);
    const toast = useToast();

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
                mt={0}
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
                        onClick={() => onOpen(true, !joining || !settings.requireMicrophoneOrCamera, false)}
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
                                        ? "Someone else is sharing their screen"
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
                    {/* <ControlBarButton
                        label={{ active: "Hide subtitles", inactive: "Show subtitles" }}
                        icon={{
                            active: { style: "s", icon: "closed-captioning" },
                            inactive: { style: "r", icon: "closed-captioning" },
                        }}
                        isVisible={vonage.state.type === StateType.Connected}
                        isActive={subtitlesVisible}
                        onClick={() => setSubtitlesVisible((old) => !old)}
                        isEnabled={!joining}
                    /> */}
                </ControlBarButtonGroup>
                <WrapItem flex="1 1 auto" />
                <ControlBarButtonGroup
                    label="Layout &amp; recording"
                    isVisible={vonage.state.type === StateType.Connected}
                >
                    <ControlBarButton
                        label={{ active: "Stop recording", inactive: "Start recording" }}
                        icon={{ active: "circle", inactive: { style: "r", icon: "dot-circle" } }}
                        isVisible={vonage.state.type === StateType.Connected && !settings.isBackstageRoom}
                        isLimited={
                            !settings.canControlRecordingAs.length
                                ? isRecordingActive
                                    ? "Recording"
                                    : "Not recording"
                                : false
                        }
                        isLoading={toggleVonageRecordingResponse.fetching}
                        isActive={isRecordingActive}
                        isDestructive
                        onClick={async () => {
                            if (vonage.state.type === StateType.Connected) {
                                setRecentlyToggledRecording(true);
                                const result = await toggleVonageRecording({
                                    vonageSessionId: vonage.state.session.sessionId,
                                    recordingActive: !isRecordingActive,
                                });
                                if (result.error) {
                                    toast({
                                        status: "error",
                                        title: `Failed to ${isRecordingActive ? "stop" : "start"} room recording`,
                                    });
                                }
                            }
                        }}
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{
                            active: "Browse all participants",
                            inactive: isRecordingActive ? "Show preview of the recording" : "Show presenter layout",
                        }}
                        icon={{
                            active: { style: "s", icon: "chalkboard-teacher" },
                            inactive: { style: "s", icon: "chalkboard-teacher" },
                        }}
                        isVisible={
                            settings.isBackstageRoom ||
                            isRecordingActive ||
                            (Boolean(settings.eventId) && !settings.eventIsFuture)
                        }
                        isActive={layout?.display?.actualDisplay?.type === DisplayType.BroadcastLayout}
                        isLimited={settings.isBackstageRoom ? "Showing broadcast preview" : false}
                        onClick={() =>
                            layout?.display?.setChosenDisplay(
                                layout?.display?.chosenDisplay?.type === DisplayType.Browse
                                    ? { type: DisplayType.Auto }
                                    : { type: DisplayType.Browse }
                            )
                        }
                        isEnabled={!joining}
                    />
                    <ControlBarButton
                        label={{
                            active: "Cancel",
                            inactive: settings.isBackstageRoom
                                ? "Change broadcast layout"
                                : isRecordingActive
                                ? "Change recording layout"
                                : "Change event layout",
                        }}
                        icon="th-large"
                        isVisible={
                            vonage.state.type === StateType.Connected &&
                            Boolean(settings.canControlRecordingAs.length) &&
                            display.actualDisplay.type === DisplayType.BroadcastLayout
                        }
                        isActive={layoutChooser_isOpen}
                        onClick={layoutChooser_isOpen ? layoutChooser_onClose : layoutChooser_onOpen}
                        isEnabled={!joining}
                    />
                </ControlBarButtonGroup>
                {vonage.state.type === StateType.Connected &&
                settings.canControlRecordingAs.length &&
                settings.isBackstageRoom
                    ? settings.extraLayoutButtons
                    : undefined}
                {vonage.state.type === StateType.Connected &&
                settings.canControlRecordingAs.length &&
                !settings.isBackstageRoom ? (
                    <PlayVideoMenuButton roomId={settings.roomId} eventId={settings.eventId} />
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
                <ControlBarButton
                    label={{
                        active: "Exit fullscreen",
                        inactive: "Enter fullscreen",
                    }}
                    icon={{
                        active: "compress-alt",
                        inactive: "expand-alt",
                    }}
                    isVisible={Boolean(fullScreenHandle)}
                    isActive={fullScreenHandle?.active}
                    onClick={{
                        active:
                            fullScreenHandle?.exit ??
                            (() => {
                                //
                            }),
                        inactive:
                            fullScreenHandle?.enter ??
                            (() => {
                                //
                            }),
                    }}
                    isEnabled={!joining}
                />
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
            />
        </>
    );
}
