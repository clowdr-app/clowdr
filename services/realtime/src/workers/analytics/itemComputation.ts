import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type {
    Analytics_AggregateItemTotalViewsQuery,
    Analytics_AggregateItemTotalViewsQueryVariables,
} from "../../generated/graphql";
import {
    Analytics_AggregateItemTotalViewsDocument,
    Analytics_InsertItemTotalViewStatDocument,
} from "../../generated/graphql";
import { logger } from "../../lib/logger";
import { ModelName, onBatchUpdate } from "../../rabbitmq/analytics/batchUpdate";

logger.info("Analytics Item computation worker running");

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
    logger.info(`Content Item Batch Update: ${itemId}`);

    const response = await gqlClient
        ?.query<Analytics_AggregateItemTotalViewsQuery, Analytics_AggregateItemTotalViewsQueryVariables>(
            Analytics_AggregateItemTotalViewsDocument,
            {
                itemId,
            }
        )
        .toPromise();

    if (response?.data?.analytics_ContentItemStats_aggregate.aggregate?.sum) {
        await gqlClient
            ?.mutation(Analytics_InsertItemTotalViewStatDocument, {
                itemId,
                count: response.data.analytics_ContentItemStats_aggregate.aggregate.sum.viewCount ?? 0,
            })
            .toPromise();
    }
}

async function Main() {
    onBatchUpdate(ModelName.Item, onContentItemBatchUpdate);
}

Main();
