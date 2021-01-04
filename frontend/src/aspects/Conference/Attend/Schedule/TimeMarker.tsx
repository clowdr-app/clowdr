import React from "react";
import { useTimelineParameters } from "./useTimelineParameters";

export default function TimeMarker({
    time,
    showTimeLabel,
    showDate = false,
    height = "100%",
    colour = "#3333ff",
    roundTop,
}: {
    time: number;
    showTimeLabel: boolean;
    showDate?: boolean;
    height?: string | number;
    colour?: string;
    roundTop: boolean;
}): JSX.Element | null {
    const timelineParams = useTimelineParameters();

    const offsetMs = time - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const percent = (100 * offsetSeconds) / timelineParams.fullTimeSpanSeconds;

    if (roundTop) {
        return (
            <div
                style={{
                    zIndex: 2,
                    position: "absolute",
                    left: `calc(${percent}% - 5px)`,
                    width: "10px",
                    height: "10px",
                    bottom: "-5px",
                    backgroundColor: colour,
                    paddingLeft: "0.5em",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                    borderRadius: "1000px",
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        fontSize: "1.2em",
                        marginLeft: "-50%",
                        width: "auto",
                        paddingTop: "8px",
                    }}
                >
                    {showTimeLabel
                        ? showDate
                            ? new Date(time).toLocaleString(undefined, {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })
                            : new Date(time).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })
                        : undefined}
                </div>
            </div>
        );
    } else {
        return (
            <div
                style={{
                    zIndex: 2,
                    position: "absolute",
                    left: percent + "%",
                    width: showTimeLabel ? "auto" : "1px",
                    height: height,
                    bottom: 0,
                    borderLeftColor: colour,
                    borderLeftWidth: 1,
                    borderLeftStyle: "solid",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        fontSize: "1.2em",
                        marginLeft: "-50%",
                        width: "auto",
                        paddingTop: "8px",
                    }}
                >
                    {showTimeLabel
                        ? showDate
                            ? new Date(time).toLocaleString(undefined, {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })
                            : new Date(time).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })
                        : undefined}
                </div>
            </div>
        );
    }
}
