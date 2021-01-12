import { gql } from "@apollo/client/core";
import { VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import assert from "assert";
import * as R from "ramda";
import { GetEventParticipantStreamsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { EventVonageSessionData, Payload } from "../types/hasura/event";

export async function handleEventVonageSessionUpdated(payload: Payload<EventVonageSessionData>): Promise<void> {
    assert(payload.event.data.new, "Expected payload to have new row");

    const newRow = payload.event.data.new;

    const streamIds = await getEventVonageSessionStreams(newRow.eventId);

    const layoutData = newRow.layoutData;

    if (!layoutData) {
        return;
    }

    switch (layoutData.type) {
        case VonageSessionLayoutType.BestFit: {
            await Vonage.setStreamClassLists(
                newRow.sessionId,
                streamIds.map((streamId) => ({
                    id: streamId,
                    layoutClassList: [],
                }))
            );

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to bestFit", newRow.sessionId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(startedBroadcastId, "bestFit", null);
                } catch (e) {
                    console.error(
                        "Failed to set broadcast layout for broadcast",
                        newRow.sessionId,
                        startedBroadcastId,
                        e
                    );
                }
            }
            return;
        }
        case VonageSessionLayoutType.Pair: {
            console.log(
                "Setting class lists for Pair broadcast layout",
                newRow.sessionId,
                layoutData.leftStreamId,
                layoutData.rightStreamId
            );
            await Vonage.setStreamClassLists(newRow.sessionId, [
                {
                    id: layoutData.leftStreamId,
                    layoutClassList: ["left"],
                },
                {
                    id: layoutData.rightStreamId,
                    layoutClassList: ["right"],
                },
                ...R.without([layoutData.leftStreamId, layoutData.rightStreamId], streamIds).map((streamId) => ({
                    id: streamId,
                    layoutClassList: [],
                })),
            ]);

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to Pair", newRow.sessionId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(
                        startedBroadcastId,
                        "custom",
                        "stream.left {display: block; position: absolute; width: 50%; height: 100%; left: 0;} stream.right {position: absolute; width: 50%; height: 100%; right: 0;}"
                    );
                } catch (e) {
                    console.error(
                        "Failed to set broadcast layout for broadcast",
                        newRow.sessionId,
                        startedBroadcastId,
                        e
                    );
                }
            }

            return;
        }
        case VonageSessionLayoutType.Single: {
            console.log("Setting class lists for Single broadcast layout", newRow.sessionId, layoutData.focusStreamId);
            await Vonage.setStreamClassLists(newRow.sessionId, [
                {
                    id: layoutData.focusStreamId,
                    layoutClassList: ["focus"],
                },
                ...R.without([layoutData.focusStreamId], streamIds).map((streamId) => ({
                    id: streamId,
                    layoutClassList: [],
                })),
            ]);

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to Single", newRow.sessionId, layoutData.focusStreamId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(
                        startedBroadcastId,
                        "custom",
                        "stream.focus {display: block; position: absolute; width: 100%; height: 100%; left: 0;}"
                    );
                } catch (e) {
                    console.error(
                        "Failed to set broadcast layout for broadcast",
                        newRow.sessionId,
                        startedBroadcastId,
                        e
                    );
                }
            }

            return;
        }
        case VonageSessionLayoutType.PictureInPicture: {
            console.log("Setting class lists for PIP broadcast layout", newRow.sessionId, layoutData.focusStreamId);
            await Vonage.setStreamClassLists(newRow.sessionId, [
                {
                    id: layoutData.focusStreamId,
                    layoutClassList: ["focus"],
                },
                {
                    id: layoutData.cornerStreamId,
                    layoutClassList: ["corner"],
                },
                ...R.without([layoutData.focusStreamId, layoutData.cornerStreamId], streamIds).map((streamId) => ({
                    id: streamId,
                    layoutClassList: [],
                })),
            ]);

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to PIP", newRow.sessionId, layoutData.focusStreamId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(
                        startedBroadcastId,
                        "custom",
                        "stream.focus {display: block; position: absolute; width: 100%; height: 100%; left: 0; z-index: 100;} stream.corner {display: block; position: absolute; width: 20%; height: 20%; right: 10%; bottom: 10%; z-index: 200;}"
                    );
                } catch (e) {
                    console.error(
                        "Failed to set broadcast layout for broadcast",
                        newRow.sessionId,
                        startedBroadcastId,
                        e
                    );
                }
            }
        }
    }
}

gql`
    query GetEventParticipantStreams($eventId: uuid!) {
        EventParticipantStream(where: { eventId: { _eq: $eventId } }) {
            id
            vonageStreamId
        }
    }
`;

async function getEventVonageSessionStreams(eventId: string): Promise<string[]> {
    const streamsResult = await apolloClient.query({
        query: GetEventParticipantStreamsDocument,
        variables: {
            eventId,
        },
    });

    return streamsResult.data.EventParticipantStream.map((stream) => stream.vonageStreamId);
}

async function getStartedBroadcastIds(sessionId: string): Promise<string[]> {
    const broadcasts = await Vonage.listBroadcasts({
        sessionId,
    });

    return broadcasts?.filter((broadcast) => broadcast.status === "started").map((broadcast) => broadcast.id) ?? [];
}
