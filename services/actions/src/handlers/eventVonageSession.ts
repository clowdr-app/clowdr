import { gql } from "@apollo/client/core";
import { VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import assert from "assert";
import * as R from "ramda";
import { EventVonageSession_RemoveInvalidStreamsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { EventVonageSessionData, Payload } from "../types/hasura/event";

async function removeInvalidStreams(eventId: string, vonageSessionId: string): Promise<string[]> {
    gql`
        mutation EventVonageSession_RemoveInvalidStreams($validStreamIds: [String!]!, $eventId: uuid) {
            delete_video_EventParticipantStream(
                where: { vonageStreamId: { _nin: $validStreamIds }, eventId: { _eq: $eventId } }
            ) {
                affected_rows
            }
        }
    `;

    console.log("Attempting to remove invalid EventParticipantStreams", eventId, vonageSessionId);
    const streams = await Vonage.listStreams(vonageSessionId);

    if (!streams) {
        throw new Error("Did not get list of streams from Vonage");
    }

    const validStreamIds = streams.map((stream) => stream.id);

    await apolloClient.mutate({
        mutation: EventVonageSession_RemoveInvalidStreamsDocument,
        variables: {
            validStreamIds,
            eventId,
        },
    });

    return validStreamIds;
}

export async function handleEventVonageSessionUpdated(payload: Payload<EventVonageSessionData>): Promise<void> {
    assert(payload.event.data.new, "Expected payload to have new row");

    const newRow = payload.event.data.new;

    const layoutData = newRow.layoutData;

    if (!layoutData || (payload.event.data.old && R.equals(payload.event.data.old.layoutData, layoutData))) {
        return;
    }

    // At the moment, there seems to be no easy way to figure out who is publishing a stream if we didn't
    // record/receive the callback. So we'll just settle for removing invalid ones.
    const streamIds = await removeInvalidStreams(newRow.eventId, newRow.sessionId);

    switch (layoutData.type) {
        case VonageSessionLayoutType.BestFit: {
            try {
                const streams = await Vonage.listStreams(newRow.sessionId);

                if (!streams) {
                    throw new Error("Could not retrieve list of stream IDs from Vonage");
                }

                await Vonage.setStreamClassLists(
                    newRow.sessionId,
                    streams.map((stream) => ({
                        id: stream.id,
                        layoutClassList: [],
                    }))
                );
            } catch (e) {
                console.error("Failed to unset stream class IDs. Continuing anyway.", newRow.sessionId, e);
            }

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to bestFit", newRow.sessionId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(startedBroadcastId, "bestFit", null, "horizontalPresentation");
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
            try {
                console.log(
                    "Setting class lists for Pair broadcast layout",
                    newRow.sessionId,
                    layoutData.leftStreamId,
                    layoutData.rightStreamId
                );

                if (!streamIds.includes(layoutData.leftStreamId) || !streamIds.includes(layoutData.rightStreamId)) {
                    console.error(
                        "Could not find requested streams to set Pair broadcast layout",
                        newRow.sessionId,
                        layoutData.leftStreamId,
                        layoutData.rightStreamId
                    );
                    throw new Error("Could not find requested stream");
                }

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
            } catch (e) {
                console.error(
                    "Could not set class lists for Pair broadcast layout",
                    newRow.sessionId,
                    layoutData.leftStreamId,
                    layoutData.rightStreamId,
                    e
                );
                return;
            }

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to Pair", newRow.sessionId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(
                        startedBroadcastId,
                        "custom",
                        "stream.left {display: block; position: absolute; width: 50%; height: 100%; left: 0;} stream.right {position: absolute; width: 50%; height: 100%; right: 0;}",
                        null
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
            try {
                console.log(
                    "Setting class lists for Single broadcast layout",
                    newRow.sessionId,
                    layoutData.focusStreamId
                );

                if (!streamIds.includes(layoutData.focusStreamId)) {
                    console.error(
                        "Could not find requested stream to set Single broadcast layout",
                        newRow.sessionId,
                        layoutData.focusStreamId
                    );
                    throw new Error("Could not find requested stream");
                }

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
            } catch (e) {
                console.error(
                    "Could not set class lists for Single broadcast layout",
                    newRow.sessionId,
                    layoutData.focusStreamId,
                    e
                );
                return;
            }

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to Single", newRow.sessionId, layoutData.focusStreamId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(
                        startedBroadcastId,
                        "custom",
                        "stream.focus {display: block; position: absolute; width: 100%; height: 100%; left: 0;}",
                        null
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
            try {
                console.log("Setting class lists for PIP broadcast layout", newRow.sessionId, layoutData.focusStreamId);

                if (!streamIds.includes(layoutData.focusStreamId) || !streamIds.includes(layoutData.cornerStreamId)) {
                    console.error(
                        "Could not find requested streams to set PIP broadcast layout",
                        newRow.sessionId,
                        layoutData.focusStreamId,
                        layoutData.cornerStreamId
                    );
                    throw new Error("Could not find requested stream");
                }

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
            } catch (e) {
                console.error(
                    "Could not set class lists for PIP broadcast layout",
                    newRow.sessionId,
                    layoutData.cornerStreamId,
                    layoutData.focusStreamId,
                    e
                );
                return;
            }

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.sessionId);

            console.log("Setting broadcast layout to PIP", newRow.sessionId, layoutData.focusStreamId);
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(
                        startedBroadcastId,
                        "custom",
                        "stream.focus {display: block; position: absolute; width: 100%; height: 100%; left: 0; z-index: 100;} stream.corner {display: block; position: absolute; width: 20%; height: 20%; right: 10%; bottom: 10%; z-index: 200;}",
                        null
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

async function getStartedBroadcastIds(sessionId: string): Promise<string[]> {
    const broadcasts = await Vonage.listBroadcasts({
        sessionId,
    });

    return broadcasts?.filter((broadcast) => broadcast.status === "started").map((broadcast) => broadcast.id) ?? [];
}
