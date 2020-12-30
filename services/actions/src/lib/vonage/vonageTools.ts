import { gql } from "@apollo/client/core";
import { shortId } from "../../aws/awsClient";
import { GetEventBroadcastDetailsDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import * as Vonage from "./vonageClient";
import { stopBroadcast } from "./vonageClient";

gql`
    query GetEventBroadcastDetails($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            id
            startTime
            durationSeconds
            endTime
            intendedRoomModeName
            room {
                id
                mediaLiveChannel {
                    rtmpInputUri
                    id
                }
            }
            eventVonageSession {
                sessionId
                id
            }
        }
    }
`;

interface EventBroadcastDetails {
    rtmpServerUrl: string;
    rtmpStreamName: string;
    vonageSessionId: string;
}

export async function getEventBroadcastDetails(eventId: string): Promise<EventBroadcastDetails> {
    const eventResult = await apolloClient.query({
        query: GetEventBroadcastDetailsDocument,
        variables: {
            eventId,
        },
    });

    if (!eventResult.data.Event_by_pk) {
        throw new Error("Could not find event");
    }

    if (!eventResult.data.Event_by_pk.room.mediaLiveChannel?.rtmpInputUri) {
        throw new Error("No RTMP Push URI available for event room.");
    }

    const rtmpUri = eventResult.data.Event_by_pk.room.mediaLiveChannel.rtmpInputUri;
    const rtmpUriParts = rtmpUri.split("/");
    if (rtmpUriParts.length < 2) {
        throw new Error("RTMP Push URI has unexpected format");
    }
    const streamName = rtmpUriParts[rtmpUriParts.length - 1];
    const serverUrl = rtmpUri.substring(0, rtmpUri.length - streamName.length);

    if (!eventResult.data.Event_by_pk.eventVonageSession?.sessionId) {
        throw new Error("Could not find Vonage session ID for event");
    }

    return {
        rtmpServerUrl: serverUrl,
        rtmpStreamName: streamName,
        vonageSessionId: eventResult.data.Event_by_pk.eventVonageSession.sessionId,
    };
}

export async function startEventBroadcast(eventId: string): Promise<void> {
    let broadcastDetails: EventBroadcastDetails;
    try {
        broadcastDetails = await getEventBroadcastDetails(eventId);
    } catch (e) {
        console.error("Error retrieving Vonage broadcast details for event", e);
        return;
    }

    const existingSessionBroadcasts = await Vonage.listBroadcasts({
        sessionId: broadcastDetails.vonageSessionId,
    });

    if (!existingSessionBroadcasts) {
        console.error("Could not retrieve existing session broadcasts.", broadcastDetails.vonageSessionId);
        return;
    }

    const startedSessionBroadcasts = existingSessionBroadcasts?.filter((broadcast) => broadcast.status === "started");

    console.log(
        `Vonage session has ${startedSessionBroadcasts.length} existing live broadcasts`,
        broadcastDetails.vonageSessionId,
        startedSessionBroadcasts
    );

    if (startedSessionBroadcasts.length > 1) {
        console.warn(
            "Found more than one live broadcast for session - which is not allowed. Stopping them.",
            broadcastDetails.vonageSessionId
        );
        for (const broadcast of startedSessionBroadcasts) {
            try {
                await Vonage.stopBroadcast(broadcast.id);
            } catch (e) {
                console.error(
                    "Error while stopping invalid broadcast",
                    broadcastDetails.vonageSessionId,
                    broadcast.status,
                    e
                );
            }
        }
    }

    const existingBroadcast = startedSessionBroadcasts.find((broadcast) =>
        broadcast.broadcastUrls.rtmp?.find(
            (destination) =>
                destination.serverUrl === broadcastDetails.rtmpServerUrl &&
                destination.streamName === broadcastDetails.rtmpStreamName
        )
    );

    if (!existingBroadcast) {
        const rtmpId = shortId();
        console.log(
            "Starting a broadcast from session to event room",
            broadcastDetails.vonageSessionId,
            eventId,
            rtmpId
        );
        await Vonage.startBroadcast(broadcastDetails.vonageSessionId, {
            layout: { type: "bestFit" },
            outputs: {
                rtmp: [
                    {
                        id: rtmpId,
                        serverUrl: broadcastDetails.rtmpServerUrl,
                        streamName: broadcastDetails.rtmpStreamName,
                    },
                ],
            },
            resolution: "1280x720",
        });
    } else {
        console.log(
            "There is already an existing RTMP broadcast from the session to the ongoing event.",
            broadcastDetails.vonageSessionId,
            eventId
        );
    }
}

export async function stopEventBroadcasts(eventId: string): Promise<void> {
    let broadcastDetails: EventBroadcastDetails;
    try {
        broadcastDetails = await getEventBroadcastDetails(eventId);
    } catch (e) {
        console.error("Error retrieving Vonage broadcast details for event", e);
        return;
    }

    const existingSessionBroadcasts = await Vonage.listBroadcasts({
        sessionId: broadcastDetails.vonageSessionId,
    });

    if (!existingSessionBroadcasts) {
        console.error("Could not retrieve existing session broadcasts.", broadcastDetails.vonageSessionId);
        return;
    }

    for (const existingBroadcast of existingSessionBroadcasts) {
        try {
            if (existingBroadcast.status === "started") {
                await stopBroadcast(existingBroadcast.id);
            }
        } catch (e) {
            console.error("Could not stop existing session broadcast", eventId, existingBroadcast.id);
        }
    }
}
