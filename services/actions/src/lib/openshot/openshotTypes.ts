export interface Fraction {
    den: number;
    num: number;
}

export interface Points {
    Points: Point[];
}

interface Coordinate {
    Y: number;
    X: number;
}

interface Point {
    handle_type?: 0;
    handle_left?: Coordinate;
    handle_right?: Coordinate;
    co: Coordinate;
    interpolation: number;
}

export interface Export {
    url: string;
    id: number;
    output: string | null;
    export_type: string;
    video_format: string;
    video_codec: string;
    video_bitrate: number;
    audio_codec: string;
    audio_bitrate: number;
    start_frame: number;
    end_frame: number;
    actions: string[];
    project: string;
    webhook: string;
    json: ExportDetails | any;
    progress: number;
    status: string;
    date_created: string;
    date_updated: string;
}

export interface ExportDetails {
    bucket?: string;
    url?: string;
    acl?: string;
    webhookKey?: string;
}

export type ExportWebhookData = Export & {
    json: ExportWebhookDetails;
};

interface ExportWebhookDetails {
    status: "success" | "failed";
    webhook?: string;
    hostname: string;
    detail?: string;
    webhookKey?: string;
}
