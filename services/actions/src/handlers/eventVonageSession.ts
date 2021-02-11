import { gql } from "@apollo/client/core";
import { VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import assert from "assert";
import * as R from "ramda";
import {
    EventVonageSession_RemoveInvalidStreamsDocument,
    GetEventParticipantStreamsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { EventVonageSessionData, Payload } from "../types/hasura/event";

async function findInvalidStreamsForSession(vonageSessionId: string, streamIds: string[]): Promise<string[]> {
    const streams = await Vonage.listStreams(vonageSessionId);
    if (!streams) {
        console.error("Could not retrieve list of streams in session from Vonage", vonageSessionId);
        throw new Error("Could not retrieve list of streams in session from Vonage");
    }
    return R.difference(
        streamIds,
        streams.map((stream) => stream.id)
    );
}

async function tryRemoveInvalidStreams(eventId: string, vonageSessionId: string): Promise<void> {
    gql`
        mutation EventVonageSession_RemoveInvalidStreams($validStreamIds: [String!]!, $eventId: uuid) {
            delete_EventParticipantStream(
                where: { vonageStreamId: { _nin: $validStreamIds }, eventId: { _eq: $eventId } }
            ) {
                affected_rows
            }
        }
    `;

    try {
        console.log("Attempting to remove invalid EventParticipantStreams", eventId, vonageSessionId);
        const streams = await Vonage.listStreams(vonageSessionId);

        if (!streams) {
            throw new Error("Did not get list of streams from Vonage");
        }

        await apolloClient.mutate({
            mutation: EventVonageSession_RemoveInvalidStreamsDocument,
            variables: {
                validStreamIds: streams.map((stream) => stream.id),
                eventId,
            },
        });
    } catch (e) {
        console.error("Failed to remove invalid EventParticipantStreams", eventId, vonageSessionId, e);
    }
}

export async function handleEventVonageSessionUpdated(payload: Payload<EventVonageSessionData>): Promise<void> {
    assert(payload.event.data.new, "Expected payload to have new row");

    const newRow = payload.event.data.new;

    const streamIds = await getEventVonageSessionStreams(newRow.eventId);

    const layoutData = newRow.layoutData;

    if (!layoutData || (payload.event.data.old && R.equals(payload.event.data.old.layoutData, layoutData))) {
        return;
    }

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
            const invalidStreams = await findInvalidStreamsForSession(newRow.sessionId, [
                layoutData.leftStreamId,
                layoutData.rightStreamId,
            ]);

            if (invalidStreams.length > 0) {
                console.error("Not all streams exist in the Vonage session", newRow.sessionId, invalidStreams);
                await tryRemoveInvalidStreams(newRow.eventId, newRow.sessionId);
                throw new Error("Not all streams exist in the Vonage session");
            }

            try {
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
            const invalidStreams = await findInvalidStreamsForSession(newRow.sessionId, [layoutData.focusStreamId]);

            if (invalidStreams.length > 0) {
                console.error("Not all streams exist in the Vonage session", newRow.sessionId, invalidStreams);
                await tryRemoveInvalidStreams(newRow.eventId, newRow.sessionId);
                throw new Error("Not all streams exist in the Vonage session");
            }

            try {
                console.log(
                    "Setting class lists for Single broadcast layout",
                    newRow.sessionId,
                    layoutData.focusStreamId
                );
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
            const invalidStreams = await findInvalidStreamsForSession(newRow.sessionId, [
                layoutData.focusStreamId,
                layoutData.cornerStreamId,
            ]);

            if (invalidStreams.length > 0) {
                console.error("Not all streams exist in the Vonage session", newRow.sessionId, invalidStreams);
                await tryRemoveInvalidStreams(newRow.eventId, newRow.sessionId);
                throw new Error("Not all streams exist in the Vonage session");
            }

            try {
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
