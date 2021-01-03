import React, { createContext, useContext, useState } from "react";
import { roundToNearest } from "../../../Generic/MathUtils";

interface TimelineParameters {
    startTimeMs: number;
    earliestMs: number;
    latestMs: number;

    visibleTimeSpanSeconds: number;
    fullTimeSpanSeconds: number;
    startTimeOffsetSeconds: number;

    shiftTo: (next: number | ((oldTimeMs: number, visibleTimSpanMs: number) => number)) => void;
    zoomTo: (next: (oldTimeSpanSeconds: number) => number) => void;
    notifyEventStart: (startAtMs: number) => void;
    notifyEventEnd: (startAtMs: number) => void;
}

const TimelinePositionContext = createContext<TimelineParameters>({
    startTimeMs: 0,
    earliestMs: 0,
    latestMs: 1000,
    visibleTimeSpanSeconds: 0,
    fullTimeSpanSeconds: 1000,
    startTimeOffsetSeconds: 0,
    shiftTo: () => {
        /* EMPTY */
    },
    zoomTo: () => {
        /* EMPTY */
    },
    notifyEventStart: () => {
        /* EMPTY */
    },
    notifyEventEnd: () => {
        /* EMPTY */
    },
});

export function TimelineParameters({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const [startTimeMs, setStartTime] = useState<number>(Date.now());
    const [visibleTimeSpanSeconds, setTimeSpanSeconds] = useState<number>(60 * 60 * 4);

    const [earliestEventStartV, setEarliestEventStart] = useState<number>();
    const [latestEventEndV, setLatestEventEnd] = useState<number>();

    const earliestEventStart = earliestEventStartV ?? Date.now();
    const latestEventEnd = latestEventEndV ?? earliestEventStart + 1000;

    return (
        <TimelinePositionContext.Provider
            value={{
                startTimeMs: roundToNearest(Math.max(earliestEventStart, Math.min(latestEventEnd, startTimeMs)), 5 * 60 * 1000),
                visibleTimeSpanSeconds: visibleTimeSpanSeconds,
                earliestMs: earliestEventStart,
                latestMs: latestEventEnd,
                fullTimeSpanSeconds: Math.max(1000, latestEventEnd - earliestEventStart) / 1000,
                startTimeOffsetSeconds: (startTimeMs - earliestEventStart) / 1000,
                shiftTo: (t) => {
                    if (typeof t === "number") {
                        setStartTime(Math.max(earliestEventStart, Math.min(latestEventEnd - (visibleTimeSpanSeconds * 1000), t)));
                    }
                    else {
                        setStartTime(old => Math.max(earliestEventStart, Math.min(latestEventEnd - (visibleTimeSpanSeconds * 1000), t(old, visibleTimeSpanSeconds * 1000))));
                    }
                },
                zoomTo: (span) => {
                    setTimeSpanSeconds(old => Math.max(5 * 60, Math.min((latestEventEnd - earliestEventStart) / 1000, span(old))));
                },
                notifyEventStart: (t) => {
                    setEarliestEventStart((old) => (!old || t < old ? t : old));
                },
                notifyEventEnd: (t) => {
                    setLatestEventEnd((old) => (!old || t > old ? t : old));
                },
            }}
        >
            {children}
        </TimelinePositionContext.Provider>
    );
}

export default function useTimelineParameters(): TimelineParameters {
    return useContext(TimelinePositionContext);
}
