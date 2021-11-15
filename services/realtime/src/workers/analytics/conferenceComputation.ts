import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import { Analytics_ListRecordsForAnalyticsDocument } from "../../generated/graphql";
import { logger } from "../../lib/logger";
import { ModelName, onBatchUpdate, publishBatchUpdate } from "../../rabbitmq/analytics/batchUpdate";

logger.info("Analytics Conference computation worker running");

gql`
    query Analytics_ListRecordsForAnalytics($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            id
        }
        content_Element(where: { conferenceId: { _eq: $conferenceId } }) {
            id
        }
    }
`;

async function onConferenceBatchUpdate(conferenceId: string, backdateDistance?: number) {
    logger.info(`Conference Batch Update: ${conferenceId} (Backdate distance: ${backdateDistance})`);

    const response = await gqlClient
        ?.query(Analytics_ListRecordsForAnalyticsDocument, {
            conferenceId,
        })
        .toPromise();

    if (response) {
        for (const record of response.data.content_Item) {
            try {
                publishBatchUpdate(ModelName.Item, record.id);
            } catch (error: any) {
                logger.error({ error }, "Error publishing batch update for item: " + record.id);
            }
        }

        for (const record of response.data.content_Element) {
            try {
                publishBatchUpdate(ModelName.Element, record.id);
            } catch (error: any) {
                logger.error({ error }, "Error publishing batch update for element: " + record.id);
            }
        }

        try {
            publishBatchUpdate(ModelName.Room, conferenceId, backdateDistance);
        } catch (error: any) {
            logger.error(
                { error },
                `Error publishing batch update for rooms: ${conferenceId} (Backdate distance: ${backdateDistance})`
            );
        }
    }
}

async function Main() {
    onBatchUpdate(ModelName.Conference, onConferenceBatchUpdate);
}

Main();
