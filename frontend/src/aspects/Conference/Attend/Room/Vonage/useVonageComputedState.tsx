import { useCallback, useEffect, useMemo, useState } from "react";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import { StateType, VonageGlobalState } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";

export function useVonageComputedState(
    getAccessToken: () => Promise<string>,
    vonageSessionId: string
): {
    vonage: VonageGlobalState;
    connected: boolean;
    streams: OT.Stream[];
    connections: OT.Connection[];
    screen: OT.Publisher | null;
    camera: OT.Publisher | null;
} {
    const vonage = useVonageGlobalState();
    const { dispatch } = useVonageRoom();

    const [connected, setConnected] = useState<boolean>(false);
    const [streams, setStreams] = useState<OT.Stream[]>([]);
    const [connections, setConnections] = useState<OT.Connection[]>([]);
    const [camera, setCamera] = useState<OT.Publisher | null>(null);
    const [screen, setScreen] = useState<OT.Publisher | null>(null);

    const onCameraStreamDestroyed = useCallback(
        (reason: string) => {
            if (reason === "mediaStopped") {
                dispatch({
                    type: VonageRoomStateActionType.SetCameraIntendedState,
                    cameraEnabled: false,
                    onError: undefined,
                });
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                    microphoneEnabled: false,
                    onError: undefined,
                });
            }
        },
        [dispatch]
    );
    const onScreenStreamDestroyed = useCallback(
        (reason: string) => {
            setScreen(vonage.screen);
            if (reason === "mediaStopped") {
                dispatch({
                    type: VonageRoomStateActionType.SetScreenShareIntendedState,
                    screenEnabled: false,
                });
            }
        },
        [dispatch, vonage.screen]
    );

    useEffect(() => {
        async function fn() {
            try {
                if (vonage.state.type === StateType.Connected) {
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
                    }
                );
            } catch (e) {
                console.warn("Failed to initialise session", e);
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonageSessionId]);

    return useMemo(
        () => ({ vonage, connected, streams, connections, screen, camera }),
        [camera, connected, connections, screen, streams, vonage]
    );
}
