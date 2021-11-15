export type SourceBlob = EventRecordingSource;

export enum SourceType {
    EventRecording = "EVENT_RECORDING",
}

export interface BaseSource<T extends SourceType> {
    source: T;
}

export interface EventRecordingSource extends BaseSource<SourceType.EventRecording> {
    eventId: string;
    startTimeMillis: number;
    durationSeconds: number;
}
