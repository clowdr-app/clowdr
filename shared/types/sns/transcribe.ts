export type TranscribeEvent = TranscribeEventJobStatus | TranscribeEventLanguageIdentification;

interface TranscribeEventJobStatus extends TranscribeEventBase {
    "detail-type": "Transcribe Job State Change";
    detail: TranscribeEventJobStatusDetail;
}

interface TranscribeEventJobStatusDetail {
    TranscriptionJobName: string;
    TranscriptionJobStatus: "COMPLETED" | "FAILED";
}

interface TranscribeEventLanguageIdentification extends TranscribeEventBase {
    "detail-type": "Language Identification State Change";
    detail: TranscribeEventLanguageIdentificationDetail;
}

interface TranscribeEventLanguageIdentificationDetail {
    JobType: string;
    JobName: string;
    LanguageIdentificationStatus: "COMPLETED" | "FAILED";
}

export interface TranscribeEventBase {
    version: string;
    id: string;
    "detail-type": string;
    source: "aws.transcribe";
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: any;
}
