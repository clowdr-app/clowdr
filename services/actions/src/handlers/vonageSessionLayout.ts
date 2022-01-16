import { gql } from "@apollo/client/core";
import type { Payload, VonageSessionLayoutData_Record } from "@midspace/hasura/event";
import assert from "assert";
import type { P } from "pino";
import { VonageSession_RemoveInvalidStreamsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import Vonage from "../lib/vonage/vonageClient";
import { applyVonageSessionLayout, convertLayout } from "../lib/vonage/vonageTools";

async function removeInvalidEventParticipantStreams(
    logger: P.Logger,
    validStreamIds: string[],
    vonageSessionId: string
) {
    gql`
        mutation VonageSession_RemoveInvalidStreams(
            $validStreamIds: [String!]!
            $vonageSessionId: String!
            $now: timestamptz!
        ) {
            update_video_VonageParticipantStream(
                where: {
                    vonageStreamId: { _nin: $validStreamIds }
                    vonageSessionId: { _eq: $vonageSessionId }
                    stopped_at: { _is_null: true }
                }
                _set: { stopped_at: $now }
            ) {
                affected_rows
            }
        }
    `;

    logger.info({ vonageSessionId }, "Attempting to remove invalid VonageParticipantStreams");

    await (
        await apolloClient
    ).mutate({
        mutation: VonageSession_RemoveInvalidStreamsDocument,
        variables: {
            validStreamIds,
            vonageSessionId,
            now: new Date().toISOString(),
        },
    });
}

export async function handleVonageSessionLayoutCreated(
    logger: P.Logger,
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
        logger.error({ vonageSessionId: newRow.vonageSessionId }, "Could not retrieve list of streams from Vonage");
        throw new Error("Could not retrieve list of streams from Vonage");
    }
    await removeInvalidEventParticipantStreams(
        logger,
        streams.map((x) => x.id),
        newRow.vonageSessionId
    );

    const layout = convertLayout(layoutData);
    let streamCount: number | undefined;
    try {
        streamCount = await applyVonageSessionLayout(logger, newRow.vonageSessionId, layout);
    } catch (err) {
        logger.error(
            {
                err,
                vonageSessionId: newRow.vonageSessionId,
                vonageSessionLayoutId: newRow.id,
                type: layoutData.type,
            },
            "Failed to apply Vonage layout"
        );
    }

    try {
        if (streamCount) {
            await Vonage.signal(newRow.vonageSessionId, null, {
                data: { layout: layoutData, createdAt: Date.parse(newRow.created_at) },
                type: "layout-signal",
            });
        }
    } catch (err) {
        logger.error(
            {
                err,
                vonageSessionId: newRow.vonageSessionId,
                vonageSessionLayoutId: newRow.id,
                type: layoutData.type,
            },
            "Failed to send Vonage layout signal"
        );
    }
}
