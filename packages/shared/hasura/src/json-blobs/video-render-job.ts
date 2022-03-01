import type { MP4Input } from "./broadcast-element";

export type VideoRenderJobDataBlob = TitleRenderJobDataBlob | BroadcastRenderJobDataBlob;

export interface TitleRenderJobDataBlob {
    type: "TitleRenderJob";
    name: string;
    authors: string[];
    openShotProjectId: number;
    openShotExportId?: number;
    webhookKey?: string;
    broadcastContentItemData?: MP4Input;
}

export interface BroadcastRenderJobDataBlob {
    type: "BroadcastRenderJob";
    videoS3Url: string;
    subtitlesS3Url?: string;
    elasticTranscoderJobId?: string;
    broadcastContentItemData?: MP4Input;
}
