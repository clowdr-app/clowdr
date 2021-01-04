import React, { createContext, useContext } from "react";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";

export interface TimelineParameters {
    earliestMs: number;
    latestMs: number;

    fullTimeSpanSeconds: number;
}

const defaultTimelineParams: TimelineParameters = {
    earliestMs: 0,
    latestMs: 1000,
    fullTimeSpanSeconds: 1000,
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
            }}
        >
            {children}
        </TimelineContext.Provider>
    );
}

export function useTimelineParameters(): TimelineParameters {
    return useContext(TimelineContext);
}
