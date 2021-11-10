import { Flex, Input, Textarea } from "@chakra-ui/react";
import React from "react";

const secondsFormat = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const hoursMinutesFormat = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
});

export interface subtitleBlockData {
    startTenths: number;
    endTenths: number;
    text: string;
}

export function tenthsToTimecode(tenthsTotal: number): string {
    const secondsTotal = tenthsTotal / 10;
    const secondsStr = secondsFormat.format(secondsTotal % 60);
    const minutesTotalFloor = Math.trunc(secondsTotal / 60);
    const minutesStr = hoursMinutesFormat.format(minutesTotalFloor % 60);
    const hoursStr = hoursMinutesFormat.format(Math.trunc(minutesTotalFloor / 60));
    return hoursStr + ":" + minutesStr + ":" + secondsStr;
}

export function SubtitleBlock({ startTenths, endTenths, text }: subtitleBlockData): JSX.Element {
    return (
        <Flex style={{ fontFamily: "monospace" }}>
            <Textarea flexBasis={"54em"} flexGrow={0} rows={3} cols={50} resize="none" value={text} />
            <Flex flexBasis={"16em"} flexGrow={0} flexDirection="column" justifyContent="space-between">
                <Input value={tenthsToTimecode(startTenths)} />
                <Input value={tenthsToTimecode(endTenths)} />
            </Flex>
        </Flex>
    );
}
