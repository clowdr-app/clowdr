type VideoRenderJobData = TitleRenderJobData | BroadcastRenderJobData;

interface TitleRenderJobData {
    type: "TitleRenderJob";
    title: string;
    authors: string[];
    openShotProjectId: number;
    openShotExportId?: number;
}

interface BroadcastRenderJobData {
    type: "BroadcastRenderJob";
    videoS3Url: string;
    subtitlesS3Url?: string;
}
