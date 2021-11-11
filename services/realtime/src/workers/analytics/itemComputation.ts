import { gql } from "@apollo/client/core";
import {
    Analytics_AggregateItemTotalViewsDocument,
    Analytics_InsertItemTotalViewStatDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { ModelName, onBatchUpdate } from "../../rabbitmq/analytics/batchUpdate";

console.info("Analytics Item computation worker running");

gql`
    query Analytics_AggregateItemTotalViews($itemId: uuid!) {
        analytics_ContentItemStats_aggregate(where: { itemId: { _eq: $itemId } }) {
            aggregate {
                sum {
                    viewCount
                }
            }
        }
    }

    mutation Analytics_InsertItemTotalViewStat($itemId: uuid!, $count: bigint!) {
        insert_analytics_ItemTotalViews_one(
            object: { itemId: $itemId, totalViewCount: $count }
            on_conflict: { constraint: ItemTotalViews_pkey, update_columns: [totalViewCount] }
        ) {
            itemId
        }
    }
`;

async function onContentItemBatchUpdate(itemId: string) {
    console.log(`Content Item Batch Update: ${itemId}`);

    const response = await apolloClient?.query({
        query: Analytics_AggregateItemTotalViewsDocument,
        variables: {
            itemId,
        },
    });

    if (
        response?.data.analytics_ContentItemStats_aggregate.aggregate?.sum !== undefined &&
        response?.data.analytics_ContentItemStats_aggregate.aggregate?.sum !== null
    ) {
        await apolloClient?.mutate({
            mutation: Analytics_InsertItemTotalViewStatDocument,
            variables: {
                itemId,
                count: response.data.analytics_ContentItemStats_aggregate.aggregate.sum.viewCount ?? 0,
            },
        });
    }
}

async function Main() {
    onBatchUpdate(ModelName.Item, onContentItemBatchUpdate);
}

Main();
