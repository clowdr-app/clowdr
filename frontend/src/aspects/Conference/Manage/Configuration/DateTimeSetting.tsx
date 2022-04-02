import React, { useCallback, useEffect, useRef, useState } from "react";
import { DateTimePicker } from "../../../Chakra/DateTimePicker";

export default function DateTimeSetting({
    value,
    onChange,
    isDisabled,
}: {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    isDisabled?: boolean;
}): JSX.Element {
    const [value_Debounce, setValue_Debounce] = useState<Date | undefined>(value ? new Date(value) : undefined);
    const valueChanged = useRef<boolean>(false);
    const onChange_Debounce = useCallback((newValue: Date | undefined) => {
        setValue_Debounce(newValue);
    }, []);
    useEffect(() => {
        let tId: number | undefined;
        if (value !== value_Debounce?.getTime() || valueChanged.current) {
            valueChanged.current = true;
            tId = setTimeout(
                (() => {
                    if (valueChanged.current) {
                        valueChanged.current = false;
                        onChange(value_Debounce?.getTime());
                    }
                }) as TimerHandler,
                1000
            );
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value_Debounce]);
    return (
        <DateTimePicker
            allowUndefined
            value={value_Debounce}
            onChange={onChange_Debounce}
            onBlur={() => {
                if (valueChanged.current) {
                    valueChanged.current = false;
                    onChange(value_Debounce?.getTime());
                }
            }}
            isDisabled={isDisabled}
        />
    );
}
