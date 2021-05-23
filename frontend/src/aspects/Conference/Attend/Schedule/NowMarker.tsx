import React, { useCallback, useEffect, useRef } from "react";
import { useRealTime } from "../../../Generic/useRealTime";
import useTimelineParameters from "./useTimelineParameters";

export default function NowMarker({
    showLabel = false,
    scrollToNow,
}: {
    showLabel?: boolean;
    scrollToNow?: React.MutableRefObject<(() => void) | undefined>;
}): JSX.Element | null {
    const now = useRealTime(60000);
    const timelineParams = useTimelineParameters();

    const offsetMs = now - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const percent = (100 * offsetSeconds) / timelineParams.fullTimeSpanSeconds;

    const ref = useRef<HTMLDivElement>(null);
    const scrollToNowF = useCallback(() => {
        if (offsetSeconds >= 0 && offsetSeconds < timelineParams.fullTimeSpanSeconds) {
            ref.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "start",
            });
        }
    }, [offsetSeconds, timelineParams.fullTimeSpanSeconds]);
    useEffect(() => {
        if (scrollToNow && offsetSeconds >= 0 && offsetSeconds < timelineParams.fullTimeSpanSeconds) {
            scrollToNow.current = scrollToNowF;

            scrollToNowF();
        }
    }, [offsetSeconds, scrollToNow, scrollToNowF, timelineParams.fullTimeSpanSeconds]);

    if (offsetSeconds < 0 || offsetSeconds > timelineParams.fullTimeSpanSeconds) {
        return <></>;
    }

    if (showLabel) {
        return (
            <div
                ref={ref}
                style={{
                    zIndex: 10,
                    position: "absolute",
                    top: percent + "%",
                    width: "auto",
                    height: "auto",
                    left: "20px",
                    borderTopColor: "#ff3333",
                    borderTopWidth: "2px",
                    borderTopStyle: "solid",
                    background: "#ff3333",
                    borderTopLeftRadius: "1000px",
                    borderBottomLeftRadius: "1000px",
                    padding: "0.1em 0.3em 0.3em 0.6em",
                    fontSize: "80%",
                    color: "white",
                }}
            >
                Live now
            </div>
        );
    } else {
        return (
            <div
                ref={ref}
                style={{
                    zIndex: 2,
                    position: "absolute",
                    top: percent + "%",
                    height: "1px",
                    width: "calc(100% - 20px - 2em)",
                    right: 0,
                    borderTopColor: "#ff3333",
                    borderTopWidth: "2px",
                    borderTopStyle: "solid",
                }}
            ></div>
        );
    }
}
