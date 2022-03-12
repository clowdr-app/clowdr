import type { ScheduleV2_LightweightEventFragment } from "../../../../../generated/graphql";

export interface ParsedEvent {
    lwEvent: ScheduleV2_LightweightEventFragment;
    scheduledStartTimeMs: number;
    endTimeMs: number;
}

export interface EventCellDescriptor {
    parsedEvent: ParsedEvent;
    preceedingEventId: string | undefined;
    markerMs: number;
    markerSpan: number;
    isSecondaryCell: boolean;
}
