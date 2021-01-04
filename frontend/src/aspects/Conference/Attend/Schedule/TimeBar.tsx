import { Box, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { distanceToBoundary, roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useScrollerParams } from "./Scroller";
import TimeMarker from "./TimeMarker";
import { useTimelineParameters } from "./useTimelineParameters";

const markerDensityBoundaries: Record<string, number[]> = {
    "350": [4, 2],
    "600": [6, 4],
    "800": [8, 4],
    "1024": [8, 4],
    "1366": [12, 4],
    "1920": [12, 4],
};

function findMarkerBoundary(width: number): number[] {
    const keys = Object.keys(markerDensityBoundaries)
        .map((x) => parseInt(x, 10))
        .sort((x, y) => x - y);
    for (const key of keys) {
        const b = key;
        if (width <= b) {
            return markerDensityBoundaries[key.toString()];
        }
    }
    return markerDensityBoundaries[keys[keys.length - 1].toString()];
}

export function useGenerateMarkers(
    markerHeight: string | number,
    submarkerHeight: string | number,
    includeMarkers = true,
    includeSubMarkers = true,
    showTimeLabel = true
): JSX.Element[] {
    const scroller = useScrollerParams();
    const timeline = useTimelineParameters();

    const orange = "#DD6B20";
    const purple = "#805AD5";
    const submarkerColour = useColorModeValue("#333", "#ddd");

    return useMemo(() => {
        const scale = (2 * 60 * 60) / scroller.visibleTimeSpanSeconds;
        const markerDensity = findMarkerBoundary(window.innerWidth * scale);
        const markerDivisions = markerDensity[0];
        const markerSubdivisions = markerDensity[1];

        const results: JSX.Element[] = [];
        const start = roundDownToNearest(timeline.earliestMs, 60 * 60 * 1000);
        const end = roundUpToNearest(timeline.latestMs, 60 * 60 * 1000);
        const markerSpacing = (4 * 60 * 60 * 1000) / markerDivisions;
        const submarkerSpacing = markerSpacing / markerSubdivisions;

        let prevHalfDay = Number.POSITIVE_INFINITY;
        for (let currentMarkerTime = start; currentMarkerTime <= end; currentMarkerTime += markerSpacing) {
            const currHalfDay = currentMarkerTime % (12 * 60 * 60 * 1000);
            if (includeMarkers || showTimeLabel) {
                results.push(
                    <TimeMarker
                        height={markerHeight}
                        showTimeLabel={showTimeLabel}
                        showDate={currHalfDay < prevHalfDay}
                        time={currentMarkerTime}
                        key={`marker-${currentMarkerTime}`}
                        roundTop={false}
                        colour={
                            !includeMarkers
                                ? "transparent"
                                : distanceToBoundary(currentMarkerTime, 12 * 60 * 60 * 1000) < 5
                                ? orange
                                : distanceToBoundary(currentMarkerTime, 4 * 60 * 60 * 1000) < 5
                                ? purple
                                : undefined
                        }
                    />
                );
            }
            prevHalfDay = currHalfDay;
            if (includeSubMarkers) {
                const currentMarkerEndTime = currentMarkerTime + markerSpacing;
                for (
                    let currentSubmarkerTime = currentMarkerTime;
                    currentSubmarkerTime < currentMarkerEndTime;
                    currentSubmarkerTime += submarkerSpacing
                ) {
                    results.push(
                        <TimeMarker
                            roundTop={true}
                            height={submarkerHeight}
                            showTimeLabel={false}
                            time={currentSubmarkerTime}
                            key={`submarker-${currentSubmarkerTime}`}
                            colour={submarkerColour}
                        />
                    );
                }
            }
        }
        return results;
    }, [
        includeMarkers,
        includeSubMarkers,
        markerHeight,
        scroller.visibleTimeSpanSeconds,
        showTimeLabel,
        submarkerColour,
        submarkerHeight,
        timeline.earliestMs,
        timeline.fullTimeSpanSeconds,
        timeline.latestMs,
    ]);
}

export default function TimeBar({
    height,
    borderColour,
}: {
    height: number | string;
    borderColour: string;
}): JSX.Element {
    const markers = useGenerateMarkers("100%", "20%", false, true, true);

    const bgColor = useColorModeValue("blue.100", "blue.700");
    return (
        <Box
            position="relative"
            w="100%"
            h={height + "px"}
            borderBottomWidth={1}
            borderBottomStyle="solid"
            borderBottomColor={borderColour}
            overflow="hidden"
            backgroundColor={bgColor}
        >
            {markers}
        </Box>
    );
}
