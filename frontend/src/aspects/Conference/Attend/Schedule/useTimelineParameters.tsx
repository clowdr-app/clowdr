import { DateTime, Zone } from "luxon";
import React, { createContext, useContext } from "react";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";

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
    const earliestMs = roundDownToNearest(earliestEventStart, 60 * 60 * 1000);
    const latestMs = roundUpToNearest(latestEventEnd, 60 * 60 * 1000);
    return (
        <TimelineContext.Provider
            value={{
                earliestMs,
                latestMs,
                fullTimeSpanSeconds: Math.max(1000, latestMs - earliestMs) / 1000,
                timezone: DateTime.local().zone, // E.g. 8 hours behind (PST): FixedOffsetZone.instance(-8 * 60)
            }}
        >
            {children}
        </TimelineContext.Provider>
    );
}

export function useTimelineParameters(): TimelineParameters {
    return useContext(TimelineContext);
}
