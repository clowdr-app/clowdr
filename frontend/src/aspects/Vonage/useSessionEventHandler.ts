import type * as OT from "@opentok/client";
import { useEffect } from "react";

export type EventMap = {
    archiveStarted: OT.Event<"archiveStarted", OT.Session> & {
        id: string;
        name: string;
    };

    archiveStopped: OT.Event<"archiveStopped", OT.Session> & {
        id: string;
        name: string;
    };

    connectionCreated: OT.Event<"connectionCreated", OT.Session> & {
        connection: OT.Connection;
    };

    connectionDestroyed: OT.Event<"connectionDestroyed", OT.Session> & {
        connection: OT.Connection;
        reason: string;
    };

    sessionConnected: OT.Event<"sessionConnected", OT.Session>;

    sessionDisconnected: OT.Event<"sessionDisconnected", OT.Session> & {
        reason: string;
    };

    sessionReconnected: OT.Event<"sessionReconnected", OT.Session>;
    sessionReconnecting: OT.Event<"sessionReconnecting", OT.Session>;

    signal: OT.Event<"signal", OT.Session> & {
        type?: string;
        data?: string;
        from: OT.Connection;
    };

    streamCreated: OT.Event<"streamCreated", OT.Session> & {
        stream: OT.Stream;
    };

    streamDestroyed: OT.Event<"streamDestroyed", OT.Session> & {
        stream: OT.Stream;
        reason: string;
    };

    streamPropertyChanged: OT.Event<"streamPropertyChanged", OT.Session> & {
        stream: OT.Stream;
    } & (
            | { changedProperty: "hasAudio"; oldValue: boolean; newValue: boolean }
            | { changedProperty: "hasVideo"; oldValue: boolean; newValue: boolean }
            | { changedProperty: "videoDimensions"; oldValue: OT.Dimensions; newValue: OT.Dimensions }
        );
};

export default function useSubscribe<EventName extends keyof EventMap>(
    type: EventName,
    callback: (event: EventMap[EventName]) => void,
    session: OT.Session | undefined
): void {
    useEffect(() => {
        console.log("Resubscribing");
        if (!session) {
            return;
        }
        const { sessionId } = session || {};
        if (typeof sessionId !== "string") {
            return;
        }

        session.on(type, callback as any);
        return () => {
            session.off(type, callback as any);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callback, session, type]);
}
