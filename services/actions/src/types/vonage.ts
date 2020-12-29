export type WebhookReqBody = ConnectionCreated | ConnectionDestroyed | StreamCreated | StreamDestroyed;

interface WebhookBase {
    sessionId: string;
    projectId: string;
    event: string;
    timestamp: number;
}

interface ConnectionCreated extends WebhookBase {
    event: "connectionCreated";
    connection: ConnectionData;
}

interface ConnectionDestroyed extends WebhookBase {
    event: "connectionDestroyed";
    reason: "clientDisconnected" | "forceDisconnected" | "networkDisconnected";
    connection: ConnectionData;
}

interface StreamCreated extends WebhookBase {
    event: "streamCreated";
    stream: StreamData;
}

interface StreamDestroyed extends WebhookBase {
    event: "streamDestroyed";
    reason: "clientDisconnected" | "forceDisconnected" | "forceUnpublished" | "mediaStopped" | "networkDisconnected";
    stream: StreamData;
}

interface ConnectionData {
    id: string;
    createdAt: number;
    data: string;
}

interface StreamData {
    id: string;
    connection: ConnectionData;
    createdAt: number;
    name: string;
    videoType?: "camera" | "screen";
}
