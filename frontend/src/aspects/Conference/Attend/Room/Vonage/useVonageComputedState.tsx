import { createStandaloneToast, useToast } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { theme } from "../../../../Chakra/ChakraCustomProvider";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import { StateType, VonageGlobalState } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";
import { useVonageLayout } from "./VonageLayoutProvider";

const standaloneToast = createStandaloneToast({ theme });

export function useVonageComputedState({
    getAccessToken,
    vonageSessionId,
    overrideJoining,
    onRoomJoined,
    onRecordingStarted,
    onRecordingStopped,
    onRecordingIdReceived,
    beginJoin,
    cancelJoin,
    completeJoinRef,
    isBackstageRoom,
}: {
    getAccessToken: () => Promise<string>;
    vonageSessionId: string;
    overrideJoining?: boolean;
    onRoomJoined?: (_joined: boolean) => void;
    onRecordingStarted?: () => void;
    onRecordingStopped?: () => void;
    onRecordingIdReceived?: (recordingId: string) => void;
    beginJoin?: () => void;
    cancelJoin?: () => void;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    isBackstageRoom: boolean;
}): {
    vonage: VonageGlobalState;
    connected: boolean;
    streams: OT.Stream[];
    connections: OT.Connection[];
    screen: OT.Publisher | null;
    camera: OT.Publisher | null;
    joining: boolean;
    joinRoom: () => Promise<void>;
    leaveRoom: () => Promise<void>;
} {
    const vonage = useVonageGlobalState();
    const { dispatch } = useVonageRoom();
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
            console.log("Joining room");
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
                await vonage.initialiseState(
                    getAccessToken,
                    vonageSessionId,
                    (streams) => {
                        setStreams(streams);
                    },
                    (connections) => {
                        setConnections(connections);
                    },
                    (isConnected: boolean) => {
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
                    (reason) => {
                        onCameraStreamDestroyed(reason);
                    },
                    (reason) => {
                        setScreen(vonage.state.type === StateType.Connected ? vonage.state.screen : null);
                        onScreenStreamDestroyed(reason);
                    },
                    () => {
                        setCamera(
                            vonage.state.type === StateType.Connected ? vonage.state.camera?.publisher ?? null : null
                        );
                    },
                    () => {
                        setScreen(vonage.state.type === StateType.Connected ? vonage.state.screen : null);
                    },
                    () => {
                        standaloneToast({
                            title: "Muted",
                            description: "You have been muted by a moderator.",
                            status: "warning",
                            duration: 20000,
                            isClosable: true,
                            position: "top",
                        });
                    },
                    () => {
                        onRecordingStarted?.();
                    },
                    () => {
                        onRecordingStopped?.();
                    },
                    (recordingId) => {
                        onRecordingIdReceived?.(recordingId);
                    },
                    (layoutData) => {
                        if (layout.layout.createdAt < layoutData.createdAt) {
                            layout?.updateLayout(layoutData);
                        }
                    }
                );
            } catch (e) {
                console.warn("Failed to initialise session", e);
            }
            // Auto-rejoin when hopping backstages
            if (isBackstageRoom && wasAlreadyConnected && previousVonageSessionId.current && vonageSessionId) {
                joinRoom();
            }
            previousVonageSessionId.current = vonageSessionId;
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonageSessionId]);

    return useMemo(
        () => ({ vonage, connected, streams, connections, screen, camera, joining, joinRoom, leaveRoom }),
        [camera, connected, connections, screen, streams, vonage, joining, joinRoom, leaveRoom]
    );
}
