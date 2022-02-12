import { createStandaloneToast, useToast } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { theme } from "../../../../../Chakra/ChakraCustomProvider";
import { useNavigationState } from "../../../../../Menu/NavigationState";
import { useEvent } from "../../../../../Utils/useEvent";
import { useRecordingState } from "../Recording/useRecordingState";
import { useTranscript } from "../Transcript/useTranscript";
import type { TranscriptData, VonageGlobalState } from "./VonageGlobalState";
import { StateType } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";
import { useVonageLayout } from "./VonageLayoutProvider";
import { useVonageRoom, VonageRoomStateActionType } from "./VonageRoomProvider";

const standaloneToast = createStandaloneToast({ theme });

interface Props {
    getAccessToken: () => Promise<string>;
    vonageSessionId: string;
    overrideJoining?: boolean;
    onRoomJoined?: (_joined: boolean) => void;
    onRecordingIdReceived?: (recordingId: string) => void;
    beginJoin?: () => void;
    cancelJoin?: () => void;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
}

interface Outputs {
    vonage: VonageGlobalState;
    connected: boolean;
    streams: OT.Stream[];
    connections: OT.Connection[];
    screen: OT.Publisher | null;
    camera: OT.Publisher | null;
    joining: boolean;
    isRecordingActive: boolean;
    onTranscriptRef: React.MutableRefObject<((data: TranscriptData) => void) | undefined>;
    joinRoom: () => Promise<void>;
    leaveRoom: () => Promise<void>;
    cancelJoin?: () => void;
}

function useValue({
    getAccessToken,
    vonageSessionId,
    overrideJoining,
    onRoomJoined,
    onRecordingIdReceived,
    beginJoin,
    cancelJoin,
    completeJoinRef,
}: Props): Outputs {
    const navState = useNavigationState();

    const vonage = useVonageGlobalState();
    const { dispatch, settings } = useVonageRoom();
    const layout = useVonageLayout();

    const [connected, setConnected] = useState<boolean>(false);
    const [streams, setStreams] = useState<OT.Stream[]>([]);
    const [connections, setConnections] = useState<OT.Connection[]>([]);
    const [camera, setCamera] = useState<OT.Publisher | null>(null);
    const [screen, setScreen] = useState<OT.Publisher | null>(null);
    const toast = useToast();

    const onCameraStreamDestroyed = useCallback(
        (reason: string) => {
            if (reason === "mediaStopped" || reason === "forceUnpublished") {
                dispatch({
                    type: VonageRoomStateActionType.SetCameraIntendedState,
                    cameraEnabled: false,
                    explicitlyDisabled: true,
                    onError: undefined,
                });
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                    microphoneEnabled: false,
                    explicitlyDisabled: true,
                    onError: undefined,
                });
            }

            if (reason === "forceUnpublished") {
                standaloneToast({
                    title: "Muted",
                    description: "You have been muted by a moderator.",
                    status: "warning",
                    duration: 20000,
                    isClosable: true,
                    position: "top",
                });
            }
        },
        [dispatch]
    );
    const onScreenStreamDestroyed = useCallback(
        (reason: string) => {
            setScreen(vonage.screen);
            if (reason === "mediaStopped" || reason === "forceUnpublished") {
                dispatch({
                    type: VonageRoomStateActionType.SetScreenShareIntendedState,
                    screenEnabled: false,
                });
            }

            if (reason === "forceUnpublished") {
                standaloneToast({
                    title: "Screenshare stopped",
                    description: "Your screenshare has been stopped by a moderator.",
                    status: "warning",
                    duration: 20000,
                    isClosable: true,
                    position: "top",
                });
            }
        },
        [dispatch, vonage.screen]
    );

    const [_joining, setJoining] = useState<boolean>(false);
    const joining = !!overrideJoining || _joining;
    const joinRoom = useCallback(async () => {
        async function doJoinRoom() {
            setJoining(true);

            try {
                await vonage.connectToSession();
                onRoomJoined?.(true);
            } catch (e) {
                if (e !== "Declined to be recorded") {
                    console.error("Failed to join room", e);
                    toast({
                        status: "error",
                        description: "Cannot connect to room",
                    });
                }
            } finally {
                setJoining(false);
            }
        }

        if (beginJoin && cancelJoin && completeJoinRef) {
            completeJoinRef.current = doJoinRoom;
            beginJoin();
        } else {
            await doJoinRoom();
        }
    }, [beginJoin, cancelJoin, completeJoinRef, vonage, onRoomJoined, toast]);

    const leaveRoom = useCallback(async () => {
        if (connected) {
            try {
                await vonage.disconnect();
                onRoomJoined?.(false);
            } catch (e) {
                console.warn("Failed to leave room", e);
            }
        }
        setJoining(false);
    }, [connected, onRoomJoined, vonage]);

    useEffect(() => {
        vonage.setGetTokenFunction(getAccessToken);
    }, [getAccessToken, vonage]);

    const recordingState = useRecordingState(connected, vonageSessionId);
    const transcript = useTranscript();

    const onSessionConnected = useCallback(
        (isConnected: boolean) => {
            navState.setDisabled(isConnected);
            if (!isConnected) {
                setConnected(false);
                setStreams([]);
                setConnections([]);

                dispatch({
                    type: VonageRoomStateActionType.SetScreenShareIntendedState,
                    screenEnabled: false,
                });
            } else {
                setConnected(true);
            }
        },
        [dispatch, navState]
    );

    const onScreenStreamDestroyedInternal = useCallback(
        (reason) => {
            setScreen(vonage.state.type === StateType.Connected ? vonage.state.screen : null);
            onScreenStreamDestroyed(reason);
        },
        [onScreenStreamDestroyed, vonage.state]
    );

    const onCameraStreamCreated = useCallback(() => {
        setCamera(vonage.state.type === StateType.Connected ? vonage.state.camera?.publisher ?? null : null);
    }, [vonage.state]);

    const onScreenStreamCreated = useCallback(() => {
        setScreen(vonage.state.type === StateType.Connected ? vonage.state.screen : null);
    }, [vonage.state]);

    const onMuteForced = useCallback(() => {
        standaloneToast({
            title: "Muted",
            description: "You have been muted by a moderator.",
            status: "warning",
            duration: 20000,
            isClosable: true,
            position: "top",
        });
    }, []);

    const onRecordingIdReceivedInternal = useCallback(
        (recordingId) => {
            onRecordingIdReceived?.(recordingId);
        },
        [onRecordingIdReceived]
    );

    const onLayoutReceived = useCallback(
        (layoutData) => {
            layout?.updateLayout((old) => (!old || old.createdAt < layoutData.createdAt ? layoutData : old));
        },
        [layout]
    );

    useEvent(vonage, "streams-changed", setStreams);
    useEvent(vonage, "connections-changed", setConnections);
    useEvent(vonage, "session-connected", onSessionConnected);
    useEvent(vonage, "camera-stream-destroyed", onCameraStreamDestroyed);
    useEvent(vonage, "screen-stream-destroyed", onScreenStreamDestroyedInternal);
    useEvent(vonage, "camera-stream-created", onCameraStreamCreated);
    useEvent(vonage, "screen-stream-created", onScreenStreamCreated);
    useEvent(vonage, "mute-forced", onMuteForced);
    useEvent(vonage, "recording-started", recordingState.onRecordingStarted);
    useEvent(vonage, "recording-stopped", recordingState.onRecordingStopped);
    useEvent(vonage, "recording-id-received", onRecordingIdReceivedInternal);
    useEvent(vonage, "layout-signal-received", onLayoutReceived);
    useEvent(vonage, "transcript-data-received", transcript.onTranscript);

    const previousVonageSessionId = useRef<string>("");
    useEffect(() => {
        async function fn() {
            let wasAlreadyConnected = false;
            try {
                if (vonage.state.type === StateType.Connected) {
                    wasAlreadyConnected = true;
                    await vonage.disconnect();
                }
            } catch (e) {
                console.warn("Failed to disconnect from session", e);
            }

            try {
                await vonage.initialiseState({
                    getToken: getAccessToken,
                    sessionId: vonageSessionId,
                });
            } catch (e) {
                console.warn("Failed to initialise session", e);
            }
            // Auto-rejoin when hopping backstages
            if (settings.isBackstageRoom && wasAlreadyConnected && previousVonageSessionId.current && vonageSessionId) {
                joinRoom();
            }
            previousVonageSessionId.current = vonageSessionId;
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonageSessionId]);

    return useMemo(
        () => ({
            vonage,
            connected,
            streams,
            connections,
            screen,
            camera,
            joining,
            joinRoom,
            leaveRoom,
            cancelJoin,
            isRecordingActive: recordingState.isRecordingActive,
            onTranscriptRef: transcript.onTranscriptRef,
        }),
        [
            vonage,
            connected,
            streams,
            connections,
            screen,
            camera,
            joining,
            joinRoom,
            leaveRoom,
            cancelJoin,
            recordingState.isRecordingActive,
            transcript.onTranscriptRef,
        ]
    );
}

export const VonageComputedStateContext = createContext({} as ReturnType<typeof useValue>);

export function VonageComputedStateProvider(props: PropsWithChildren<Props>): JSX.Element {
    return (
        <VonageComputedStateContext.Provider value={useValue(props)}>
            {props.children}
        </VonageComputedStateContext.Provider>
    );
}
