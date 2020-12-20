export enum TranscodeMode {
    PREVIEW = "preview",
    BROADCAST = "broadcast",
}

export interface MediaConvertEvent {
    version: string;
    id: string;
    "detail-type": string;
    source: "aws.mediaconvert";
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: MediaConvertEventDetail;
}

type MediaConvertEventDetail =
    | MediaConvertEvent_PROGRESSING
    | MediaConvertEventDetail_INPUT_INFORMATION
    | MediaConvertEventDetail_COMPLETE
    | MediaConvertEventDetail_ERROR
    | MediaConvertEventDetail_OTHER;

interface MediaConvertEvent_PROGRESSING extends MediaConvertEventDetailsBase {
    status: "PROGRESSING";
}

interface MediaConvertEventDetail_INPUT_INFORMATION extends MediaConvertEventDetailsBase {
    inputDetails: InputDetail[];
    status: "INPUT_INFORMATION";
}

interface MediaConvertEventDetail_COMPLETE extends MediaConvertEventDetailsBase {
    outputGroupDetails: OutputGroupDetail[];
    status: "COMPLETE";
}

interface MediaConvertEventDetail_ERROR extends MediaConvertEventDetailsBase {
    status: "ERROR";
    errorCode: number;
    errorMessage: string;
}

interface MediaConvertEventDetail_OTHER extends MediaConvertEventDetailsBase {
    status: "STATUS_UPDATE" | "NEW_WARNING" | "QUEUE_HOP";
}

interface MediaConvertEventDetailsBase {
    timestamp: number;
    accountId: string;
    queue: string;
    jobId: string;
    status: string;
    userMetadata: {
        [key: string]: unknown;
        contentItemId: string;
        mode: TranscodeMode;
    };
}

interface InputDetail {
    audio: InputDetailAudio[];
    id: number;
    uri: string;
    video: InputDetailVideo[];
}

interface InputDetailAudio {
    channels: number;
    codec: string;
    language: string;
    sampleRate: number;
    streamId: number;
}

interface InputDetailVideo {
    bitDepth: number;
    codec: string;
    colorFormat: string;
    fourCC: string;
    frameRate: number;
    height: number;
    interlaceMode: string;
    sar: string;
    standard: string;
    streamId: number;
    width: number;
}

interface OutputGroupDetail {
    outputDetails: OutputDetail[];
    type: string;
}

interface OutputDetail {
    outputFilePaths: string[];
    durationInMs: number;
    videoDetails: { widthInPx: number; heightInPx: number };
}
