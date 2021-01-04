import React from "react";
import { useRealTime } from "../../../Generic/useRealTime";
import { useTimelineParameters } from "./useTimelineParameters";

export default function NowMarker({ showLabel = false }: { showLabel?: boolean }): JSX.Element | null {
    const now = useRealTime();
    const timelineParams = useTimelineParameters();

    const offsetMs = now - timelineParams.earliestMs;
    const offsetSeconds = offsetMs / 1000;
    const percent = (100 * offsetSeconds) / timelineParams.fullTimeSpanSeconds;

    if (showLabel) {
        return (
            <div
                style={{
                    zIndex: 2,
                    position: "absolute",
                    left: percent + "%",
                    width: "auto",
                    height: "auto",
                    top: "7px",
                    borderLeftColor: "#ff3333",
                    borderLeftWidth: "2px",
                    borderLeftStyle: "solid",
                    background: "#ff3333",
                    borderTopRightRadius: "1000px",
                    borderBottomRightRadius: "1000px",
                    padding: "0.2em",
                    paddingTop: "0",
                    paddingRight: "0.6em",
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
                style={{
                    zIndex: 2,
                    position: "absolute",
                    left: percent + "%",
                    width: "1px",
                    height: "calc(100% - 7px)",
                    bottom: 0,
                    borderLeftColor: "#ff3333",
                    borderLeftWidth: "2px",
                    borderLeftStyle: "solid",
                }}
            ></div>
        );
    }
}
