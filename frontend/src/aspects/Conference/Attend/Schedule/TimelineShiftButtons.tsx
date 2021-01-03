import { Button, Tooltip } from "@chakra-ui/react";
import React, { useCallback } from "react";
import FAIcon from "../../../Icons/FAIcon";
import useWindowEvent from "../../../Window/useWindowEvent";
import useTimelineParameters from "./useTimelineParameters";

export default function TimelineShiftButtons(): JSX.Element {
    const params = useTimelineParameters();
    const defaultShiftFactor = 0.25;

    const shiftEarlier = useCallback(() => {
        params.shiftTo((startTimeMs, visibleTimSpanMs) => startTimeMs - visibleTimSpanMs * defaultShiftFactor);
    }, [params]);

    const shiftLater = useCallback(() => {
        params.shiftTo((startTimeMs, visibleTimSpanMs) => startTimeMs + visibleTimSpanMs * defaultShiftFactor);
    }, [params]);

    const shiftKeyboard = useCallback(
        (ev: KeyboardEvent) => {
            if (ev.key === "ArrowLeft") {
                shiftEarlier();
            } else if (ev.key === "ArrowRight") {
                shiftLater();
            }
        },
        [shiftEarlier, shiftLater]
    );

    useWindowEvent("keydown", shiftKeyboard);

    return (
        <>
            <Tooltip label="Use left/right arrow keys to scroll the timeline.">
                <Button
                    minW={0}
                    minH={0}
                    p={0}
                    w="auto"
                    h="auto"
                    background="none"
                    position="absolute"
                    left="0"
                    onClick={shiftEarlier}
                    zIndex={3}
                >
                    <FAIcon iconStyle="s" icon="chevron-left" />
                </Button>
            </Tooltip>
            <Tooltip label="Use left/right arrow keys to scroll the timeline.">
                <Button
                    minW={0}
                    minH={0}
                    p={0}
                    w="auto"
                    h="auto"
                    background="none"
                    position="absolute"
                    right="0"
                    onClick={shiftLater}
                    zIndex={3}
                >
                    <FAIcon iconStyle="s" icon="chevron-right" />
                </Button>
            </Tooltip>
        </>
    );
}
