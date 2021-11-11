import { gql } from "@apollo/client/core";
import {
    Analytics_AggregateElementTotalViewsDocument,
    Analytics_InsertElementTotalViewStatDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { ModelName, onBatchUpdate } from "../../rabbitmq/analytics/batchUpdate";

console.info("Analytics Element computation worker running");

gql`
    query Analytics_AggregateElementTotalViews($elementId: uuid!) {
        analytics_ContentElementStats_aggregate(where: { elementId: { _eq: $elementId } }) {
            aggregate {
                sum {
                    viewCount
                }
            }
        }
    }

    mutation Analytics_InsertElementTotalViewStat($elementId: uuid!, $count: bigint!) {
        insert_analytics_ElementTotalViews_one(
            object: { elementId: $elementId, totalViewCount: $count }
            on_conflict: { constraint: ElementTotalViews_pkey, update_columns: [totalViewCount] }
        ) {
            elementId
        }
    }
`;

async function onContentElementBatchUpdate(elementId: string) {
    console.log(`Content Element Batch Update: ${elementId}`);

    const response = await apolloClient?.query({
        query: Analytics_AggregateElementTotalViewsDocument,
        variables: {
            elementId,
        },
    });

    if (
        response?.data.analytics_ContentElementStats_aggregate.aggregate?.sum !== undefined &&
        response?.data.analytics_ContentElementStats_aggregate.aggregate?.sum !== null
    ) {
        await apolloClient?.mutate({
            mutation: Analytics_InsertElementTotalViewStatDocument,
            variables: {
                elementId,
                count: response.data.analytics_ContentElementStats_aggregate.aggregate.sum.viewCount ?? 0,
            },
        });
    }
}

async function Main() {
    onBatchUpdate(ModelName.Element, onContentElementBatchUpdate);
}

Main();
