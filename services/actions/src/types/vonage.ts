export type SessionMonitoringWebhookReqBody = ConnectionCreated | ConnectionDestroyed | StreamCreated | StreamDestroyed;

interface SessionMonitoringWebhookBase {
    sessionId: string;
    projectId: string;
    event: string;
    timestamp: number;
}

interface ConnectionCreated extends SessionMonitoringWebhookBase {
    event: "connectionCreated";
    connection: ConnectionData;
}

interface ConnectionDestroyed extends SessionMonitoringWebhookBase {
    event: "connectionDestroyed";
    reason: "clientDisconnected" | "forceDisconnected" | "networkDisconnected";
    connection: ConnectionData;
}

interface StreamCreated extends SessionMonitoringWebhookBase {
    event: "streamCreated";
    stream: StreamData;
}

interface StreamDestroyed extends SessionMonitoringWebhookBase {
    event: "streamDestroyed";
    reason: "clientDisconnected" | "forceDisconnected" | "forceUnpublished" | "mediaStopped" | "networkDisconnected";
    stream: StreamData;
}

interface ConnectionData {
    id: string;
    createdAt: number;
    data: string;
}

export interface StreamData {
    id: string;
    connection: ConnectionData;
    createdAt: number;
    name: string;
    videoType?: "camera" | "screen";
}

export interface CustomConnectionData {
    userId: string;
    registrantId: string;
}

export interface ArchiveMonitoringWebhookReqBody {
    createdAt: number;
    updatedAt: number;
    duration: number;
    id: string;
    name: string;
    partnerId: number;
    resolution: string;
    reason: string;
    sessionId: string;
    size: string | number;
    status: "available" | "expired" | "failed" | "paused" | "started" | "stopped" | "uploaded";
    url?: string | null;
    event: "archive";
}
