import { gql } from "@apollo/client/core";
import { VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import assert from "assert";
import { VonageSession_RemoveInvalidStreamsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { Payload, VonageSessionLayoutData_Record } from "../types/hasura/event";

async function removeInvalidEventParticipantStreams(validStreamIds: string[], vonageSessionId: string) {
    gql`
        mutation VonageSession_RemoveInvalidStreams($validStreamIds: [String!]!, $vonageSessionId: String!) {
            delete_video_VonageParticipantStream(
                where: { vonageStreamId: { _nin: $validStreamIds }, vonageSessionId: { _eq: $vonageSessionId } }
            ) {
                affected_rows
            }
        }
    `;

    console.log("Attempting to remove invalid VonageParticipantStreams", { vonageSessionId });

    await apolloClient.mutate({
        mutation: VonageSession_RemoveInvalidStreamsDocument,
        variables: {
            validStreamIds,
            vonageSessionId,
        },
    });
}

interface VonageLayout {
    vonageSessionLayoutId: string;
    streamClasses: {
        [streamId: string]: string[];
    };
    css: string;
}

export async function applyVonageBroadcastLayout(vonageSessionId: string, layout: VonageLayout): Promise<void> {
    try {
        const streams = await Vonage.listStreams(vonageSessionId);
        if (!streams) {
            console.error("Could not retrieve list of streams from Vonage", { vonageSessionId });
            throw new Error("Could not retrieve list of streams from Vonage");
        }

        const invalidStreamClasses = Object.keys(layout.streamClasses).filter(
            (streamId) => !streams.some((s) => s.id === streamId)
        );

        if (invalidStreamClasses.length) {
            console.error(
                "Found invalid streams. Continuing to apply Vonage layout but it will result in a strange layout.",
                {
                    vonageSessionId,
                    invalidStreams: Object.entries(layout.streamClasses).filter(([streamId]) =>
                        invalidStreamClasses.some((s) => s === streamId)
                    ),
                }
            );
        }

        const streamsToClear = streams
            .filter((stream) => stream.layoutClassList.length)
            .filter((stream) => !Object.keys(layout.streamClasses).includes(stream.id))
            .map((stream) => ({
                id: stream.id,
                layoutClassList: [] as string[],
            }));
        const streamsToSet = Object.entries(layout.streamClasses).map(([streamId, classes]) => ({
            id: streamId,
            layoutClassList: classes,
        }));
        await Vonage.setStreamClassLists(vonageSessionId, streamsToClear.concat(streamsToSet));

        const startedBroadcastIds = await getStartedBroadcastIds(vonageSessionId);
        console.log("Setting layout of Vonage broadcasts", { vonageSessionId, startedBroadcastIds });
        for (const startedBroadcastId of startedBroadcastIds) {
            try {
                await Vonage.setBroadcastLayout(startedBroadcastId, "custom", layout.css, null);
            } catch (err) {
                console.error("Failed to set layout for Vonage broadcast", {
                    vonageSessionLayoutId: layout.vonageSessionLayoutId,
                    startedBroadcastId,
                    err,
                });
            }
        }
    } catch (err) {
        console.error("Error applying vonage session layout", { vonageSessionId, err });
    }
}

export async function handleVonageSessionLayoutCreated(
    payload: Payload<VonageSessionLayoutData_Record>
): Promise<void> {
    assert(payload.event.data.new, "Expected payload to have new row");

    const newRow = payload.event.data.new;
    const layoutData = newRow.layoutData;

    if (!layoutData) {
        return;
    }

    // At the moment, there seems to be no easy way to figure out who is publishing a stream if we didn't
    // record/receive the callback. So we'll just settle for removing invalid ones.
    const streams = await Vonage.listStreams(newRow.vonageSessionId);
    if (!streams) {
        console.error("Could not retrieve list of streams from Vonage", { vonageSessionId: newRow.vonageSessionId });
        throw new Error("Could not retrieve list of streams from Vonage");
    }
    await removeInvalidEventParticipantStreams(
        streams.map((x) => x.id),
        newRow.vonageSessionId
    );

    async function sendLayoutSignal() {
        try {
            await Vonage.signal(newRow.vonageSessionId, null, {
                data: layoutData,
                type: "layout-signal",
            });
        } catch (err) {
            console.error("Failed to send Vonage layout signal", {
                err,
                vonageSessionId: newRow.vonageSessionId,
                vonageSessionLayoutId: newRow.id,
                type: layoutData?.type,
            });
        }
    }

    async function applyFixedLayout(layout: VonageLayout) {
        try {
            await applyVonageBroadcastLayout(newRow.vonageSessionId, layout);
            await sendLayoutSignal();
        } catch (err) {
            console.error("Failed to apply Vonage layout", {
                err,
                vonageSessionId: newRow.vonageSessionId,
                vonageSessionLayoutId: newRow.id,
                type: layoutData?.type,
            });
        }
    }

    switch (layoutData.type) {
        case VonageSessionLayoutType.BestFit: {
            try {
                const streams = await Vonage.listStreams(newRow.vonageSessionId);

                if (!streams) {
                    throw new Error("Could not retrieve list of stream IDs from Vonage");
                }

                await Vonage.setStreamClassLists(
                    newRow.vonageSessionId,
                    streams.map((stream) => ({
                        id: stream.id,
                        layoutClassList: [],
                    }))
                );
            } catch (err) {
                console.error("Failed to unset stream class IDs. Continuing anyway.", {
                    vonageSessionLayoutId: newRow.id,
                    err,
                });
            }

            const startedBroadcastIds = await getStartedBroadcastIds(newRow.vonageSessionId);
            console.log("Setting broadcast layout to bestFit", { vonageSessionId: newRow.vonageSessionId });
            for (const startedBroadcastId of startedBroadcastIds) {
                try {
                    await Vonage.setBroadcastLayout(startedBroadcastId, "bestFit", null, "verticalPresentation");
                } catch (err) {
                    console.error("Failed to apply Vonage layout", {
                        vonageSessionLayoutId: newRow.id,
                        startedBroadcastId,
                        err,
                    });
                }
            }

            await sendLayoutSignal();
            return;
        }
        case VonageSessionLayoutType.Pair: {
            const layout = {
                css: "stream.left {display: block; position: absolute; width: 50%; height: 100%; left: 0;} stream.right {position: absolute; width: 50%; height: 100%; right: 0;}",
                streamClasses: {
                    left: [layoutData.leftStreamId],
                    right: [layoutData.rightStreamId],
                },
                vonageSessionLayoutId: newRow.id,
            };
            await applyFixedLayout(layout);
            return;
        }
        case VonageSessionLayoutType.Single: {
            const layout = {
                css: "stream.focus {display: block; position: absolute; width: 100%; height: 100%; left: 0;}",
                streamClasses: {
                    focus: [layoutData.focusStreamId],
                },
                vonageSessionLayoutId: newRow.id,
            };
            await applyFixedLayout(layout);
            return;
        }
        case VonageSessionLayoutType.PictureInPicture: {
            const layout = {
                css: "stream.focus {display: block; position: absolute; width: 100%; height: 100%; left: 0; z-index: 100;} stream.corner {display: block; position: absolute; width: 15%; height: 15%; right: 2%; bottom: 3%; z-index: 200;}",
                streamClasses: {
                    focus: [layoutData.focusStreamId],
                    corner: [layoutData.cornerStreamId],
                },
                vonageSessionLayoutId: newRow.id,
            };
            await applyFixedLayout(layout);
            return;
        }
    }
}

async function getStartedBroadcastIds(vonageSessionId: string): Promise<string[]> {
    console.log("Getting list of ongoing Vonage broadcasts", { vonageSessionId });
    const broadcasts = await Vonage.listBroadcasts({
        sessionId: vonageSessionId,
    });

    return (
        broadcasts
            ?.filter((broadcast) => broadcast.status === "started" || broadcast.status === "paused")
            .map((broadcast) => broadcast.id) ?? []
    );
}
