import { Box } from "@chakra-ui/react";
import React from "react";
import { useRealTime } from "../../../Generic/useRealTime";
import useTimelineParameters from "./useTimelineParameters";

function NowMarkerInner({ now, pixelsPerSecond, manualScrollOffset }: { now: number; pixelsPerSecond: number; manualScrollOffset: boolean }): JSX.Element {
    const timelineParams = useTimelineParameters();

    const offsetMs = now - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const leftPxV = offsetSeconds * pixelsPerSecond;

    let leftPx = leftPxV;
    if (manualScrollOffset) {
        leftPx += pixelsPerSecond * -timelineParams.startTimeOffsetSeconds;
    }

    return (
        <>
            <Box
                zIndex={2}
                position="absolute"
                left={Math.round(leftPx) + "px"}
                width="1px"
                height="100%"
                top={0}
                borderLeftColor="#ff3333"
                borderLeftWidth={1}
                borderLeftStyle="solid"
                p={0}
            >
            </Box>
        </>
    );
}

export default function NowMarker({ pixelsPerSecond, manualScrollOffset = false }: { pixelsPerSecond: number; manualScrollOffset?: boolean }): JSX.Element | null {
    const timelineParams = useTimelineParameters();

    const now = useRealTime();

    if (now + 60000 < timelineParams.startTimeMs) {
        return null;
    } else if (now - 60000 > timelineParams.startTimeMs + timelineParams.visibleTimeSpanSeconds * 1000) {
        return null;
    }

    return <NowMarkerInner now={now} pixelsPerSecond={pixelsPerSecond} manualScrollOffset={manualScrollOffset} />;
}
