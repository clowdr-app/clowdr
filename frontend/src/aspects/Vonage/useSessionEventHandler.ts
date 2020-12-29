import type * as OpenTok from "@opentok/client";
import { useEffect } from "react";

const events = [
    "archiveStarted",
    "archiveStopped",
    "connectionCreated",
    "connectionDestroyed",
    "sessionConnected",
    "sessionDisconnected",
    "sessionReconnected",
    "sessionReconnecting",
    "signal",
    "streamCreated",
    "streamDestroyed",
    "streamPropertyChanged",
];

export enum SessionEvent {
    ARCHIVE_STARTED = "archiveStarted",
    ARCHIVE_STOPPED = "archiveStopped",
    CONNECTION_CREATED = "connectionCreated",
    CONNECTION_DESTROYED = "connectionDestroyed",
    SESSION_CONNECTED = "sessionConnected",
    SESSION_DISCONNECTED = "sessionDisconnected",
    SESSION_RECONNECTED = "sessionReconnected",
    SESSION_RECONNECTING = "sessionReconnecting",
    SIGNAL = "signal",
    STREAM_CREATED = "streamCreated",
    STREAM_DESTROYED = "streamDestroyed",
    STREAM_PROPERTY_CHANGED = "streamPropertyChanged",
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function useSubscribe(type: SessionEvent, callback: any, session: OpenTok.Session | undefined): any {
    const isEventTypeSupported = events.some((e) => type.startsWith(e));
    if (!isEventTypeSupported) {
        throw new Error("[ReactUseOpenTok] useSessionEventHandler: The event type is NOT supported");
    }
    if (typeof callback !== "function") {
        throw new Error("[ReactUseOpenTok] useSessionEventHandler: Incorrect value or type of callback");
    }

    useEffect(() => {
        if (!session) {
            return;
        }
        const { sessionId } = session || {};
        if (typeof sessionId !== "string") {
            return;
        }

        session.on(type, callback);
        return () => {
            session.off(type, callback);
        };
    }, [session, type, callback]);
}
