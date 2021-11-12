import { gql } from "@apollo/client/core";
import { Analytics_ListRecordsForAnalyticsDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { ModelName, onBatchUpdate, publishBatchUpdate } from "../../rabbitmq/analytics/batchUpdate";

console.info("Analytics Conference computation worker running");

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

async function onConferenceBatchUpdate(conferenceId: string) {
    console.log(`Conference Batch Update: ${conferenceId}`);

    const response = await apolloClient?.query({
        query: Analytics_ListRecordsForAnalyticsDocument,
        variables: {
            conferenceId,
        },
    });

    if (response) {
        for (const record of response.data.content_Item) {
            try {
                publishBatchUpdate(ModelName.Item, record.id);
            } catch (error: any) {
                console.error("Error publishing batch update for item: " + record.id, error);
            }
        }

        for (const record of response.data.content_Element) {
            try {
                publishBatchUpdate(ModelName.Element, record.id);
            } catch (error: any) {
                console.error("Error publishing batch update for element: " + record.id, error);
            }
        }

        try {
            publishBatchUpdate(ModelName.Room, conferenceId);
        } catch (error: any) {
            console.error("Error publishing batch update for rooms: " + conferenceId, error);
        }
    }
}

async function Main() {
    onBatchUpdate(ModelName.Conference, onConferenceBatchUpdate);
}

Main();
