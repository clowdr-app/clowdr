import { gql } from "@apollo/client/core";
import { ContentItemDataBlob, ContentItemVersionData } from "@clowdr-app/shared-types/build/content";
import R from "ramda";
import { is } from "typescript-is";
import { GetContentItemByIdDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query GetContentItemById($contentItemId: uuid!) {
        ContentItem_by_pk(id: $contentItemId) {
            id
            data
        }
    }
`;

export async function getLatestVersion(contentItemId: string): Promise<Maybe<ContentItemVersionData>> {
    const result = await apolloClient.query({
        query: GetContentItemByIdDocument,
        variables: {
            contentItemId,
        },
    });

    if (!result.data.ContentItem_by_pk) {
        return null;
    }

    if (!is<ContentItemDataBlob>(result.data.ContentItem_by_pk.data)) {
        return null;
    }

    const latestVersion = R.last(result.data.ContentItem_by_pk.data);

    return latestVersion ?? null;
}
