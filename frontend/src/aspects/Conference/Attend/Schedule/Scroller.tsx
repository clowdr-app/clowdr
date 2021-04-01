import { Box } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import ScrollContainer from "react-indiana-drag-scroll";
import useTimelineParameters from "./useTimelineParameters";

interface ScrollerParams {
    visibleTimeSpanSeconds: number;
    zoomTo: (next: (oldTimeSpanSeconds: number) => number) => void;
}
const ScrollerContext = React.createContext<ScrollerParams>({
    visibleTimeSpanSeconds: 4 * 60 * 60,
    zoomTo: () => {
        /* EMPTY */
    },
});

export function useScrollerParams(): ScrollerParams {
    return React.useContext(ScrollerContext);
}

export function ScrollerProvider({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const timelineParams = useTimelineParameters();
    const [visibleTimeSpanSeconds, setVisibleTimeSpanSeconds] = useState(4 * 60 * 60);
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

    return <ScrollerContext.Provider value={ctx}>{children}</ScrollerContext.Provider>;
}

export default function Scroller({
    children,
    width,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    width?: number;
}): JSX.Element {
    const { visibleTimeSpanSeconds } = useScrollerParams();
    const { fullTimeSpanSeconds } = useTimelineParameters();

    const innerHeightPx = (1920 * fullTimeSpanSeconds) / visibleTimeSpanSeconds;

    return (
        <Box
            as={ScrollContainer}
            h={innerHeightPx + "px"}
            w={width}
            vertical={false}
            hideScrollbars={false}
            role="region"
            aria-label="Room schedules"
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    transition: "none",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                }}
            >
                {children}
            </div>
        </Box>
    );
}
