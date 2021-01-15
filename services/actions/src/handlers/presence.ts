import { gql } from "@apollo/client/core";
import { CleanupOldOpenTabsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    mutation CleanupOldOpenTabs($boundary: timestamptz) {
        delete_presence_OpenTab(where: { updated_at: { _lt: $boundary } }) {
            affected_rows
        }
    }
`;

export async function cleanupOpenTabs(): Promise<void> {
    await apolloClient.mutate({
        mutation: CleanupOldOpenTabsDocument,
        variables: {
            boundary: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
    });
}
