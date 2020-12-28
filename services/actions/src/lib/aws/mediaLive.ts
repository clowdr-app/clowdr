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
        Tags: { roomId },
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
        Tags: { roomId },
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
    vonageInputAttachmentName: string;
}

export async function createChannel(
    roomId: string,
    vonageInputId: string,
    mp4InputId: string,
    mediaPackageId: string
): Promise<MediaLiveChannel> {
    const destinationId = shortId();
    const videoDescriptionName = shortId();
    const audioDescriptionName = shortId();
    const vonageInputAttachmentName = `${shortId()}-vonage`;
    const mp4InputAttachmentName = `${shortId()}-mp4`;

    const channel = await MediaLive.createChannel({
        Name: shortId(),
        Tags: { roomId },
        ChannelClass: "SINGLE_PIPELINE",
        InputAttachments: [
            {
                InputAttachmentName: vonageInputAttachmentName,
                InputId: vonageInputId,
            },
            {
                InputAttachmentName: mp4InputAttachmentName,
                InputId: mp4InputId,
            },
        ],
        RoleArn: process.env.AWS_MEDIALIVE_SERVICE_ROLE_ARN,
        EncoderSettings: {
            AudioDescriptions: [
                {
                    CodecSettings: {
                        AacSettings: {
                            InputType: "NORMAL",
                            Bitrate: 192000,
                            CodingMode: "CODING_MODE_2_0",
                            RawFormat: "NONE",
                            Spec: "MPEG4",
                            Profile: "LC",
                            RateControlMode: "CBR",
                            SampleRate: 48000,
                        },
                    },
                    AudioTypeControl: "FOLLOW_INPUT",
                    LanguageCodeControl: "FOLLOW_INPUT",
                    Name: audioDescriptionName,
                    AudioSelectorName: undefined,
                },
            ],
            OutputGroups: [
                {
                    Name: shortId(),
                    Outputs: [
                        {
                            OutputName: "1080p30",
                            VideoDescriptionName: videoDescriptionName,
                            AudioDescriptionNames: [audioDescriptionName],
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
                            AfdSignaling: "NONE",
                            ColorMetadata: "INSERT",
                            AdaptiveQuantization: "MEDIUM",
                            EntropyEncoding: "CABAC",
                            FlickerAq: "ENABLED",
                            ForceFieldPictures: "DISABLED",
                            FramerateControl: "SPECIFIED",
                            FramerateNumerator: 30,
                            FramerateDenominator: 1,
                            GopBReference: "DISABLED",
                            GopClosedCadence: 1,
                            GopNumBFrames: 2,
                            GopSize: 90,
                            GopSizeUnits: "FRAMES",
                            SubgopLength: "FIXED",
                            ScanType: "PROGRESSIVE",
                            Level: "H264_LEVEL_AUTO",
                            LookAheadRateControl: "MEDIUM",
                            NumRefFrames: 1,
                            ParControl: "SPECIFIED",
                            ParNumerator: 1,
                            ParDenominator: 1,
                            Profile: "MAIN",
                            RateControlMode: "CBR",
                            Syntax: "DEFAULT",
                            SceneChangeDetect: "ENABLED",
                            SpatialAq: "ENABLED",
                            TemporalAq: "ENABLED",
                            TimecodeInsertion: "DISABLED",
                        },
                    },
                    Height: 1080,
                    Name: videoDescriptionName,
                    RespondToAfd: "NONE",
                    Sharpness: 50,
                    ScalingBehavior: "DEFAULT",
                    Width: 1920,
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
            vonageInputAttachmentName,
        };
    }
    throw new Error("Failed to create new Channel");
}
