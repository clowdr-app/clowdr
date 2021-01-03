import { gql } from "@apollo/client/core";
import {
    BroadcastTranscodeDetails,
    ContentBaseType,
    ContentItemDataBlob,
    ContentItemVersionData,
    ContentType_Enum,
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
            contentTypeName
        }
    }
`;

export async function getLatestVersion(
    contentItemId: string
): Promise<{ latestVersion: Maybe<ContentItemVersionData>; contentTypeName: ContentType_Enum }> {
    const result = await apolloClient.query({
        query: GetContentItemByIdDocument,
        variables: {
            contentItemId,
        },
    });

    if (!result.data.ContentItem_by_pk) {
        throw new Error("Could not find content item");
    }

    if (!is<ContentItemDataBlob>(result.data.ContentItem_by_pk.data)) {
        return { latestVersion: null, contentTypeName: result.data.ContentItem_by_pk.contentTypeName };
    }

    const latestVersion = R.last(result.data.ContentItem_by_pk.data);

    return { latestVersion: latestVersion ?? null, contentTypeName: result.data.ContentItem_by_pk.contentTypeName };
}

export async function createNewVersionFromPreviewTranscode(
    contentItemId: string,
    transcodeDetails: TranscodeDetails
): Promise<ContentItemVersionData> {
    const { latestVersion } = await getLatestVersion(contentItemId);
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
    const { latestVersion, contentTypeName } = await getLatestVersion(contentItemId);

    const newVersion = R.clone(
        latestVersion ??
            ({
                createdAt: new Date().getTime(),
                createdBy: "system",
                data: {
                    baseType: ContentBaseType.Video,
                    s3Url: "",
                    subtitles: {},
                    type: contentTypeName,
                },
            } as ContentItemVersionData)
    );
    assert(is<VideoContentBlob>(newVersion.data), "Content item is not a video");

    newVersion.data.broadcastTranscode = transcodeDetails;
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    return newVersion;
}

// export function createNewVersionFromPublishToVimeo(
//     contentItemVersionData: ContentItemVersionData,
//     vimeoVideoUrl: string
// ): ContentItemVersionData {
//     const newVersion = R.clone(contentItemVersionData);
//     assert(is<VideoContentBlob>(newVersion.data), "Content item is not a video");

//     newVersion.data.vimeoUpload = {
//         videoUri: vimeoVideoUrl,
//     };
//     newVersion.createdAt = new Date().getTime();
//     newVersion.createdBy = "system";

//     return newVersion;
// }

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
