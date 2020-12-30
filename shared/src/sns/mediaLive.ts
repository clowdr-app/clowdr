export type MediaLiveEvent =
    | MediaLiveEventChannelInputChange
    | MediaLiveEventChannelStateChange
    | MediaLiveEventChannelAlert;

interface MediaLiveEventChannelStateChange extends MediaLiveEventBase {
    "detail-type": "MediaLive Channel State Change";
    detail: MediaLiveEventChannelStateChangeDetail;
}

interface MediaLiveEventChannelStateChangeDetail {
    pipelines_running_count: number;
    state: "RUNNING" | "STOPPED" | "STOPPING" | "CREATED" | "DELETED" | "STARTING";
    pipeline?: string;
    channel_arn: string;
    message: string;
}

interface MediaLiveEventChannelInputChange extends MediaLiveEventBase {
    "detail-type": "MediaLive Channel Input Change";
    detail: MediaLiveEventChannelInputChangeDetail;
}

interface MediaLiveEventChannelAlert extends MediaLiveEventBase {
    "detail-type": "MediaLive Channel Alert";
    detail: any;
}

interface MediaLiveEventChannelInputChangeDetail {
    active_input_switch_action_name: string;
    active_input_attachment_name: string;
    pipeline: string;
    message: string;
    channel_arn: string;
}

export interface MediaLiveEventBase {
    version: string;
    id: string;
    "detail-type": string;
    source: "aws.medialive";
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: any;
}
