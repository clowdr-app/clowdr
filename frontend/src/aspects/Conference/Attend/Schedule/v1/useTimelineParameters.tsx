import { DateTime, Zone } from "luxon";
import React, { createContext, useContext, useMemo } from "react";

export interface TimelineParameters {
    earliestMs: number;
    latestMs: number;

    fullTimeSpanSeconds: number;
    timezone: Zone;
}

const defaultTimelineParams: TimelineParameters = {
    earliestMs: 0,
    latestMs: 1000,
    fullTimeSpanSeconds: 1000,
    timezone: DateTime.local().zone,
};
const TimelineContext = createContext<TimelineParameters>(defaultTimelineParams);

export function TimelineParameters({
    children,
    earliestEventStart,
    latestEventEnd,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    defaultStartTime?: number;
    earliestEventStart: number;
    latestEventEnd: number;
}): JSX.Element {
    const timezone = DateTime.local().zone; // E.g. 8 hours behind (PST): FixedOffsetZone.instance(-8 * 60)
    // const timezone = FixedOffsetZone.instance(-1 * 60);
    const earliestMs = DateTime.fromMillis(earliestEventStart).setZone(timezone).toMillis();
    // .startOf("hour")
    const latestMs = DateTime.fromMillis(latestEventEnd).setZone(timezone).toMillis();
    // .endOf("hour")
    const ctx = useMemo(
        () => ({
            earliestMs,
            latestMs,
            fullTimeSpanSeconds: Math.max(1000, latestMs - earliestMs) / 1000,
            timezone,
        }),
        [earliestMs, latestMs, timezone]
    );

    return <TimelineContext.Provider value={ctx}>{children}</TimelineContext.Provider>;
}

export default function useTimelineParameters(): TimelineParameters {
    return useContext(TimelineContext);
}
