import {
    AacCodingMode,
    AacInputType,
    AacProfile,
    AacRateControlMode,
    AacRawFormat,
    AacSettings,
    AacSpec,
    AacVbrQuality,
    AfdSignaling,
    EmbeddedConvert608To708,
    EmbeddedScte20Detection,
    FeatureActivationsInputPrepareScheduleActions,
    GlobalConfigurationInputEndAction,
    H264AdaptiveQuantization,
    H264ColorMetadata,
    H264EntropyEncoding,
    H264FlickerAq,
    H264ForceFieldPictures,
    H264FramerateControl,
    H264GopBReference,
    H264GopSizeUnits,
    H264Level,
    H264LookAheadRateControl,
    H264ParControl,
    H264Profile,
    H264RateControlMode,
    H264ScanType,
    H264SceneChangeDetect,
    H264Settings,
    H264SpatialAq,
    H264SubGopLength,
    H264Syntax,
    H264TemporalAq,
    H264TimecodeInsertionBehavior,
    InputSourceEndBehavior,
    VideoDescriptionRespondToAfd,
    VideoDescriptionScalingBehavior,
} from "@aws-sdk/client-medialive";
import { MediaLive, shortId } from "../../aws/awsClient";

export enum ChannelState {
    CREATE_FAILED = "CREATE_FAILED",
    CREATING = "CREATING",
    DELETED = "DELETED",
    DELETING = "DELETING",
    IDLE = "IDLE",
    RECOVERING = "RECOVERING",
    RUNNING = "RUNNING",
    STARTING = "STARTING",
    STOPPING = "STOPPING",
    UPDATE_FAILED = "UPDATE_FAILED",
    UPDATING = "UPDATING",
}

export async function getMediaLiveChannelState(channelId: string): Promise<ChannelState | "MISSING"> {
    try {
        const result = await MediaLive.describeChannel({
            ChannelId: channelId,
        });
        return (result.State as ChannelState) ?? "MISSING";
    } catch (e) {
        console.error("Channel missing from MediaLive", channelId);
        return "MISSING";
    }
}

export interface RtmpInput {
    id: string;
    rtmpUri: string;
}

export async function createRtmpInput(roomId: string, securityGroupId: string): Promise<RtmpInput> {
    const input = await MediaLive.createInput({
        Destinations: [{ StreamName: shortId() }],
        Tags: { roomId, environment: process.env.AWS_PREFIX ?? "unknown" },
        Name: shortId(),
        Type: "RTMP_PUSH",
        InputSecurityGroups: [securityGroupId],
    });
    if (
        input.Input?.Id &&
        input.Input.Destinations &&
        input.Input.Destinations.length > 0 &&
        input.Input.Destinations[0].Url
    ) {
        return {
            id: input.Input.Id,
            rtmpUri: input.Input.Destinations[0].Url,
        };
    }
    throw new Error("Failed to create new Input");
}

export async function createMP4Input(roomId: string, securityGroupId: string): Promise<string> {
    const input = await MediaLive.createInput({
        Tags: { roomId, environment: process.env.AWS_PREFIX ?? "unknown" },
        Name: shortId(),
        Type: "MP4_FILE",
        Sources: [{ Url: `s3ssl://${process.env.AWS_CONTENT_BUCKET_ID}/$urlPath$` }],
        InputSecurityGroups: [securityGroupId],
    });
    if (input.Input?.Id) {
        return input.Input.Id;
    }
    throw new Error("Failed to create new Input");
}

export async function createLoopingMP4Input(roomId: string, securityGroupId: string): Promise<string> {
    const input = await MediaLive.createInput({
        Tags: { roomId, environment: process.env.AWS_PREFIX ?? "unknown" },
        Name: shortId(),
        Type: "MP4_FILE",
        Sources: [{ Url: `s3ssl://${process.env.AWS_CONTENT_BUCKET_ID}/$urlPath$` }],
        InputSecurityGroups: [securityGroupId],
    });
    if (input.Input?.Id) {
        return input.Input.Id;
    }
    throw new Error("Failed to create new Input");
}

export interface MediaLiveChannel {
    channelId: string;
    mp4InputAttachmentName: string;
    loopingMp4InputAttachmentName: string;
    vonageInputAttachmentName: string;
}

const defaultH264Settings: Partial<H264Settings> = {
    AfdSignaling: AfdSignaling.AUTO,
    ColorMetadata: H264ColorMetadata.INSERT,
    AdaptiveQuantization: H264AdaptiveQuantization.MEDIUM,
    EntropyEncoding: H264EntropyEncoding.CABAC,
    FlickerAq: H264FlickerAq.ENABLED,
    ForceFieldPictures: H264ForceFieldPictures.DISABLED,
    FramerateControl: H264FramerateControl.SPECIFIED,
    FramerateNumerator: 30,
    FramerateDenominator: 1,
    GopBReference: H264GopBReference.DISABLED,
    GopClosedCadence: 1,
    GopNumBFrames: 2,
    GopSize: 1,
    GopSizeUnits: H264GopSizeUnits.SECONDS,
    SubgopLength: H264SubGopLength.FIXED,
    ScanType: H264ScanType.PROGRESSIVE,
    Level: H264Level.H264_LEVEL_AUTO,
    LookAheadRateControl: H264LookAheadRateControl.MEDIUM,
    NumRefFrames: 1,
    ParControl: H264ParControl.SPECIFIED,
    ParNumerator: 1,
    ParDenominator: 1,
    Profile: H264Profile.MAIN,
    Syntax: H264Syntax.DEFAULT,
    SceneChangeDetect: H264SceneChangeDetect.ENABLED,
    SpatialAq: H264SpatialAq.ENABLED,
    TemporalAq: H264TemporalAq.ENABLED,
    TimecodeInsertion: H264TimecodeInsertionBehavior.DISABLED,
};

const defaultAacSettings: Partial<AacSettings> = {
    InputType: AacInputType.NORMAL,
    CodingMode: AacCodingMode.CODING_MODE_2_0,
    RawFormat: AacRawFormat.NONE,
    Spec: AacSpec.MPEG4,
    Profile: AacProfile.LC,
    RateControlMode: AacRateControlMode.VBR,
    SampleRate: 48000,
};

export async function createChannel(
    roomId: string,
    vonageInputId: string,
    mp4InputId: string,
    loopingMp4InputId: string,
    mediaPackageId: string,
    fallbackSlateUrl: string | null
): Promise<MediaLiveChannel> {
    const destinationId = shortId();
    const video1080p30 = shortId();
    const audioHQDescriptorName = shortId();
    const video720p30 = shortId();
    const video360p30 = shortId();
    const audioLQDescriptorName = shortId();
    const mp4CaptionSelectorName = shortId();
    const mp4CaptionDescriptorName = shortId();
    const vonageInputAttachmentName = `${shortId()}-vonage`;
    const mp4InputAttachmentName = `${shortId()}-mp4`;
    const loopingMp4InputAttachmentName = `${shortId()}-looping`;

    const channel = await MediaLive.createChannel({
        Name: shortId(),
        Tags: { roomId, environment: process.env.AWS_PREFIX ?? "unknown" },
        ChannelClass: "SINGLE_PIPELINE",
        InputAttachments: [
            {
                InputAttachmentName: vonageInputAttachmentName,
                InputId: vonageInputId,
                InputSettings: {
                    CaptionSelectors: [
                        {
                            Name: mp4CaptionSelectorName,
                            LanguageCode: "eng",
                            SelectorSettings: {
                                EmbeddedSourceSettings: {
                                    Convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                    Source608ChannelNumber: 1,
                                    Scte20Detection: EmbeddedScte20Detection.OFF,
                                },
                            },
                        },
                    ],
                },
            },
            {
                InputAttachmentName: mp4InputAttachmentName,
                InputId: mp4InputId,
                InputSettings: {
                    CaptionSelectors: [
                        {
                            Name: mp4CaptionSelectorName,
                            LanguageCode: "eng",
                            SelectorSettings: {
                                EmbeddedSourceSettings: {
                                    Convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                    Source608ChannelNumber: 1,
                                    Scte20Detection: EmbeddedScte20Detection.OFF,
                                },
                            },
                        },
                    ],
                },
            },
            {
                InputAttachmentName: loopingMp4InputAttachmentName,
                InputId: loopingMp4InputId,
                InputSettings: {
                    SourceEndBehavior: InputSourceEndBehavior.LOOP,
                    CaptionSelectors: [
                        {
                            Name: mp4CaptionSelectorName,
                            LanguageCode: "eng",
                            SelectorSettings: {
                                EmbeddedSourceSettings: {
                                    Convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                    Source608ChannelNumber: 1,
                                    Scte20Detection: EmbeddedScte20Detection.OFF,
                                },
                            },
                        },
                    ],
                },
            },
        ],
        RoleArn: process.env.AWS_MEDIALIVE_SERVICE_ROLE_ARN,
        EncoderSettings: {
            FeatureActivations: {
                InputPrepareScheduleActions: FeatureActivationsInputPrepareScheduleActions.ENABLED,
            },
            ...(fallbackSlateUrl
                ? {
                      GlobalConfiguration: {
                          InputEndAction: GlobalConfigurationInputEndAction.NONE,
                          InputLossBehavior: {
                              BlackFrameMsec: 10000,
                              InputLossImageColor: "333333",
                              InputLossImageSlate: {
                                  Uri: fallbackSlateUrl,
                              },
                              RepeatFrameMsec: 1000,
                          },
                      },
                  }
                : {}),
            AudioDescriptions: [
                {
                    CodecSettings: {
                        AacSettings: {
                            ...defaultAacSettings,
                            VbrQuality: AacVbrQuality.HIGH,
                        },
                    },
                    AudioTypeControl: "FOLLOW_INPUT",
                    LanguageCodeControl: "FOLLOW_INPUT",
                    Name: audioHQDescriptorName,
                    AudioSelectorName: undefined,
                },
                {
                    CodecSettings: {
                        AacSettings: {
                            ...defaultAacSettings,
                            VbrQuality: AacVbrQuality.MEDIUM_HIGH,
                        },
                    },
                    AudioTypeControl: "FOLLOW_INPUT",
                    LanguageCodeControl: "FOLLOW_INPUT",
                    Name: audioLQDescriptorName,
                    AudioSelectorName: undefined,
                },
            ],
            OutputGroups: [
                {
                    Name: shortId(),
                    Outputs: [
                        {
                            OutputName: "1080p30",
                            VideoDescriptionName: video1080p30,
                            AudioDescriptionNames: [audioHQDescriptorName],
                            OutputSettings: {
                                MediaPackageOutputSettings: {},
                            },
                        },
                        {
                            OutputName: "720p30",
                            VideoDescriptionName: video720p30,
                            AudioDescriptionNames: [audioHQDescriptorName],
                            OutputSettings: {
                                MediaPackageOutputSettings: {},
                            },
                        },
                        {
                            OutputName: "360p30",
                            VideoDescriptionName: video360p30,
                            AudioDescriptionNames: [audioLQDescriptorName],
                            OutputSettings: {
                                MediaPackageOutputSettings: {},
                            },
                        },
                        {
                            OutputName: "captions",
                            CaptionDescriptionNames: [mp4CaptionDescriptorName],
                            OutputSettings: {
                                MediaPackageOutputSettings: {},
                            },
                        },
                    ],
                    OutputGroupSettings: {
                        MediaPackageGroupSettings: {
                            Destination: {
                                DestinationRefId: destinationId,
                            },
                        },
                    },
                },
            ],
            TimecodeConfig: { Source: "EMBEDDED" },
            VideoDescriptions: [
                {
                    CodecSettings: {
                        H264Settings: {
                            ...defaultH264Settings,
                            RateControlMode: H264RateControlMode.QVBR,
                            MaxBitrate: 3000000,
                            QvbrQualityLevel: 7,
                        },
                    },
                    Height: 1080,
                    Name: video1080p30,
                    RespondToAfd: VideoDescriptionRespondToAfd.PASSTHROUGH,
                    Sharpness: 50,
                    ScalingBehavior: VideoDescriptionScalingBehavior.DEFAULT,
                    Width: 1920,
                },
                {
                    CodecSettings: {
                        H264Settings: {
                            ...defaultH264Settings,
                            RateControlMode: H264RateControlMode.QVBR,
                            MaxBitrate: 3000000,
                            QvbrQualityLevel: 6,
                        },
                    },
                    Height: 720,
                    Name: video720p30,
                    RespondToAfd: VideoDescriptionRespondToAfd.PASSTHROUGH,
                    Sharpness: 50,
                    ScalingBehavior: VideoDescriptionScalingBehavior.DEFAULT,
                    Width: 1280,
                },
                {
                    CodecSettings: {
                        H264Settings: {
                            ...defaultH264Settings,
                            RateControlMode: H264RateControlMode.QVBR,
                            MaxBitrate: 2000000,
                            QvbrQualityLevel: 6,
                        },
                    },
                    Height: 360,
                    Name: video360p30,
                    RespondToAfd: VideoDescriptionRespondToAfd.PASSTHROUGH,
                    Sharpness: 50,
                    ScalingBehavior: VideoDescriptionScalingBehavior.DEFAULT,
                    Width: 480,
                },
            ],
            CaptionDescriptions: [
                {
                    CaptionSelectorName: mp4CaptionSelectorName,
                    Name: mp4CaptionDescriptorName,
                    DestinationSettings: {
                        WebvttDestinationSettings: {},
                    },
                    LanguageCode: "eng",
                    LanguageDescription: "English",
                },
            ],
        },
        InputSpecification: {
            Codec: "AVC",
            Resolution: "HD",
            MaximumBitrate: "MAX_20_MBPS",
        },
        Destinations: [
            {
                Id: destinationId,
                Settings: [],
                MediaPackageSettings: [{ ChannelId: mediaPackageId }],
            },
        ],
    });
    if (channel.Channel?.Id) {
        return {
            channelId: channel.Channel.Id,
            mp4InputAttachmentName,
            loopingMp4InputAttachmentName,
            vonageInputAttachmentName,
        };
    }
    throw new Error("Failed to create new Channel");
}
