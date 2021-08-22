import { Box, useColorModeValue } from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { useMemo } from "react";
import { useScalingParams } from "./Scaling";
import TimeMarker from "./TimeMarker";
import useTimelineParameters from "./useTimelineParameters";

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
    markerWidth: string | number,
    submarkerWidth: string | number,
    includeMarkers = true,
    includeSubMarkers = true,
    showTimeLabel = true
): JSX.Element[] {
    const scroller = useScalingParams();
    const timeline = useTimelineParameters();

    const orange = "#DD6B20";
    const purple = "#805AD5";
    const submarkerColour = useColorModeValue("#333", "#ddd");

    return useMemo(() => {
        const scale = (2 * 60 * 60) / scroller.visibleTimeSpanSeconds;
        const markerDensity = findMarkerBoundary((window.innerHeight - 150) * scale);
        const markerDivisions = markerDensity[0];
        const markerSubdivisions = markerDensity[1];

        const results: JSX.Element[] = [];
        const start = timeline.earliestMs;
        const end = timeline.latestMs;
        const markerSpacing = (4 * 60 * 60 * 1000) / markerDivisions;
        const submarkerSpacing = markerSpacing / markerSubdivisions;

        let prevOrdinal = Number.POSITIVE_INFINITY;
        let prevHour = Number.POSITIVE_INFINITY;
        for (let currentMarkerTime = start; currentMarkerTime <= end; currentMarkerTime += markerSpacing) {
            const currDate = DateTime.fromMillis(currentMarkerTime).setZone(timeline.timezone);
            if (includeMarkers || showTimeLabel) {
                results.push(
                    <TimeMarker
                        width={markerWidth}
                        showTimeLabel={showTimeLabel}
                        showDate={false} // {currDate.ordinal > prevOrdinal || (currDate.hour >= 12 && prevHour < 12)}
                        time={currentMarkerTime}
                        key={`marker-${currentMarkerTime}`}
                        roundTop={false}
                        colour={
                            !includeMarkers
                                ? "transparent"
                                : currDate.ordinal > prevOrdinal || (currDate.hour >= 12 && prevHour < 12)
                                ? orange
                                : currDate.hour % 4 === 0 && prevHour % 4 !== 0
                                ? purple
                                : undefined
                        }
                    />
                );
            }
            prevOrdinal = currDate.ordinal;
            prevHour = currDate.hour;
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
                            width={submarkerWidth}
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
        markerWidth,
        scroller.visibleTimeSpanSeconds,
        showTimeLabel,
        submarkerColour,
        submarkerWidth,
        timeline.earliestMs,
        timeline.latestMs,
        timeline.timezone,
    ]);
}

export default function TimeBar({
    width,
    borderColour,
    marginTop,
}: {
    width: number | string;
    borderColour: string;
    marginTop?: string;
}): JSX.Element {
    const markers = useGenerateMarkers("100%", "20%", false, true, true);

    const bgColor = useColorModeValue("purple.100", "purple.700");
    return (
        <Box
            position="relative"
            h="100%"
            w={width + "px"}
            borderBottomWidth={1}
            borderBottomStyle="solid"
            borderBottomColor={borderColour}
            borderTopWidth={marginTop ? 1 : 0}
            borderTopStyle="solid"
            borderTopColor={borderColour}
            overflow="hidden"
            backgroundColor={bgColor}
            ml={marginTop}
            fontSize="xs"
        >
            {markers}
        </Box>
    );
}
