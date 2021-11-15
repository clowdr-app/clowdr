import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type {
    Analytics_AggregateElementTotalViewsQuery,
    Analytics_AggregateElementTotalViewsQueryVariables,
} from "../../generated/graphql";
import {
    Analytics_AggregateElementTotalViewsDocument,
    Analytics_InsertElementTotalViewStatDocument,
} from "../../generated/graphql";
import { logger } from "../../lib/logger";
import { ModelName, onBatchUpdate } from "../../rabbitmq/analytics/batchUpdate";

logger.info("Analytics Element computation worker running");

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
    logger.info(`Content Element Batch Update: ${elementId}`);

    const response = await gqlClient
        ?.query<Analytics_AggregateElementTotalViewsQuery, Analytics_AggregateElementTotalViewsQueryVariables>(
            Analytics_AggregateElementTotalViewsDocument,
            {
                elementId,
            }
        )
        .toPromise();

    if (
        response?.data?.analytics_ContentElementStats_aggregate.aggregate?.sum !== undefined &&
        response?.data?.analytics_ContentElementStats_aggregate.aggregate?.sum !== null
    ) {
        await gqlClient
            ?.mutation(Analytics_InsertElementTotalViewStatDocument, {
                elementId,
                count: response.data.analytics_ContentElementStats_aggregate.aggregate.sum.viewCount ?? 0,
            })
            .toPromise();
    }
}

async function Main() {
    onBatchUpdate(ModelName.Element, onContentElementBatchUpdate);
}

Main();
