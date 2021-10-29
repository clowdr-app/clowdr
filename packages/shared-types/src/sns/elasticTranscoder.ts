export interface ElasticTranscoderEvent {
    version: string;
    state: "PROGRESSING" | "ERROR" | "COMPLETED" | "WARNING";
    jobId: string;
    pipelineId: string;
    input: {
        key: string;
    };
    inputCount: number;
    outputs: [ElasticTranscoderEventOutput];
    userMetadata: {
        videoRenderJobId: string;
        bucket: string;
    };
    errorCode?: number;
    messageDetails?: string;
}

interface ElasticTranscoderEventOutput {
    id: string;
    presetId: string;
    key: string;
    status: string;
    statusDetail?: string;
    errorCode?: number;
    duration?: number; // COMPLETED only
    width?: number; // COMPLETED only
    height?: number; // COMPLETED only
}
