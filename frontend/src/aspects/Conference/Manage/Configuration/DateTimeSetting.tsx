import React, { useCallback, useEffect, useState } from "react";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";

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
    const [valueChanged, setValueChanged] = useState<boolean>(false);
    const onChange_Debounce = useCallback((newValue: Date | undefined) => {
        setValue_Debounce(newValue);
    }, []);
    useEffect(() => {
        if (value !== value_Debounce?.getTime() || valueChanged) {
            setValueChanged(true);
            const tId = setTimeout(() => {
                if (valueChanged) {
                    setValueChanged(false);
                    onChange(value_Debounce?.getTime());
                }
            }, 1000);
            return () => {
                clearTimeout(tId);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value_Debounce]);
    return (
        <DateTimePicker
            allowUndefined
            value={value_Debounce}
            onChange={onChange_Debounce}
            onBlur={() => {
                if (valueChanged) {
                    setValueChanged(false);
                    onChange(value_Debounce?.getTime());
                }
            }}
            isDisabled={isDisabled}
        />
    );
}
