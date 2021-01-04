import { Box, Button, Tooltip } from "@chakra-ui/react";
import React, { useCallback } from "react";
import FAIcon from "../../../Icons/FAIcon";
import useWindowEvent from "../../../Window/useWindowEvent";
import { useScrollerParams } from "./Scroller";

const zoomBoundariesMinutes = [
    5, // 5 mins
    10, // 10 mins
    15, // 15 mins
    30, // 30 mins
    60, // 1 hour
    120, // 2 hours
    180, // 3 hours
    240, // 4 hours
    360, // 6 hours
    480, // 8 hours
    720, // 12 hours
    1440, // 1 day
    2880, // 2 days
    4320, // 3 days
    5760, // 4 days
    7200, // 5 days
    10080, // 1 week
    20160, // 2 weeks
];

function findBoundary(seconds: number): number {
    const minutes = seconds / 60;
    for (let index = 0; index < zoomBoundariesMinutes.length; index++) {
        const b = zoomBoundariesMinutes[index];
        if (minutes <= b) {
            return index;
        }
    }
    return zoomBoundariesMinutes.length - 1;
}

export default function TimelineZoomControls(): JSX.Element {
    const params = useScrollerParams();
    const defaultZoomFactor = 1.25;

    const zoomOut = useCallback(() => {
        params.zoomTo((span) => {
            const oldIndex = findBoundary(span);
            let newIndex = findBoundary(span * defaultZoomFactor);
            if (oldIndex === newIndex && newIndex !== zoomBoundariesMinutes.length - 1) {
                newIndex++;
            }
            return zoomBoundariesMinutes[newIndex] * 60;
        });
    }, [params]);

    const zoomIn = useCallback(() => {
        params.zoomTo((span) => {
            const oldIndex = findBoundary(span);
            let newIndex = findBoundary(span / defaultZoomFactor);
            if (oldIndex === newIndex && newIndex !== 0) {
                newIndex--;
            }
            return zoomBoundariesMinutes[newIndex] * 60;
        });
    }, [params]);

    const zoomKeyboard = useCallback(
        (ev: KeyboardEvent) => {
            if (ev.key === "-" || ev.key === "_") {
                zoomOut();
            } else if (ev.key === "+" || ev.key === "=") {
                zoomIn();
            }
        },
        [zoomIn, zoomOut]
    );

    useWindowEvent("keydown", zoomKeyboard);

    return (
        <Box>
            <Tooltip label="Use +/- keys to zoom the timeline.">
                <Button ml={3} size="lg" p={3} background="none" onClick={() => zoomOut()} fontSize="2em">
                    <FAIcon iconStyle="s" icon="search-minus" />
                </Button>
            </Tooltip>
            <Tooltip label="Use +/- keys to zoom the timeline.">
                <Button ml={1} size="lg" p={3} background="none" onClick={() => zoomIn()} fontSize="2em">
                    <FAIcon iconStyle="s" icon="search-plus" />
                </Button>
            </Tooltip>
        </Box>
    );
}
