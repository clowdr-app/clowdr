import {
    AacCodingMode,
    AacRateControlMode,
    AacVbrQuality,
    AudioCodec,
    AudioDescription,
    AudioSelectorType,
    CaptionDestinationType,
    CaptionSourceType,
    ContainerType,
    FileSourceConvert608To708,
    H264RateControlMode,
    OutputGroupType,
    VideoCodec,
    VideoDescription,
} from "@aws-sdk/client-mediaconvert";
import { AWSJobStatus, VideoContentBlob } from "@clowdr-app/shared-types/build/content";
import { TranscodeMode } from "@clowdr-app/shared-types/build/sns/mediaconvert";
import assert from "assert";
import R from "ramda";
import { is } from "typescript-is";
import { MediaConvert } from "../aws/awsClient";
import { ContentItemAddNewVersionDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getLatestVersion } from "./contentItem";

interface StartTranscodeOutput {
    jobId: string;
    timestamp: Date;
}

const videoDescription: VideoDescription = {
    CodecSettings: {
        Codec: VideoCodec.H_264,
        H264Settings: {
            MaxBitrate: 6000000,
            RateControlMode: H264RateControlMode.QVBR,
            QvbrSettings: {
                QvbrQualityLevel: 9,
            },
        },
    },
};

const audioDescription: AudioDescription = {
    CodecSettings: {
        Codec: AudioCodec.AAC,
        AacSettings: {
            CodingMode: AacCodingMode.CODING_MODE_2_0,
            SampleRate: 48000,
            VbrQuality: AacVbrQuality.MEDIUM_HIGH,
            RateControlMode: AacRateControlMode.VBR,
        },
    },
};

export async function startPreviewTranscode(s3InputUrl: string, contentItemId: string): Promise<StartTranscodeOutput> {
    console.log(`Creating preview MediaConvert job for ${s3InputUrl}`);

    assert(MediaConvert, "AWS MediaConvert client is not initialised");
    const result = await MediaConvert.createJob({
        Role: process.env.AWS_MEDIACONVERT_SERVICE_ROLE_ARN,
        UserMetadata: {
            contentItemId,
            mode: TranscodeMode.PREVIEW,
        },
        Settings: {
            Inputs: [
                {
                    FileInput: s3InputUrl,
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
                            NameModifier: "-preview",
                            ContainerSettings: {
                                Mp4Settings: {},
                                Container: ContainerType.MP4,
                            },
                            VideoDescription: videoDescription,
                            AudioDescriptions: [audioDescription],
                        },
                    ],
                },
            ],
        },
    });

    assert(result.Job?.Id && result.Job.CreatedAt, `Failed to create MediaConvert preview job for ${s3InputUrl}`);

    console.log(`Started preview MediaConvert job for ${s3InputUrl} (id: ${result.Job?.Id})`);

    return {
        jobId: result.Job.Id,
        timestamp: result.Job.CreatedAt,
    };
}

export async function startBroadcastTranscode(
    s3VideoUrl: string,
    s3CaptionsUrl: string,
    contentItemId: string
): Promise<StartTranscodeOutput> {
    console.log(`Creating broadcast MediaConvert job for ${s3VideoUrl}`);

    assert(MediaConvert, "AWS MediaConvert client is not initialised");
    const result = await MediaConvert.createJob({
        Role: process.env.AWS_MEDIACONVERT_SERVICE_ROLE_ARN,
        UserMetadata: {
            contentItemId,
            mode: TranscodeMode.PREVIEW,
        },
        Settings: {
            Inputs: [
                {
                    FileInput: s3VideoUrl,
                    AudioSelectors: {
                        "Audio Selector 1": {
                            SelectorType: AudioSelectorType.TRACK,
                        },
                    },
                    CaptionSelectors: {
                        "Caption Selector 1": {
                            SourceSettings: {
                                SourceType: CaptionSourceType.SRT,
                                FileSourceSettings: {
                                    Convert608To708: FileSourceConvert608To708.UPCONVERT,
                                    SourceFile: s3CaptionsUrl,
                                },
                            },
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
                            NameModifier: "-preview",
                            ContainerSettings: {
                                Mp4Settings: {},
                                Container: ContainerType.MP4,
                            },
                            VideoDescription: videoDescription,
                            AudioDescriptions: [audioDescription],
                            CaptionDescriptions: [
                                {
                                    CaptionSelectorName: "Caption Selector 1",
                                    CustomLanguageCode: "eng",
                                    DestinationSettings: {
                                        DestinationType: CaptionDestinationType.EMBEDDED,
                                        EmbeddedDestinationSettings: {},
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    });

    assert(result.Job?.Id && result.Job.CreatedAt, `Failed to create MediaConvert broadcast job for ${s3VideoUrl}`);

    console.log(`Started preview MediaConvert job for ${s3VideoUrl} (id: ${result.Job?.Id})`);

    return {
        jobId: result.Job.Id,
        timestamp: result.Job.CreatedAt,
    };
}

export async function completeTranscode(
    contentItemId: string,
    transcodeS3Url: string,
    transcodeJobId: string,
    timestamp: Date
): Promise<void> {
    const latestVersion = await getLatestVersion(contentItemId);
    assert(latestVersion, `Could not find latest version of content item ${contentItemId}`);

    const newVersion = R.clone(latestVersion);
    assert(is<VideoContentBlob>(newVersion.data), `Content item ${contentItemId} is not a video`);

    newVersion.data.transcode = {
        jobId: transcodeJobId,
        status: AWSJobStatus.Completed,
        updatedTimestamp: timestamp.getTime(),
        s3Url: transcodeS3Url,
    };
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    const result = await apolloClient.mutate({
        mutation: ContentItemAddNewVersionDocument,
        variables: {
            id: contentItemId,
            newVersion,
        },
    });

    if (result.errors) {
        console.error(`Failed to complete transcode for ${contentItemId}`, result.errors);
        throw new Error(`Failed to complete transcode for ${contentItemId}`);
    }
}

export async function failTranscode(
    contentItemId: string,
    transcodeJobId: string,
    timestamp: Date,
    errorMessage: string
): Promise<void> {
    const latestVersion = await getLatestVersion(contentItemId);
    assert(latestVersion, `Could not find latest version of content item ${contentItemId}`);

    const newVersion = R.clone(latestVersion);
    assert(is<VideoContentBlob>(newVersion.data), `Content item ${contentItemId} is not a video`);

    if (
        latestVersion.data.baseType !== "video" ||
        !latestVersion.data.transcode ||
        latestVersion.data.transcode.jobId !== transcodeJobId
    ) {
        console.log("Received notification of transcode failure, but did not record it");
        return;
    }

    newVersion.data.transcode = {
        jobId: transcodeJobId,
        status: AWSJobStatus.Failed,
        updatedTimestamp: timestamp.getTime(),
        s3Url: undefined,
        message: errorMessage,
    };
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    const result = await apolloClient.mutate({
        mutation: ContentItemAddNewVersionDocument,
        variables: {
            id: contentItemId,
            newVersion,
        },
    });

    if (result.errors) {
        console.error(`Failed to record transcode failure for ${contentItemId}`, result.errors);
        throw new Error(`Failed to record transcode failure for ${contentItemId}`);
    }
}
