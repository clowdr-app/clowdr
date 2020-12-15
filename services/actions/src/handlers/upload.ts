import { gql } from "@apollo/client/core";
import {
    ContentBlob,
    ContentItemDataBlob,
    ContentItemVersionData,
    VideoContentBlob,
} from "@clowdr-app/shared-types/types/content";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import R from "ramda";
import { is } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "../aws/awsClient";
import {
    ContentItemAddNewVersionDocument,
    ContentType_Enum,
    CreateContentItemDocument,
    RequiredItemDocument,
    RequiredItemFieldsFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getLatestVersion } from "../lib/contentItem";

gql`
    query RequiredItem($accessToken: String!) {
        RequiredContentItem(where: { accessToken: { _eq: $accessToken } }) {
            ...RequiredItemFields
        }
    }

    fragment RequiredItemFields on RequiredContentItem {
        id
        contentTypeName
        name
        conference {
            id
            name
        }
        contentItem {
            id
            data
            contentTypeName
        }
        contentGroup {
            id
        }
    }

    mutation CreateContentItem(
        $conferenceId: uuid!
        $contentGroupId: uuid!
        $contentTypeName: ContentType_enum!
        $data: jsonb!
        $isHidden: Boolean!
        $layoutData: jsonb!
        $name: String!
        $requiredContentId: uuid!
    ) {
        insert_ContentItem_one(
            object: {
                conferenceId: $conferenceId
                contentGroupId: $contentGroupId
                contentTypeName: $contentTypeName
                data: $data
                isHidden: $isHidden
                layoutData: $layoutData
                name: $name
                requiredContentId: $requiredContentId
            }
            on_conflict: {
                constraint: ContentItem_requiredContentId_key
                update_columns: data
            }
        ) {
            id
        }
    }
`;

async function checkS3Url(
    url: string
): Promise<
    { result: "success"; url: string } | { result: "error"; message: string }
> {
    const { region, bucket, key } = AmazonS3URI(url);
    if (region !== process.env.AWS_REGION) {
        return { result: "error", message: "Invalid S3 URL (region mismatch)" };
    }
    if (bucket !== process.env.AWS_CONTENT_BUCKET_ID) {
        return { result: "error", message: "Invalid S3 URL (bucket mismatch)" };
    }
    if (!key) {
        return { result: "error", message: "Invalid S3 URL (missing key)" };
    }

    try {
        await S3.headObject({
            Bucket: bucket,
            Key: key,
        });
    } catch (e) {
        return {
            result: "error",
            message: "Could not retrieve object from S3",
        };
    }

    return { result: "success", url: `s3://${bucket}/${key}` };
}

async function createBlob(
    inputData: any,
    contentTypeName: ContentType_Enum
): Promise<ContentBlob | { error: string }> {
    switch (contentTypeName) {
        case ContentType_Enum.Abstract:
        case ContentType_Enum.Text:
            if (!inputData.text) {
                return { error: "No text supplied" };
            }
            return {
                baseType: "text",
                type: contentTypeName,
                text: inputData.text,
            };
        case ContentType_Enum.ImageFile:
        case ContentType_Enum.PaperFile:
        case ContentType_Enum.PosterFile: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: "file",
                type: contentTypeName,
                s3Url: result.url,
            };
        }
        case ContentType_Enum.ImageUrl:
        case ContentType_Enum.Link:
        case ContentType_Enum.PaperUrl:
        case ContentType_Enum.PosterUrl:
        case ContentType_Enum.VideoUrl:
            if (!inputData.url) {
                return { error: "No URL supplied" };
            }
            return {
                baseType: "url",
                type: contentTypeName,
                url: inputData.url,
            };
        case ContentType_Enum.LinkButton:
        case ContentType_Enum.PaperLink:
        case ContentType_Enum.VideoLink:
            if (!inputData.url || !inputData.text) {
                return { error: "Text or URL not supplied" };
            }
            return {
                baseType: "link",
                type: contentTypeName,
                text: inputData.text,
                url: inputData.url,
            };
        case ContentType_Enum.VideoBroadcast:
        case ContentType_Enum.VideoCountdown:
        case ContentType_Enum.VideoFile:
        case ContentType_Enum.VideoFiller:
        case ContentType_Enum.VideoPrepublish:
        case ContentType_Enum.VideoSponsorsFiller:
        case ContentType_Enum.VideoTitles: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: "video",
                type: contentTypeName,
                s3Url: result.url,
                subtitles: {},
            };
        }
    }
}

async function getItemByToken(
    magicToken: string
): Promise<RequiredItemFieldsFragment | { error: string }> {
    if (!magicToken) {
        return {
            error: "Access token not provided.",
        };
    }

    const response = await apolloClient.query({
        query: RequiredItemDocument,
        variables: {
            accessToken: magicToken,
        },
    });

    if (response.data.RequiredContentItem.length !== 1) {
        return {
            error: "Could not find a required item that matched the request.",
        };
    }

    const requiredContentItem = response.data.RequiredContentItem[0];

    return requiredContentItem;
}

export async function handleContentItemSubmitted(
    args: submitContentItemArgs
): Promise<SubmitContentItemOutput> {
    const requiredContentItem = await getItemByToken(args.magicToken);
    if ("error" in requiredContentItem) {
        return {
            success: false,
            message: requiredContentItem.error,
        };
    }

    const newVersionData = await createBlob(
        args.data,
        requiredContentItem.contentTypeName
    );
    if ("error" in newVersionData) {
        return {
            success: false,
            message: newVersionData.error,
        };
    }

    if (!requiredContentItem.contentItem) {
        try {
            const data: ContentItemDataBlob = [
                {
                    createdAt: Date.now(),
                    createdBy: "user",
                    data: newVersionData,
                },
            ];
            await apolloClient.mutate({
                mutation: CreateContentItemDocument,
                variables: {
                    conferenceId: requiredContentItem.conference.id,
                    contentGroupId: requiredContentItem.contentGroup.id,
                    contentTypeName: requiredContentItem.contentTypeName,
                    data,
                    isHidden: false,
                    layoutData: {},
                    name: requiredContentItem.name,
                    requiredContentId: requiredContentItem.id,
                },
            });
        } catch (e) {
            console.error("Failed to save new content item", e);
            return {
                success: false,
                message: "Failed to save new item.",
            };
        }
    } else if (
        requiredContentItem.contentItem.contentTypeName !==
        requiredContentItem.contentTypeName
    ) {
        return {
            success: false,
            message: "An item of a different type has already been uploaded.",
        };
    } else {
        // There is already a content item, so we need to add a new blob version
    }

    // If there is no content item, create a new content item
    // If there is a content item, but of a different type, fail
    // If there is a content item of the same type, create a new version

    if (requiredContentItem.contentItem) {
        const latestVersion = await getLatestVersion(
            requiredContentItem.contentItem.id
        );

        if (newVersionData.type !== latestVersion?.data.type) {
            return {
                success: false,
                message:
                    "An item of a different type has already been uploaded.",
            };
        } else {
            try {
                const newVersion: ContentItemVersionData = {
                    createdAt: Date.now(),
                    createdBy: "user",
                    data: newVersionData,
                };

                await apolloClient.mutate({
                    mutation: ContentItemAddNewVersionDocument,
                    variables: {
                        id: requiredContentItem.contentItem.id,
                        newVersion,
                    },
                });
            } catch (e) {
                console.error("Failed to save new version of content item", e);
                return {
                    success: false,
                    message: "Failed to save new version of content item",
                };
            }
        }
    }

    return {
        success: true,
        message: "",
    };
}

export async function handleUpdateSubtitles(
    args: updateSubtitlesArgs
): Promise<SubmitUpdatedSubtitlesOutput> {
    const requiredContentItem = await getItemByToken(args.magicToken);
    if ("error" in requiredContentItem) {
        return {
            success: false,
            message: requiredContentItem.error,
        };
    }

    if (!requiredContentItem.contentItem) {
        return {
            message: "No matching content item",
            success: false,
        };
    }

    const latestVersion = await getLatestVersion(
        requiredContentItem.contentItem.id
    );

    if (!latestVersion) {
        return {
            message: "No existing content item data",
            success: false,
        };
    }

    const newVersion = R.clone(latestVersion);
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "user";
    assert(
        is<VideoContentBlob>(newVersion.data),
        "Content item is not a video"
    );

    const bucket = process.env.AWS_CONTENT_BUCKET_ID;
    const key = `${uuidv4()}.srt`;

    try {
        await S3.putObject({
            Bucket: bucket,
            Key: key,
            Body: Buffer.from(args.subtitleText, "utf-8"),
            ContentType: "application/x-subrip",
        });
    } catch (e) {
        console.error("Failed to upload new subtitles", e);
        return {
            message: "Failed to upload new subtitles",
            success: false,
        };
    }

    if (!newVersion.data.subtitles) {
        newVersion.data.subtitles = {};
    }

    newVersion.data.subtitles["en_US"] = {
        s3Url: `s3://${bucket}/${key}`,
        status: "COMPLETED",
    };

    try {
        await apolloClient.mutate({
            mutation: ContentItemAddNewVersionDocument,
            variables: {
                id: requiredContentItem.contentItem.id,
                newVersion,
            },
        });
    } catch (e) {
        console.error("Failed to save new content item version", e);
        return {
            message: "Failed to save new content item version",
            success: false,
        };
    }

    return {
        message: "",
        success: true,
    };
}
