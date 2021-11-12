import {
    Flex,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Textarea,
} from "@chakra-ui/react";
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

const anyDecimalSeparator = /[,.٫‎⎖]/;

export function timecodeToTenths(timecode: string): number {
    const [secondsFloatStr, minutesStr, hoursStr] = timecode.split(":").reverse();
    const [secondsStr, fractionStr] = secondsFloatStr.split(anyDecimalSeparator);

    let tenthsFloat = fractionStr ? parseInt(fractionStr, 10) : 0;
    while (tenthsFloat >= 10) tenthsFloat /= 10;

    const tenths = Math.round(tenthsFloat);
    const seconds = parseInt(secondsStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;

    return ((hours * 60 + minutes) * 60 + seconds) * 10 + tenths;
}

export function tenthsToTimecode(tenthsTotal: number): string {
    const secondsTotal = tenthsTotal / 10;
    const secondsStr = secondsFormat.format(secondsTotal % 60);
    const minutesTotalFloor = Math.trunc(secondsTotal / 60);
    const minutesStr = hoursMinutesFormat.format(minutesTotalFloor % 60);
    const hoursStr = hoursMinutesFormat.format(Math.trunc(minutesTotalFloor / 60));
    return hoursStr + ":" + minutesStr + ":" + secondsStr;
}

export interface SubtitleBlockData {
    startTenths: number;
    endTenths: number;
    text: string;
}

export function SubtitleBlock({
    startTenths,
    endTenths,
    text,
    onTextInput,
    onStartTenthsInput,
    onEndTenthsInput,
}: SubtitleBlockData & {
    onTextInput: (newText: string) => void;
    onStartTenthsInput: (newStartTenths: number) => void;
    onEndTenthsInput: (newEndTenths: number) => void;
}): JSX.Element {
    return (
        <Flex style={{ fontFamily: "monospace" }}>
            <Textarea
                flexBasis={"54em"}
                flexGrow={0}
                rows={3}
                cols={50}
                resize="none"
                value={text}
                onInput={(e) => {
                    onTextInput((e.target as HTMLTextAreaElement).value);
                }}
            />
            <Flex flexBasis={"16em"} flexGrow={0} flexDirection="column" justifyContent="space-between">
                <NumberInput value={tenthsToTimecode(startTenths)}>
                    <NumberInputField readOnly />
                    <NumberInputStepper>
                        <NumberIncrementStepper onClick={() => onStartTenthsInput(startTenths + 1)} />
                        <NumberDecrementStepper onClick={() => onStartTenthsInput(startTenths - 1)} />
                    </NumberInputStepper>
                </NumberInput>
                <NumberInput value={tenthsToTimecode(endTenths)}>
                    <NumberInputField readOnly />
                    <NumberInputStepper>
                        <NumberIncrementStepper onClick={() => onEndTenthsInput(endTenths + 1)} />
                        <NumberDecrementStepper onClick={() => onEndTenthsInput(endTenths - 1)} />
                    </NumberInputStepper>
                </NumberInput>
            </Flex>
        </Flex>
    );
}
