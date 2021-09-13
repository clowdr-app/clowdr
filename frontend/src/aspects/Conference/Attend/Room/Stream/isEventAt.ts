import type { Room_EventSummaryFragment } from "../../../../../generated/graphql";

export function isEventNow(now: number, event: Room_EventSummaryFragment): boolean {
    const startTime = Date.parse(event.startTime) - 3000;
    const endTime = Date.parse(event.endTime);
    return now >= startTime && now <= endTime;
}

export function isEventSoon(now: number, event: Room_EventSummaryFragment): boolean {
    const startTime = Date.parse(event.startTime);
    return now >= startTime - 20 * 60 * 1000 - 5000 && now <= startTime;
}
