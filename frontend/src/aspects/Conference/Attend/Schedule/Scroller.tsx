import { Box } from "@chakra-ui/react";
import React, { createContext, useContext, useMemo, useRef } from "react";
import { DraggableCore } from "react-draggable";
import useResizeObserver from "../../../Generic/useResizeObserver";
import useTimelineParameters from "./useTimelineParameters";

interface ScrollerParams {
    pixelsPerSecond: number;
}

const ScrollerParamsContext = createContext<ScrollerParams>({
    pixelsPerSecond: 0,
});

export function useScrollerParams(): ScrollerParams {
    return useContext(ScrollerParamsContext);
}

export default function Scoller({
    children,
    visibleTimeSpanSeconds,
    fullTimeSpanSeconds,
    startAtTimeOffsetSeconds,
    height,
}: {
    children: React.ReactNode | React.ReactNodeArray | ((outerWidth: number) => React.ReactNode | React.ReactNodeArray);
    visibleTimeSpanSeconds: number;
    fullTimeSpanSeconds: number;
    startAtTimeOffsetSeconds: number;
    height: number;
}): JSX.Element {
    const timelineParams = useTimelineParameters();
    const outerRef = useRef<HTMLDivElement>(null);
    const outerSizeEntries = useResizeObserver(outerRef);

    const outerWidth = useMemo(() => {
        if (outerSizeEntries.length > 0) {
            return outerSizeEntries[0].contentRect.width;
        }
        return 0;
    }, [outerSizeEntries]);

    const pixelsPerSecond = visibleTimeSpanSeconds === 0 ? 1 : outerWidth / visibleTimeSpanSeconds;
    const innerWidth = Math.max(outerWidth, pixelsPerSecond * fullTimeSpanSeconds);
    const innerLeftT = pixelsPerSecond * -startAtTimeOffsetSeconds;
    const innerLeft = Math.min(0, Math.max(innerLeftT, outerWidth - innerWidth));

    const dragData = useRef<{
        x: number;
        t: number;
    }>({
        x: 0,
        t: 0,
    });
    return (
        <DraggableCore
            onStart={(_ev, data) => {
                dragData.current.x = data.x;
                dragData.current.t = timelineParams.startTimeMs;
            }}
            onDrag={(ev, data) => {
                const delta = dragData.current.x - data.x;
                if (Math.abs(delta) > 0) {
                    const v = dragData.current.t + 1000 * (delta / pixelsPerSecond);
                    timelineParams.shiftTo(v);
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }}
            allowAnyClick={true}
        >
            <Box ref={outerRef} position="relative" w="100%" h={height} overflow="hidden">
                <div
                    style={{
                        position: "absolute",
                        width: innerWidth,
                        height: "100%",
                        top: 0,
                        left: innerLeft,
                        boxSizing: "border-box",
                        overflow: "hidden",
                    }}
                >
                    <ScrollerParamsContext.Provider
                        value={{
                            pixelsPerSecond,
                        }}
                    >
                        {typeof children === "function" ? children(outerWidth) : children}
                    </ScrollerParamsContext.Provider>
                </div>
            </Box>
        </DraggableCore>
    );
}
