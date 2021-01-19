import { useEffect, useState } from "react";
import { StateType, VonageGlobalState } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";

export function useVonageComputedState(
    getAccessToken: () => Promise<string>,
    vonageSessionId: string,
    onCameraStreamDestroyed: (reason: string) => void,
    onScreenStreamDestroyed: (reason: string) => void
): { vonage: VonageGlobalState; connected: boolean; streams: OT.Stream[]; connections: OT.Connection[] } {
    const vonage = useVonageGlobalState();

    const [connected, setConnected] = useState<boolean>(false);
    const [streams, setStreams] = useState<OT.Stream[]>([]);
    const [connections, setConnections] = useState<OT.Connection[]>([]);

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
                        } else {
                            setConnected(true);
                        }
                    },
                    onCameraStreamDestroyed,
                    onScreenStreamDestroyed
                );
            } catch (e) {
                console.warn("Failed to initialise session", e);
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonageSessionId]);

    return { vonage, connected, streams, connections };
}
