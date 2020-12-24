type VideoRenderJobDataBlob = TitleRenderJobDataBlob | BroadcastRenderJobDataBlob;

interface TitleRenderJobDataBlob {
    type: "TitleRenderJob";
    name: string;
    authors: string[];
    openShotProjectId: number;
    openShotExportId?: number;
    webhookKey?: string;
    broadcastContentItemData?: MP4Input;
}

interface BroadcastRenderJobDataBlob {
    type: "BroadcastRenderJob";
    videoS3Url: string;
    subtitlesS3Url?: string;
    elasticTranscoderJobId?: string;
    broadcastContentItemData?: MP4Input;
}
