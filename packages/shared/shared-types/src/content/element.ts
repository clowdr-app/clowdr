export type SourceBlob = EventRecordingSource;

/**
 * Source information is used in Postgres triggers to always permit
 * certain sources to be inserted regardless of quota restrictions.
 */
export enum SourceType {
    /**
     * This Source type is used in Postgres triggers to always permit
     * elements of this source to be inserted regardless of quota restrictions.
     */
    EventRecording = "EVENT_RECORDING",
    /**
     * This Source type is used in Postgres triggers to always permit
     * elements of this source to be inserted regardless of quota restrictions.
     */
    CombineVideos = "COMBINE_VIDEOS",
}

export interface BaseSource<T extends SourceType> {
    source: T;
}

export interface EventRecordingSource extends BaseSource<SourceType.EventRecording> {
    eventId: string;
    startTimeMillis: number;
    durationSeconds: number;
}
