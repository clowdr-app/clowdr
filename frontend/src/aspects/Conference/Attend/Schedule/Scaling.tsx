import React, { useCallback, useMemo, useState } from "react";
import useTimelineParameters from "./useTimelineParameters";

interface ScalingParams {
    visibleTimeSpanSeconds: number;
    zoomTo: (next: (oldTimeSpanSeconds: number) => number) => void;
}
const ScalingContext = React.createContext<ScalingParams>({
    visibleTimeSpanSeconds: 4 * 60 * 60,
    zoomTo: () => {
        /* EMPTY */
    },
});

export function useScalingParams(): ScalingParams {
    return React.useContext(ScalingContext);
}

export function ScalingProvider({
    children,
    avgEventDuration,
    avgEventsPerRoom,
}: {
    children: React.ReactNode;
    avgEventDuration: number;
    avgEventsPerRoom: number;
}): JSX.Element {
    const timelineParams = useTimelineParameters();
    const [visibleTimeSpanSeconds, setVisibleTimeSpanSeconds] = useState(6 * (avgEventDuration / 1000));
    const zoomTo = useCallback(
        (span) => {
            setVisibleTimeSpanSeconds((old) =>
                Math.max(5 * 60, Math.min((timelineParams.latestMs - timelineParams.earliestMs) / 1000, span(old)))
            );
        },
        [timelineParams.latestMs, timelineParams.earliestMs]
    );
    const ctx = useMemo(
        () => ({
            visibleTimeSpanSeconds,
            zoomTo,
        }),
        [visibleTimeSpanSeconds, zoomTo]
    );

    return <ScalingContext.Provider value={ctx}>{children}</ScalingContext.Provider>;
}
