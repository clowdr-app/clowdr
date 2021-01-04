import React, { createContext, useContext } from "react";

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
    return (
        <TimelineContext.Provider
            value={{
                earliestMs: earliestEventStart,
                latestMs: latestEventEnd,
                fullTimeSpanSeconds: Math.max(1000, latestEventEnd - earliestEventStart) / 1000,
            }}
        >
            {children}
        </TimelineContext.Provider>
    );
}

export function useTimelineParameters(): TimelineParameters {
    return useContext(TimelineContext);
}
