import { gql } from "@apollo/client/core";
import type { Request, Response } from "express";
import { Analytics_ListConferencesDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { ModelName, publishBatchUpdate } from "../rabbitmq/analytics/batchUpdate";

gql`
    query Analytics_ListConferences {
        conference_Conference {
            id
        }
    }
`;

export async function queueConferenceBatchUpdates(_req: Request, res: Response): Promise<void> {
    try {
        const conferences = await apolloClient?.query({
            query: Analytics_ListConferencesDocument,
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
