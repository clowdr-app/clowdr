import { Flex, Input, Textarea } from "@chakra-ui/react";
import React from "react";

const secondsFormat = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

const hoursMinutesFormat = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
});

export interface subtitleBlockData {
    startTimeMs: number;
    endTimeMs: number;
    text: string;
}

export function validTimecodeToMs(timecode: string): number {
    const [hoursStr, minutesStr, secondsStr] = timecode.split(":");
    const millisecondsStr = secondsStr.replace(/[,.]/, "").padEnd(5, "0");
    const milliseconds = parseInt(millisecondsStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const hours = parseInt(hoursStr, 10);
    return (hours * 60 + minutes) * 60000 + milliseconds;
}

export function msToTimecode(msTotal: number): string {
    const secondsTotal = msTotal / 1000;
    const secondsStr = secondsFormat.format(secondsTotal % 60);
    const minutesTotalFloor = Math.trunc(secondsTotal / 60);
    const minutesStr = hoursMinutesFormat.format(minutesTotalFloor % 60);
    const hoursStr = hoursMinutesFormat.format(Math.trunc(minutesTotalFloor / 60));
    return hoursStr + ":" + minutesStr + ":" + secondsStr;
}

export function SubtitleBlock({ startTimeMs, endTimeMs, text }: subtitleBlockData): JSX.Element {
    return (
        <Flex style={{ fontFamily: "monospace" }}>
            <Textarea flexBasis={"54em"} flexGrow={0} rows={3} cols={50} resize="none" value={text} />
            <Flex flexBasis={"16em"} flexGrow={0} flexDirection="column" justifyContent="space-between">
                <Input value={msToTimecode(startTimeMs)} />
                <Input value={msToTimecode(endTimeMs)} />
            </Flex>
        </Flex>
    );
}
