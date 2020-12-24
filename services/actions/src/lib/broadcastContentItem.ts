import { gql } from "@apollo/client/core";
import { UpdateMp4BroadcastContentItemDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    mutation UpdateMP4BroadcastContentItem($broadcastContentItemId: uuid!, $input: jsonb!) {
        update_BroadcastContentItem_by_pk(
            pk_columns: { id: $broadcastContentItemId }
            _set: { input: $input, inputTypeName: MP4 }
        ) {
            id
        }
    }
`;

export async function updateMP4BroadcastContentItem(broadcastContentItemId: string, input: MP4Input): Promise<void> {
    const result = await apolloClient.mutate({
        mutation: UpdateMp4BroadcastContentItemDocument,
        variables: {
            broadcastContentItemId,
            input,
        },
    });

    if (!result.data) {
        console.error("The broadcast content item was not found", broadcastContentItemId);
        throw new Error("The broadcast content item was not found");
    }
}
