type VideoRenderJobDataBlob = TitleRenderJobDataBlob | BroadcastRenderJobDataBlob;

interface TitleRenderJobDataBlob {
    type: "TitleRenderJob";
    name: string;
    authors: string[];
    openShotProjectId: number;
    openShotExportId?: number;
    webhookKey?: string;
}

interface BroadcastRenderJobDataBlob {
    type: "BroadcastRenderJob";
    videoS3Url: string;
    subtitlesS3Url?: string;
}
