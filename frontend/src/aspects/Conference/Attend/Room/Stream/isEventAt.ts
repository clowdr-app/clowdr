import type { Room_EventSummaryFragment } from "../../../../../generated/graphql";

export function isEventNow(now: number, event: Room_EventSummaryFragment): boolean {
    const scheduledStartTime = Date.parse(event.scheduledStartTime) - 3000;
    const scheduledEndTime = Date.parse(event.scheduledEndTime);
    return now >= scheduledStartTime && now <= scheduledEndTime;
}

export function isEventSoon(now: number, event: Room_EventSummaryFragment): boolean {
    const scheduledStartTime = Date.parse(event.scheduledStartTime);
    return now >= scheduledStartTime - 20 * 60 * 1000 - 5000 && now <= scheduledStartTime;
}
