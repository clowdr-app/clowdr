import assert from "assert";
import OpenTok from "opentok";
import { promisify } from "util";

assert(process.env.OPENTOK_API_KEY, "OPENTOK_API_KEY environment variable must be specified");
assert(process.env.OPENTOK_API_SECRET, "OPENTOK_API_SECRET environment variable must be specified");

const vonage = new OpenTok(process.env.OPENTOK_API_KEY, process.env.OPENTOK_API_SECRET);

export default {
    vonage,
    createSession: promisify(vonage.createSession.bind(vonage)),
    startBroadcast: promisify(vonage.startBroadcast.bind(vonage)),
    stopBroadcast: promisify(vonage.stopBroadcast.bind(vonage)),
    listBroadcasts: promisify(vonage.listBroadcasts.bind(vonage)),
    forceDisconnect: promisify(vonage.forceDisconnect.bind(vonage)),
    setBroadcastLayout: promisify(vonage.setBroadcastLayout.bind(vonage)),
    setStreamClassLists: promisify(vonage.setStreamClassLists.bind(vonage)),
    listStreams: promisify(vonage.listStreams.bind(vonage)),
};
