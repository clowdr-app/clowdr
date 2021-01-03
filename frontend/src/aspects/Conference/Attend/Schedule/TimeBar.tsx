import { Box } from "@chakra-ui/react";
import React from "react";
import useWindowEvent from "../../../Window/useWindowEvent";
import TimelineShiftButtons from "./TimelineShiftButtons";
import useTimelineParameters from "./useTimelineParameters";

export default function TimeBar({
    height,
    width,
    borderColour,
}: {
    height: number | string;
    width?: number | string;
    borderColour: string;
}): JSX.Element {
    const params = useTimelineParameters();

    useWindowEvent("wheel", (ev) => {
        if (ev.shiftKey) {
            params.shiftTo((startTimeMs, visibleTimSpanMs) => startTimeMs + visibleTimSpanMs * 0.1 * ev.deltaY);
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        }
    });

    return (
        <Box
            position="relative"
            w={width ?? "100%"}
            h={height}
            borderBottomWidth={1}
            borderBottomStyle="solid"
            borderBottomColor={borderColour}
        >
            Align: {new Date(params.startTimeMs).toLocaleString()}
            <br />
            Span: {(params.visibleTimeSpanSeconds / (60 * 60)).toLocaleString()} hours
            <br />
            <TimelineShiftButtons />
        </Box>
    );
}
