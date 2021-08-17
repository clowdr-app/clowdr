import * as cloudfront from "@aws-cdk/aws-cloudfront";
import { CachePolicy, PriceClass, ViewerProtocolPolicy } from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as medialive from "@aws-cdk/aws-medialive";
import * as mediapackage from "@aws-cdk/aws-mediapackage";
import * as cdk from "@aws-cdk/core";
import {
    AacCodingMode,
    AacInputType,
    AacProfile,
    AacRateControlMode,
    AacRawFormat,
    AacSpec,
    AacVbrQuality,
    AfdSignaling,
    AudioDescriptionAudioTypeControl,
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
    H264SpatialAq,
    H264SubGopLength,
    H264Syntax,
    H264TemporalAq,
    H264TimecodeInsertionBehavior,
    InputCodec,
    InputMaximumBitrate,
    InputResolution,
    InputSourceEndBehavior,
    TimecodeConfigSource,
    VideoDescriptionRespondToAfd,
    VideoDescriptionScalingBehavior,
} from "@aws-sdk/client-medialive";
import { AdMarkers, Origination, PlaylistType, StreamOrder } from "@aws-sdk/client-mediapackage";
import { toSafeTagValue } from "../../utils/string";

export interface ChannelStackDescription {
    rtmpAInputUri: string;
    rtmpAInputId: string;
    rtmpBInputUri: string;
    rtmpBInputId: string;
    mp4InputId: string;
    loopingMp4InputId: string;
    mp4InputAttachmentName: string;
    loopingMp4InputAttachmentName: string;
    rtmpAInputAttachmentName: string;
    rtmpBInputAttachmentName: string;
    mediaLiveChannelId: string;
    mediaPackageChannelId: string;
    cloudFrontDistributionId: string;
    cloudFrontDomain: string;
    endpointUri: string;
}

export interface ChannelStackProps extends cdk.StackProps {
    inputSecurityGroupId: string;
    roomId: string;
    roomName: string;
    conferenceId: string;
    awsPrefix: string;
    mediaLiveServiceRoleArn: string;
    awsContentBucketId: string;
    generateId(): string;
}

const defaultH264Settings: Partial<medialive.CfnChannel.H264SettingsProperty> = {
    afdSignaling: AfdSignaling.AUTO,
    colorMetadata: H264ColorMetadata.INSERT,
    adaptiveQuantization: H264AdaptiveQuantization.MEDIUM,
    entropyEncoding: H264EntropyEncoding.CABAC,
    flickerAq: H264FlickerAq.ENABLED,
    forceFieldPictures: H264ForceFieldPictures.DISABLED,
    framerateControl: H264FramerateControl.SPECIFIED,
    framerateNumerator: 30,
    framerateDenominator: 1,
    gopBReference: H264GopBReference.DISABLED,
    gopClosedCadence: 1,
    gopNumBFrames: 2,
    gopSize: 1,
    gopSizeUnits: H264GopSizeUnits.SECONDS,
    subgopLength: H264SubGopLength.FIXED,
    scanType: H264ScanType.PROGRESSIVE,
    level: H264Level.H264_LEVEL_AUTO,
    lookAheadRateControl: H264LookAheadRateControl.MEDIUM,
    numRefFrames: 1,
    parControl: H264ParControl.SPECIFIED,
    parNumerator: 1,
    parDenominator: 1,
    profile: H264Profile.MAIN,
    syntax: H264Syntax.DEFAULT,
    sceneChangeDetect: H264SceneChangeDetect.ENABLED,
    spatialAq: H264SpatialAq.ENABLED,
    temporalAq: H264TemporalAq.ENABLED,
    timecodeInsertion: H264TimecodeInsertionBehavior.DISABLED,
};

const defaultAacSettings: Partial<medialive.CfnChannel.AacSettingsProperty> = {
    inputType: AacInputType.NORMAL,
    codingMode: AacCodingMode.CODING_MODE_2_0,
    rawFormat: AacRawFormat.NONE,
    spec: AacSpec.MPEG4,
    profile: AacProfile.LC,
    rateControlMode: AacRateControlMode.VBR,
    sampleRate: 48000,
};

export class ChannelStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ChannelStackProps) {
        super(scope, id, props);

        const rtmpAInput = this.createRtmpInput("rtmpAInput", props);
        const rtmpBInput = this.createRtmpInput("rtmpBInput", props);
        const mp4Input = this.createMp4Input("mp4Input", props);
        const loopingMp4Input = this.createMp4Input("loopingMp4Input", props);

        const mediaPackageChannel = this.createMediaPackageChannel("mediaPackageChannel", props);
        const originEndpoint = this.createOriginEndpoint("originEndpoint", mediaPackageChannel.ref, props);
        const distribution = this.createCloudFrontDistribution("cloudfrontDistribution", originEndpoint.attrUrl, props);

        const mediaLiveChannel = this.createMediaLiveChannel(
            props.generateId(),
            rtmpAInput.ref,
            rtmpBInput.ref,
            mp4Input.ref,
            loopingMp4Input.ref,
            mediaPackageChannel.id,
            props
        );

        new cdk.CfnOutput(this, "RtmpAInputUri", {
            value: cdk.Fn.select(0, rtmpAInput.attrDestinations),
        });

        new cdk.CfnOutput(this, "RtmpAInputId", {
            value: rtmpAInput.ref,
        });

        new cdk.CfnOutput(this, "RtmpBInputUri", {
            value: cdk.Fn.select(0, rtmpBInput.attrDestinations),
        });

        new cdk.CfnOutput(this, "RtmpBInputId", {
            value: rtmpBInput.ref,
        });

        new cdk.CfnOutput(this, "Mp4InputId", {
            value: mp4Input.ref,
        });

        new cdk.CfnOutput(this, "LoopingMp4InputId", {
            value: loopingMp4Input.ref,
        });

        new cdk.CfnOutput(this, "Mp4InputAttachmentName", {
            value: mediaLiveChannel.mp4InputAttachmentName,
        });

        new cdk.CfnOutput(this, "LoopingMp4InputAttachmentName", {
            value: mediaLiveChannel.loopingMp4InputAttachmentName,
        });

        new cdk.CfnOutput(this, "RtmpAInputAttachmentName", {
            value: mediaLiveChannel.rtmpAInputAttachmentName,
        });

        new cdk.CfnOutput(this, "RtmpBInputAttachmentName", {
            value: mediaLiveChannel.rtmpBInputAttachmentName,
        });

        new cdk.CfnOutput(this, "MediaLiveChannelId", {
            value: mediaLiveChannel.channel.ref,
        });

        new cdk.CfnOutput(this, "MediaPackageChannelId", {
            value: mediaPackageChannel.id,
        });

        new cdk.CfnOutput(this, "CloudFrontDistributionId", {
            value: distribution.distributionId,
        });

        new cdk.CfnOutput(this, "CloudFrontDomain", {
            value: distribution.distributionDomainName,
        });

        new cdk.CfnOutput(this, "EndpointUri", {
            value: originEndpoint.attrUrl,
        });
    }

    createRtmpInput(name: string, props: ChannelStackProps): medialive.CfnInput {
        return new medialive.CfnInput(this, name, {
            destinations: [
                {
                    streamName: name,
                },
            ],
            tags: {
                roomId: toSafeTagValue(props.roomId),
                roomName: toSafeTagValue(props.roomName),
                conferenceId: toSafeTagValue(props.conferenceId),
                environment: toSafeTagValue(props.awsPrefix ?? "unknown"),
            },
            name: props.generateId(),
            type: "RTMP_PUSH",
            inputSecurityGroups: [props.inputSecurityGroupId],
        });
    }

    createMp4Input(name: string, props: ChannelStackProps): medialive.CfnInput {
        return new medialive.CfnInput(this, name, {
            tags: {
                roomId: toSafeTagValue(props.roomId),
                roomName: toSafeTagValue(props.roomName),
                conferenceId: toSafeTagValue(props.conferenceId),
                environment: toSafeTagValue(props.awsPrefix ?? "unknown"),
            },
            name: props.generateId(),
            type: "MP4_FILE",
            sources: [
                {
                    url: `s3ssl://${props.awsContentBucketId}/$urlPath$`,
                },
            ],
            inputSecurityGroups: [props.inputSecurityGroupId],
        });
    }

    createMediaPackageChannel(name: string, props: ChannelStackProps): mediapackage.CfnChannel {
        const mediaPackageChannelId = props.generateId();

        return new mediapackage.CfnChannel(this, name, {
            id: mediaPackageChannelId,
            tags: [
                {
                    key: "roomId",
                    value: toSafeTagValue(props.roomId),
                },
                {
                    key: "environment",
                    value: toSafeTagValue(props.awsPrefix),
                },
                {
                    key: "roomName",
                    value: toSafeTagValue(props.roomName),
                },
                {
                    key: "conferenceId",
                    value: toSafeTagValue(props.conferenceId),
                },
            ],
            description: `MediaPackage channel for room ${props.roomId}`,
        });
    }

    createOriginEndpoint(
        name: string,
        mediaPackageChannelId: string,
        props: ChannelStackProps
    ): mediapackage.CfnOriginEndpoint {
        const originEndpointId = props.generateId();

        return new mediapackage.CfnOriginEndpoint(this, name, {
            id: originEndpointId,
            channelId: mediaPackageChannelId,
            tags: [
                {
                    key: "roomId",
                    value: toSafeTagValue(props.roomId),
                },
                {
                    key: "environment",
                    value: toSafeTagValue(props.awsPrefix),
                },
                {
                    key: "roomName",
                    value: toSafeTagValue(props.roomName),
                },
                {
                    key: "conferenceId",
                    value: toSafeTagValue(props.conferenceId),
                },
            ],
            hlsPackage: {
                adMarkers: AdMarkers.NONE,
                includeIframeOnlyStream: false,
                playlistType: PlaylistType.EVENT,
                playlistWindowSeconds: 60,
                programDateTimeIntervalSeconds: 10,
                segmentDurationSeconds: 5,
                streamSelection: {
                    maxVideoBitsPerSecond: 2147483647,
                    minVideoBitsPerSecond: 0,
                    streamOrder: StreamOrder.ORIGINAL,
                },
                useAudioRenditionGroup: false,
            },
            origination: Origination.ALLOW,
            startoverWindowSeconds: 86400,
            timeDelaySeconds: 0,
        });
    }

    createMediaLiveChannel(
        name: string,
        rtmpAInputId: string,
        rtmpBInputId: string,
        mp4InputId: string,
        loopingMp4InputId: string,
        mediaPackageChannelId: string,
        props: ChannelStackProps
    ): {
        channel: medialive.CfnChannel;
        rtmpAInputAttachmentName: string;
        rtmpBInputAttachmentName: string;
        mp4InputAttachmentName: string;
        loopingMp4InputAttachmentName: string;
    } {
        const rtmpAInputAttachmentName = `${props.generateId()}-rtmpA`;
        const rtmpBInputAttachmentName = `${props.generateId()}-rtmpB`;
        const mp4InputAttachmentName = `${props.generateId()}-mp4`;
        const loopingMp4InputAttachmentName = `${props.generateId()}-looping`;

        const captionSelectorName = props.generateId();
        const captionDescriptorName = props.generateId();

        const audioHQDescriptorName = props.generateId();
        const audioLQDescriptorName = props.generateId();

        const video1080p30 = props.generateId();
        const video720p30 = props.generateId();
        const video480p30 = props.generateId();

        const destinationId = props.generateId();

        const channel = new medialive.CfnChannel(this, name, {
            name,
            tags: {
                roomId: toSafeTagValue(props.roomId),
                roomName: toSafeTagValue(props.roomName),
                conferenceId: toSafeTagValue(props.conferenceId),
                environment: toSafeTagValue(props.awsPrefix ?? "unknown"),
            },
            channelClass: "SINGLE_PIPELINE",
            inputAttachments: [
                {
                    inputAttachmentName: rtmpAInputAttachmentName,
                    inputId: rtmpAInputId,
                    inputSettings: {
                        captionSelectors: [
                            {
                                name: captionSelectorName,
                                languageCode: "eng",
                                selectorSettings: {
                                    embeddedSourceSettings: {
                                        convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                        source608ChannelNumber: 1,
                                        scte20Detection: EmbeddedScte20Detection.OFF,
                                    },
                                },
                            },
                        ],
                    },
                },
                {
                    inputAttachmentName: rtmpBInputAttachmentName,
                    inputId: rtmpBInputId,
                    inputSettings: {
                        captionSelectors: [
                            {
                                name: captionSelectorName,
                                languageCode: "eng",
                                selectorSettings: {
                                    embeddedSourceSettings: {
                                        convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                        source608ChannelNumber: 1,
                                        scte20Detection: EmbeddedScte20Detection.OFF,
                                    },
                                },
                            },
                        ],
                    },
                },
                {
                    inputAttachmentName: mp4InputAttachmentName,
                    inputId: mp4InputId,
                    inputSettings: {
                        captionSelectors: [
                            {
                                name: captionSelectorName,
                                languageCode: "eng",
                                selectorSettings: {
                                    embeddedSourceSettings: {
                                        convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                        source608ChannelNumber: 1,
                                        scte20Detection: EmbeddedScte20Detection.OFF,
                                    },
                                },
                            },
                        ],
                    },
                },
                {
                    inputAttachmentName: loopingMp4InputAttachmentName,
                    inputId: loopingMp4InputId,
                    inputSettings: {
                        sourceEndBehavior: InputSourceEndBehavior.LOOP,
                        captionSelectors: [
                            {
                                name: captionSelectorName,
                                languageCode: "eng",
                                selectorSettings: {
                                    embeddedSourceSettings: {
                                        convert608To708: EmbeddedConvert608To708.UPCONVERT,
                                        source608ChannelNumber: 1,
                                        scte20Detection: EmbeddedScte20Detection.OFF,
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
            roleArn: props.mediaLiveServiceRoleArn,
            encoderSettings: {
                featureActivations: {
                    inputPrepareScheduleActions: FeatureActivationsInputPrepareScheduleActions.ENABLED,
                },
                globalConfiguration: {
                    inputEndAction: GlobalConfigurationInputEndAction.NONE,
                    inputLossBehavior: {
                        blackFrameMsec: 10000,
                        inputLossImageColor: "333333",
                        // todo: inputloss image slate
                        repeatFrameMsec: 1000,
                    },
                },
                audioDescriptions: [
                    {
                        codecSettings: {
                            aacSettings: {
                                ...defaultAacSettings,
                                vbrQuality: AacVbrQuality.HIGH,
                            },
                        },
                        audioTypeControl: AudioDescriptionAudioTypeControl.FOLLOW_INPUT,
                        languageCodeControl: AudioDescriptionAudioTypeControl.FOLLOW_INPUT,
                        name: audioHQDescriptorName,
                        audioSelectorName: undefined,
                    },
                    {
                        codecSettings: {
                            aacSettings: {
                                ...defaultAacSettings,
                                vbrQuality: AacVbrQuality.MEDIUM_HIGH,
                            },
                        },
                        audioTypeControl: AudioDescriptionAudioTypeControl.FOLLOW_INPUT,
                        languageCodeControl: AudioDescriptionAudioTypeControl.FOLLOW_INPUT,
                        name: audioLQDescriptorName,
                        audioSelectorName: undefined,
                    },
                ],
                outputGroups: [
                    {
                        name: props.generateId(),
                        outputs: [
                            {
                                outputName: "1080p30",
                                videoDescriptionName: video1080p30,
                                audioDescriptionNames: [audioHQDescriptorName],
                                outputSettings: {
                                    mediaPackageOutputSettings: {},
                                },
                            },
                            {
                                outputName: "720p30",
                                videoDescriptionName: video720p30,
                                audioDescriptionNames: [audioHQDescriptorName],
                                outputSettings: {
                                    mediaPackageOutputSettings: {},
                                },
                            },
                            {
                                outputName: "480p30",
                                videoDescriptionName: video480p30,
                                audioDescriptionNames: [audioLQDescriptorName],
                                outputSettings: {
                                    mediaPackageOutputSettings: {},
                                },
                            },
                            {
                                outputName: "captions",
                                captionDescriptionNames: [captionDescriptorName],
                                outputSettings: {
                                    mediaPackageOutputSettings: {},
                                },
                            },
                        ],
                        outputGroupSettings: {
                            mediaPackageGroupSettings: {
                                destination: {
                                    destinationRefId: destinationId,
                                },
                            },
                        },
                    },
                ],
                timecodeConfig: { source: TimecodeConfigSource.SYSTEMCLOCK },
                videoDescriptions: [
                    {
                        codecSettings: {
                            h264Settings: {
                                ...defaultH264Settings,
                                rateControlMode: H264RateControlMode.QVBR,
                                maxBitrate: 3000000,
                                qvbrQualityLevel: 7,
                            },
                        },
                        height: 1080,
                        name: video1080p30,
                        respondToAfd: VideoDescriptionRespondToAfd.PASSTHROUGH,
                        sharpness: 50,
                        scalingBehavior: VideoDescriptionScalingBehavior.DEFAULT,
                        width: 1920,
                    },
                    {
                        codecSettings: {
                            h264Settings: {
                                ...defaultH264Settings,
                                rateControlMode: H264RateControlMode.QVBR,
                                maxBitrate: 2500000,
                                qvbrQualityLevel: 7,
                            },
                        },
                        height: 720,
                        name: video720p30,
                        respondToAfd: VideoDescriptionRespondToAfd.PASSTHROUGH,
                        sharpness: 50,
                        scalingBehavior: VideoDescriptionScalingBehavior.DEFAULT,
                        width: 1280,
                    },
                    {
                        codecSettings: {
                            h264Settings: {
                                ...defaultH264Settings,
                                rateControlMode: H264RateControlMode.QVBR,
                                maxBitrate: 2000000,
                                qvbrQualityLevel: 6,
                            },
                        },
                        height: 480,
                        name: video480p30,
                        respondToAfd: VideoDescriptionRespondToAfd.PASSTHROUGH,
                        sharpness: 50,
                        scalingBehavior: VideoDescriptionScalingBehavior.DEFAULT,
                        width: 854,
                    },
                ],
                captionDescriptions: [
                    {
                        captionSelectorName: captionSelectorName,
                        name: captionDescriptorName,
                        destinationSettings: {
                            webvttDestinationSettings: {},
                        },
                        languageCode: "eng",
                        languageDescription: "English",
                    },
                ],
            },
            inputSpecification: {
                codec: InputCodec.AVC,
                resolution: InputResolution.HD,
                maximumBitrate: InputMaximumBitrate.MAX_10_MBPS,
            },
            destinations: [
                {
                    id: destinationId,
                    settings: [],
                    mediaPackageSettings: [{ channelId: mediaPackageChannelId }],
                },
            ],
        });

        return {
            channel,
            rtmpAInputAttachmentName,
            rtmpBInputAttachmentName,
            mp4InputAttachmentName,
            loopingMp4InputAttachmentName,
        };
    }

    createCloudFrontDistribution(
        name: string,
        originEndpointUri: string,
        props: ChannelStackProps
    ): cloudfront.Distribution {
        const originEndpointDomain = cdk.Fn.parseDomainName(originEndpointUri);
        return new cloudfront.Distribution(this, name, {
            comment: `CloudFront distribution for room ${props.roomId}`,
            defaultBehavior: {
                origin: new origins.HttpOrigin(originEndpointDomain),
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
            },
            enabled: true,
            priceClass: PriceClass.PRICE_CLASS_100,
        });
    }
}
