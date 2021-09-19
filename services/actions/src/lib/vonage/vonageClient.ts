import assert from "assert";
import OpenTok from "opentok";
import { promisify } from "util";

assert(process.env.OPENTOK_API_KEY, "OPENTOK_API_KEY environment variable must be specified");
assert(process.env.OPENTOK_API_SECRET, "OPENTOK_API_SECRET environment variable must be specified");

const vonage = new OpenTok(process.env.OPENTOK_API_KEY, process.env.OPENTOK_API_SECRET);

export default {
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
