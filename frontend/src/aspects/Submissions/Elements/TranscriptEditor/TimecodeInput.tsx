import {
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
} from "@chakra-ui/react";
import React from "react";

const secondsDisplayFormat = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const hoursMinutesDisplayFormat = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
});

function tenthsToTimecode(tenthsTotal: number): string {
    const secondsStr = secondsDisplayFormat.format((tenthsTotal % 600) / 10);
    const minutesStr = hoursMinutesDisplayFormat.format(Math.trunc(tenthsTotal / 600) % 60);
    const hoursStr = hoursMinutesDisplayFormat.format(Math.trunc(tenthsTotal / 36000));
    return hoursStr + ":" + minutesStr + ":" + secondsStr;
}

export default function TimecodeInput({
    value,
    onInput,
}: {
    value: number;
    onInput: (newValue: number) => void;
}): JSX.Element {
    return (
        <NumberInput value={tenthsToTimecode(value)}>
            <NumberInputField readOnly />
            <NumberInputStepper>
                <NumberIncrementStepper onClick={() => onInput(value + 1)} />
                <NumberDecrementStepper onClick={() => onInput(value - 1)} />
            </NumberInputStepper>
        </NumberInput>
    );
}
