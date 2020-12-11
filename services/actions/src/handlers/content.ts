import { gql } from "@apollo/client/core";
import {
    AacCodingMode,
    AacRateControlMode,
    AacVbrQuality,
    AudioCodec,
    AudioSelectorType,
    ContainerType,
    H264RateControlMode,
    OutputGroupType,
    VideoCodec,
} from "@aws-sdk/client-mediaconvert";
import { MediaConvert } from "../aws/awsClient";
import {
    ContentType_Enum,
    GetContentItemByRequiredItemDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { ContentItemData, Payload } from "../types/event";

export async function handleContentItemUpdated(
    payload: Payload<ContentItemData>
): Promise<void> {
    const oldContent = payload.event.data.old;
    const newContent = payload.event.data.new;

    if (!newContent?.data) {
        console.error("handleContentItemUpdated: New content was empty");
        return;
    }

    const oldVersion =
        oldContent?.data.versions[oldContent.data.versions.length - 1];
    const newVersion =
        newContent.data.versions[newContent.data.versions.length - 1];

    // If new version is not a video
    if (newVersion.data.type !== ContentType_Enum.VideoBroadcast) {
        console.log("Content item updated: was not a VideoBroadcast");
        return;
    }

    // If there is a new video source URL, start transcoding
    if (
        (oldVersion &&
            oldVersion.data.type == ContentType_Enum.VideoBroadcast &&
            oldVersion.data.s3Url !== newVersion.data.s3Url) ||
        (!oldVersion && newVersion.data.s3Url)
    ) {
        console.log(
            `Creating new MediaConvert job for ${newVersion.data.s3Url}`
        );

        const result = await (await MediaConvert()).createJob({
            Role: process.env.AWS_MEDIACONVERT_SERVICE_ROLE_ARN,
            Settings: {
                Inputs: [
                    {
                        FileInput: newVersion.data.s3Url,
                        AudioSelectors: {
                            "Audio Selector 1": {
                                SelectorType: AudioSelectorType.TRACK,
                            },
                        },
                    },
                ],
                OutputGroups: [
                    {
                        CustomName: "File Group",
                        OutputGroupSettings: {
                            FileGroupSettings: {
                                Destination: `s3://${process.env.AWS_CONTENT_BUCKET_ID}/`,
                            },
                            Type: OutputGroupType.FILE_GROUP_SETTINGS,
                        },
                        Outputs: [
                            {
                                NameModifier: "-transcode",
                                ContainerSettings: {
                                    Mp4Settings: {},
                                    Container: ContainerType.MP4,
                                },
                                VideoDescription: {
                                    CodecSettings: {
                                        Codec: VideoCodec.H_264,
                                        H264Settings: {
                                            MaxBitrate: 6000000,
                                            RateControlMode:
                                                H264RateControlMode.QVBR,
                                            QvbrSettings: {
                                                QvbrQualityLevel: 9,
                                            },
                                        },
                                    },
                                },
                                AudioDescriptions: [
                                    {
                                        CodecSettings: {
                                            Codec: AudioCodec.AAC,
                                            AacSettings: {
                                                CodingMode:
                                                    AacCodingMode.CODING_MODE_2_0,
                                                SampleRate: 48000,
                                                VbrQuality:
                                                    AacVbrQuality.MEDIUM_HIGH,
                                                RateControlMode:
                                                    AacRateControlMode.VBR,
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        });

        console.log(
            `Started new MediaConvert job for ${newVersion.data.s3Url} (id: ${result.Job?.Id})`
        );
    } else {
        console.log("Content item video URL has not changed.");
    }
}

gql`
    query GetContentItemByRequiredItem($accessToken: String!) {
        ContentItem(
            where: {
                requiredContentItem: { accessToken: { _eq: $accessToken } }
            }
        ) {
            id
            contentTypeName
            data
            layoutData
            name
        }
    }
`;

export async function handleGetByRequiredItem(
    args: getContentItemArgs
): Promise<Array<GetContentItemOutput>> {
    const result = await apolloClient.query({
        query: GetContentItemByRequiredItemDocument,
        variables: {
            accessToken: args.magicToken,
        },
    });

    if (result.error) {
        throw new Error("No item found");
    }

    return result.data.ContentItem.map((item) => ({
        id: item.id,
        name: item.name,
        layoutData: item.layoutData,
        data: item.data,
        contentTypeName: item.contentTypeName,
    }));
}
