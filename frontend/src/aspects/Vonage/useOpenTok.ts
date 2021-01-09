import type OT from "@opentok/client";
import React from "react";
import type { OpenTokState } from "./useOpenTokReducer";

export interface SessionOptions {
    connectionEventsSuppressed?: boolean;
    iceConfig?: {
        includeServers: "all" | "custom";
        transportPolicy: "all" | "relay";
        customServers: {
            urls: string | string[];
            username?: string;
            credential?: string;
        }[];
    };
    ipWhitelist?: boolean;
}

export interface OpenTokActions {
    initSessionAndConnect({
        apiKey,
        sessionId,
        token,
        sessionOptions,
    }: {
        apiKey: string;
        sessionId: string;
        token: string;
        sessionOptions: SessionOptions;
    }): Promise<void>;
    initSession({
        apiKey,
        sessionId,
        sessionOptions,
    }: {
        apiKey: string;
        sessionId: string;
        sessionOptions: SessionOptions;
    }): Promise<OT.Session>;
    connectSession(token: string, sessionToConnect: OT.Session): Promise<string>;
    disconnectSession(): void;
    initPublisher({
        name,
        element,
        options,
    }: {
        name: string;
        element?: string | HTMLElement;
        options: Partial<OT.PublisherProperties>;
    }): Promise<OT.Publisher>;
    removePublisher({ name }: { name: string }): void;
    publishPublisher({ name }: { name: string }): Promise<OT.Stream>;
    publish({
        name,
        element,
        options,
    }: {
        name: string;
        element?: string | HTMLElement;
        options: Partial<OT.PublisherProperties>;
    }): Promise<OT.Stream>;
    republish({
        name,
        element,
        options,
    }: {
        name: string;
        element?: string | HTMLElement;
        options: Partial<OT.PublisherProperties>;
    }): Promise<OT.Stream>;
    unpublish({ name }: { name: string }): void;
    subscribe({
        stream,
        element,
        options,
    }: {
        stream: OT.Stream;
        element?: string | HTMLElement;
        options: Partial<OT.SubscriberProperties>;
    }): OT.Subscriber;
    unsubscribe({ stream }: { stream: OT.Stream }): void;
    sendSignal({
        type,
        data,
        to,
        completionHandler,
    }: {
        type?: string;
        data?: string;
        to: OT.Connection;
        completionHandler(): void;
    }): void;
}

export const OpenTokContext = React.createContext<[state: OpenTokState, actions: OpenTokActions]>(
    (undefined as unknown) as [state: OpenTokState, actions: OpenTokActions]
);

export function useOpenTok(): [state: OpenTokState, actions: OpenTokActions] {
    return React.useContext(OpenTokContext);
}
