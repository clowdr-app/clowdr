import { Textarea } from "@chakra-ui/react";
import type { ChangeEventHandler } from "react";
import React, { useCallback, useEffect, useState } from "react";
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
    const [valueChanged, setValueChanged] = useState<boolean>(false);
    const onChange_Debounce: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
        setValue_Debounce(event.target.value);
    }, []);
    useEffect(() => {
        if (value !== value_Debounce || valueChanged) {
            setValueChanged(true);
            const tId = setTimeout(() => {
                if (valueChanged) {
                    setValueChanged(false);
                    onChange(value_Debounce);
                }
            }, 1000);
            return () => {
                clearTimeout(tId);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value_Debounce]);
    return (
        <Textarea
            name={settingName}
            value={value_Debounce}
            onChange={onChange_Debounce}
            onBlur={() => {
                if (valueChanged) {
                    setValueChanged(false);
                    onChange(value_Debounce);
                }
            }}
            isDisabled={isDisabled}
        />
    );
}
