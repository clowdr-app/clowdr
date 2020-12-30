import { gql } from "@apollo/client/core";
import { shortId } from "../../aws/awsClient";
import { GetEventBroadcastDetailsDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import * as Vonage from "./vonageClient";

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

export async function startEventBroadcast(eventId: string): Promise<void> {
    const eventResult = await apolloClient.query({
        query: GetEventBroadcastDetailsDocument,
        variables: {
            eventId,
        },
    });

    if (!eventResult.data.Event_by_pk) {
        console.error("Could not find event", eventId);
        return;
    }

    if (!eventResult.data.Event_by_pk.room.mediaLiveChannel?.rtmpInputUri) {
        console.error("No RTMP Push URI available for event room.", eventId, eventResult.data.Event_by_pk.room.id);
        return;
    }

    const rtmpUri = eventResult.data.Event_by_pk.room.mediaLiveChannel.rtmpInputUri;
    const rtmpUriParts = rtmpUri.split("/");
    if (rtmpUriParts.length < 2) {
        console.error("RTMP Push URI has unexpected format", eventId, rtmpUri);
        return;
    }
    const streamName = rtmpUriParts[rtmpUriParts.length - 1];
    const serverUrl = rtmpUri.substring(0, rtmpUri.length - streamName.length);
    console.log("Parsed RTMP URI", serverUrl, streamName);

    if (!eventResult.data.Event_by_pk.eventVonageSession?.sessionId) {
        console.error("Could not find Vonage session ID for event", eventId);
        return;
    }

    const sessionId = eventResult.data.Event_by_pk.eventVonageSession.sessionId;

    const existingSessionBroadcasts = await Vonage.listBroadcasts({
        sessionId,
    });

    if (!existingSessionBroadcasts) {
        console.error("Could not retrieve existing session broadcasts.", sessionId);
        return;
    }

    const startedSessionBroadcasts = existingSessionBroadcasts?.filter((broadcast) => broadcast.status === "started");

    console.log(
        `Vonage session has ${startedSessionBroadcasts.length} existing live broadcasts`,
        sessionId,
        startedSessionBroadcasts
    );

    if (startedSessionBroadcasts.length > 1) {
        console.warn(
            "Found more than one live broadcast for session - which is not allowed. Stopping them.",
            sessionId
        );
        for (const broadcast of startedSessionBroadcasts) {
            try {
                await Vonage.stopBroadcast(broadcast.id);
            } catch (e) {
                console.error("Error while stopping invalid broadcast", sessionId, broadcast.status, e);
            }
        }
    }

    const existingBroadcast = startedSessionBroadcasts.find((broadcast) =>
        broadcast.broadcastUrls.rtmp?.find(
            (destination) => destination.serverUrl === serverUrl && destination.streamName === streamName
        )
    );

    if (!existingBroadcast) {
        const rtmpId = shortId();
        console.log("Starting a broadcast from session to event room", sessionId, eventId, rtmpId);
        await Vonage.startBroadcast(sessionId, {
            layout: { type: "bestFit" },
            outputs: {
                rtmp: [
                    {
                        id: rtmpId,
                        serverUrl,
                        streamName,
                    },
                ],
            },
            resolution: "1280x720",
        });
    } else {
        console.log(
            "There is already an existing RTMP broadcast from the session to the ongoing event.",
            sessionId,
            eventId
        );
    }
}
