import { DateTime } from "luxon";
import React from "react";
import { useTimelineParameters } from "./useTimelineParameters";

export default function TimeMarker({
    time,
    showTimeLabel,
    showDate = false,
    width = "100%",
    colour = "#3333ff",
    roundTop,
}: {
    time: number;
    showTimeLabel: boolean;
    showDate?: boolean;
    width?: string | number;
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
                    top: `calc(${percent}% - 5px)`,
                    width: "10px",
                    height: "10px",
                    right: "-5px",
                    backgroundColor: colour,
                    paddingTop: "0.5em",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                    borderRadius: "1000px",
                }}
                aria-hidden="true"
            >
                {showTimeLabel ? (
                    <div
                        style={{
                            display: "inline-block",
                            fontSize: "1.2em",
                            marginTop: "-50%",
                            height: "auto",
                            paddingLeft: "8px",
                        }}
                    >
                        {showDate
                            ? DateTime.fromMillis(time).setZone(timelineParams.timezone).toLocaleString({
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })
                            : DateTime.fromMillis(time).setZone(timelineParams.timezone).toLocaleString({
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })}
                    </div>
                ) : undefined}
            </div>
        );
    } else {
        return (
            <div
                style={{
                    zIndex: 2,
                    position: "absolute",
                    top: percent + "%",
                    height: showTimeLabel ? "auto" : "1px",
                    width,
                    left: 0,
                    borderTopColor: colour,
                    borderTopWidth: 1,
                    borderTopStyle: "solid",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                }}
                aria-hidden="true"
            >
                {showTimeLabel ? (
                    <div
                        style={{
                            display: "inline-block",
                            fontSize: "1.2em",
                            height: "auto",
                            paddingLeft: "8px",
                            maxWidth: "100%",
                            whiteSpace: "normal",
                            marginTop: "-50%",
                        }}
                    >
                        {showDate
                            ? DateTime.fromMillis(time).setZone(timelineParams.timezone).toLocaleString({
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })
                            : DateTime.fromMillis(time).setZone(timelineParams.timezone).toLocaleString({
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                              })}
                    </div>
                ) : undefined}
            </div>
        );
    }
}
