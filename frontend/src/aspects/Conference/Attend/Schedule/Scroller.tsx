import { Box } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import ScrollContainer from "react-indiana-drag-scroll";
import { useTimelineParameters } from "./useTimelineParameters";

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

    return (
        <ScrollerContext.Provider
            value={{
                visibleTimeSpanSeconds,
                zoomTo,
            }}
        >
            {children}
        </ScrollerContext.Provider>
    );
}

export default function Scroller({
    children,
    height,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    height?: number;
}): JSX.Element {
    const { visibleTimeSpanSeconds } = useScrollerParams();
    const { fullTimeSpanSeconds } = useTimelineParameters();

    const innerWidthPx = (1920 * fullTimeSpanSeconds) / visibleTimeSpanSeconds;

    return (
        <Box
            as={ScrollContainer}
            w="100%"
            h={height}
            vertical={false}
            hideScrollbars={false}
            role="region"
            aria-label="Room schedules"
        >
            <div
                style={{
                    width: innerWidthPx,
                    height: "100%",
                    boxSizing: "border-box",
                    transition: "none",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {children}
            </div>
        </Box>
    );
}
