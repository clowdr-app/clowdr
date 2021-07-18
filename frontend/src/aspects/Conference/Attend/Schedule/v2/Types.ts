import type { ScheduleV2_BaseEventFragment } from "../../../../../generated/graphql";

export interface ParsedEvent {
    event: ScheduleV2_BaseEventFragment;
    startTimeMs: number;
    endTimeMs: number;
}

export interface ScheduleProps {
    events: readonly ScheduleV2_BaseEventFragment[];
}

export interface EventCellDescriptor {
    parsedEvent: ParsedEvent;
    preceedingEventId: string | undefined;
    markerMs: number;
    markerSpan: number;
    isSecondaryCell: boolean;
}
