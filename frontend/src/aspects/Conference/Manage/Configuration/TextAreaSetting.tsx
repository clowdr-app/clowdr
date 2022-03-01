import { Textarea } from "@chakra-ui/react";
import type { ChangeEventHandler } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Conference_ConfigurationKey_Enum } from "../../../../generated/graphql";

export default function TextSetting({
    settingName,
    value,
    onChange,
    isDisabled,
}: {
    settingName: Conference_ConfigurationKey_Enum;
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
}): JSX.Element {
    const [value_Debounce, setValue_Debounce] = useState<string>(value);
    const valueChanged = useRef<boolean>(false);
    const onChange_Debounce: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
        setValue_Debounce(event.target.value);
    }, []);
    useEffect(() => {
        let tId: number | undefined;
        if (value !== value_Debounce || valueChanged.current) {
            valueChanged.current = true;
            tId = setTimeout(
                (() => {
                    if (valueChanged.current) {
                        valueChanged.current = false;
                        onChange(value_Debounce);
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
        <Textarea
            name={settingName}
            value={value_Debounce}
            onChange={onChange_Debounce}
            onBlur={() => {
                if (valueChanged.current) {
                    valueChanged.current = false;
                    onChange(value_Debounce);
                }
            }}
            isDisabled={isDisabled}
        />
    );
}
