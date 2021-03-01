import { gql } from "@apollo/client/core";
import { FetchPresenceSummaryDocument, InsertAppStatsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query FetchPresenceSummary {
        presence_Summary {
            total_unique_tabs
            total_unique_user_ids
            pages
        }
    }

    mutation InsertAppStats($object: analytics_AppStats_insert_input!) {
        insert_analytics_AppStats_one(object: $object) {
            id
        }
    }
`;

export async function gatherPresenceStats(): Promise<void> {
    const stats = await apolloClient.query({
        query: FetchPresenceSummaryDocument,
    });

    if (!stats.data.presence_Summary) {
        throw new Error("Failed to fetch presence summary");
    }

    await apolloClient.mutate({
        mutation: InsertAppStatsDocument,
        variables: {
            object: {
                total_unique_tabs: stats.data.presence_Summary.total_unique_tabs,
                total_unique_user_ids: stats.data.presence_Summary.total_unique_user_ids,
                pages: stats.data.presence_Summary.pages,
            },
        },
    });
}
