import assert from "assert";
import OpenTok from "opentok";
import { promisify } from "util";

assert(process.env.OPENTOK_API_KEY, "OPENTOK_API_KEY environment variable must be specified");
assert(process.env.OPENTOK_API_SECRET, "OPENTOK_API_SECRET environment variable must be specified");

const vonage = new OpenTok(process.env.OPENTOK_API_KEY, process.env.OPENTOK_API_SECRET);
const createSession = promisify(vonage.createSession.bind(vonage));
const startBroadcast = promisify(vonage.startBroadcast.bind(vonage));
const stopBroadcast = promisify(vonage.stopBroadcast.bind(vonage));
const listBroadcasts = promisify(vonage.listBroadcasts.bind(vonage));

type WebhookReqBody = ConnectionCreated | ConnectionDestroyed | StreamCreated | StreamDestroyed;

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

export { vonage, createSession, startBroadcast, listBroadcasts, stopBroadcast, WebhookReqBody };
