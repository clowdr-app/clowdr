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
            publishBatchUpdate(ModelName.Item, record.id);
        }

        for (const record of response.data.content_Element) {
            publishBatchUpdate(ModelName.Element, record.id);
        }

        publishBatchUpdate(ModelName.Room, conferenceId);
    }
}

async function Main() {
    onBatchUpdate(ModelName.Conference, onConferenceBatchUpdate);
}

Main();
