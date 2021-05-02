import { gql } from "@apollo/client/core";
import { UpdateMp4BroadcastElementDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    mutation UpdateMP4BroadcastElement($broadcastElementId: uuid!, $input: jsonb!) {
        update_video_BroadcastElement_by_pk(
            pk_columns: { id: $broadcastElementId }
            _set: { input: $input, inputTypeName: MP4 }
        ) {
            id
        }
    }
`;

export async function updateMP4BroadcastElement(broadcastElementId: string, input: MP4Input): Promise<void> {
    const result = await apolloClient.mutate({
        mutation: UpdateMp4BroadcastElementDocument,
        variables: {
            broadcastElementId,
            input,
        },
    });

    if (!result.data || !result.data.update_video_BroadcastElement_by_pk?.id) {
        console.error("The broadcast content item was not found", broadcastElementId);
        throw new Error("The broadcast content item was not found");
    }
}
