import { gql } from "@apollo/client/core";
import assert from "assert";
import type { Request, Response } from "express";
import { Analytics_ListConferencesDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { ModelName, publishBatchUpdate } from "../rabbitmq/analytics/batchUpdate";

gql`
    query Analytics_ListConferences($cutoff: timestamptz!) {
        conference_Conference(where: { events: { endTime: { _gte: $cutoff } } }) {
            id
        }
    }
`;

export async function queueConferenceBatchUpdates(_req: Request, res: Response): Promise<void> {
    try {
        const cutoff =
            Date.now() -
            (process.env.ANALYTICS_BACKDATE_CUTOFF
                ? parseInt(process.env.ANALYTICS_BACKDATE_CUTOFF, 10)
                : 7 * 24 * 60 * 60 * 1000);
        const conferences = await apolloClient?.query({
            query: Analytics_ListConferencesDocument,
            variables: {
                cutoff: new Date(cutoff).toISOString(),
            },
        });
        if (conferences) {
            for (const conference of conferences.data.conference_Conference) {
                await publishBatchUpdate(ModelName.Conference, conference.id);
            }
        }

        res.status(200).send("OK");
    } catch (e) {
        console.error("Analytics: Queue conference batch updates: Internal error", e);
        res.status(500).json("Internal error");
        return;
    }
}

export async function queueSingleConferenceBatchUpdate(req: Request, res: Response): Promise<void> {
    try {
        assert(typeof req.body.conferenceId === "string", "Conference id invalid");
        const conferenceId = req.body.conferenceId;

        const cutoffDist =
            typeof req.body.cutoffDistance === "number"
                ? req.body.cutoffDistance
                : process.env.ANALYTICS_BACKDATE_CUTOFF
                ? parseInt(process.env.ANALYTICS_BACKDATE_CUTOFF, 10)
                : 7 * 24 * 60 * 60 * 1000;

        await publishBatchUpdate(ModelName.Conference, conferenceId, cutoffDist);

        res.status(200).send("OK");
    } catch (e) {
        console.error("Analytics: Queue conference batch updates: Internal error", e);
        res.status(500).json("Internal error");
        return;
    }
}
