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
const forceDisconnect = promisify(vonage.forceDisconnect.bind(vonage));

export { vonage, createSession, startBroadcast, listBroadcasts, stopBroadcast, forceDisconnect };
