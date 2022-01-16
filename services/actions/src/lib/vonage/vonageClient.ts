import OpenTok from "opentok";
import { promisify } from "util";
import { awsClient } from "../aws/awsClient";

export async function createVonageClient() {
    const apiKey = await awsClient.getSecret("/VonageProject/ProjectAPICredentials", "ProjectAPIKey");
    const apiSecret = await awsClient.getSecret("/VonageProject/ProjectAPICredentials", "ProjectAPISecret");

    const vonage = new OpenTok(apiKey, apiSecret);

    return {
        vonage,
        createSession: promisify(vonage.createSession.bind(vonage)),
        listStreams: promisify(vonage.listStreams.bind(vonage)),

        startBroadcast: promisify(vonage.startBroadcast.bind(vonage)),
        stopBroadcast: promisify(vonage.stopBroadcast.bind(vonage)),
        listBroadcasts: promisify(vonage.listBroadcasts.bind(vonage)),

        startArchive: promisify(vonage.startArchive.bind(vonage)),
        stopArchive: promisify(vonage.stopArchive.bind(vonage)),
        listArchives: promisify(vonage.listArchives.bind(vonage)),
        getArchive: promisify(vonage.getArchive.bind(vonage)),

        setBroadcastLayout: promisify(vonage.setBroadcastLayout.bind(vonage)),
        setArchiveLayout: promisify(vonage.setArchiveLayout.bind(vonage)),
        setStreamClassLists: promisify(vonage.setStreamClassLists.bind(vonage)),

        forceDisconnect: promisify(vonage.forceDisconnect.bind(vonage)),
        signal: promisify(vonage.signal.bind(vonage)),
    };
}
