import { useCallback, useEffect, useRef, useState } from "react";
import usePolling from "../../Generic/usePolling";
import { useRealtimeService } from "../RealtimeServiceProvider";

export default function useTrackView(
    isActive: boolean,
    identifier: string,
    contentType: string,
    requiredViewTimeMs = 15 * 1000
): void {
    const [activatedAt, setActivatedAt] = useState<number | null>(null);
    const submitted = useRef<boolean>(false);

    useEffect(() => {
        if (activatedAt === null && isActive) {
            setActivatedAt(Date.now());
        } else if (activatedAt !== null && !isActive) {
            setActivatedAt(null);
        }
    }, [activatedAt, isActive]);

    const rts = useRealtimeService();
    const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
    const [now, setNow] = useState<number>(-1);

    const pollF = useCallback(() => {
        setNow(Date.now());
    }, []);
    const polling = usePolling(pollF, requiredViewTimeMs, false);

    useEffect(() => {
        if (activatedAt !== null) {
            if (now - activatedAt > requiredViewTimeMs && socket && socket.connected) {
                polling.stop();

                if (!submitted.current) {
                    socket.emit("analytics.view.count", {
                        identifier,
                        contentType,
                    });
                    submitted.current = true;
                }
            } else if (!polling.isPolling) {
                polling.start();
            }
        } else if (polling.isPolling) {
            polling.stop();
        }
    }, [activatedAt, contentType, identifier, now, polling, requiredViewTimeMs, socket]);

    useEffect(() => {
        const offSocketAvailable = rts.onSocketAvailable((socket) => {
            setSocket(socket);
        });

        const offSocketUnavailable = rts.onSocketUnavailable((socket) => {
            setSocket((s) => (s === socket ? null : s));
        });

        return () => {
            offSocketAvailable();
            offSocketUnavailable();
        };
    }, [rts]);
}
