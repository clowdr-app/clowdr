import { gql } from "@apollo/client/core";
import {
    BroadcastTranscodeDetails,
    ContentItemDataBlob,
    ContentItemVersionData,
    TranscodeDetails,
    VideoContentBlob,
} from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import R from "ramda";
import { is } from "typescript-is";
import { ContentItemAddNewVersionDocument, GetContentItemByIdDocument } from "../generated/graphql";
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

export async function createNewVersionFromPreviewTranscode(
    contentItemId: string,
    transcodeDetails: TranscodeDetails
): Promise<ContentItemVersionData> {
    const latestVersion = await getLatestVersion(contentItemId);
    assert(latestVersion, "Could not find latest version of content item data");

    const newVersion = R.clone(latestVersion);
    assert(is<VideoContentBlob>(newVersion.data), "Content item is not a video");

    newVersion.data.transcode = transcodeDetails;
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    return newVersion;
}

export async function createNewVersionFromBroadcastTranscode(
    contentItemId: string,
    transcodeDetails: BroadcastTranscodeDetails
): Promise<ContentItemVersionData> {
    const latestVersion = await getLatestVersion(contentItemId);
    assert(latestVersion, "Could not find latest version of content item data");

    const newVersion = R.clone(latestVersion);
    assert(is<VideoContentBlob>(newVersion.data), "Content item is not a video");

    newVersion.data.broadcastTranscode = transcodeDetails;
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    return newVersion;
}

export async function addNewContentItemVersion(contentItemId: string, version: ContentItemVersionData): Promise<void> {
    const result = await apolloClient.mutate({
        mutation: ContentItemAddNewVersionDocument,
        variables: {
            id: contentItemId,
            newVersion: version,
        },
    });

    if (result.errors) {
        console.error("Failed to add new content item version", result.errors);
        throw new Error(`Failed to add new content item version: ${result.errors}`);
    }
}

export async function addNewBroadcastTranscode(contentItemId: string, s3Url: string): Promise<void> {
    console.log("Updating content item with result of broadcast transcode", contentItemId);
    const transcodeDetails: BroadcastTranscodeDetails = {
        updatedTimestamp: new Date().getTime(),
        s3Url,
    };
    const newVersion = await createNewVersionFromBroadcastTranscode(contentItemId, transcodeDetails);
    await addNewContentItemVersion(contentItemId, newVersion);
}
