import { Input, InputGroup } from "@chakra-ui/react";
import type { ChangeEventHandler, MutableRefObject } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Conference_ConfigurationKey_Enum } from "../../../../generated/graphql";

export default function TextSetting({
    settingName,
    value,
    onChangeStarted,
    onChange,
    onReset,
    type,
    isDisabled,
    leftAddon,
    rightAddon,
    minLength,
    maxLength,
}: {
    settingName: Conference_ConfigurationKey_Enum | string;
    value: string;
    onChangeStarted?: (value: string) => void;
    onChange: (value: string) => void;
    onReset?: MutableRefObject<null | (() => void)>;
    type: string;
    isDisabled?: boolean;
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
    minLength?: number;
    maxLength?: number;
}): JSX.Element {
    const [value_Debounce, setValue_Debounce] = useState<string>(value);
    const valueChanged = useRef<boolean>(false);
    const [changeInProgress, setChangeInProgress] = useState<boolean>(false);
    const onChange_Debounce: ChangeEventHandler<HTMLInputElement> = useCallback(
        (event) => {
            if (!changeInProgress) {
                onChangeStarted?.(event.target.value);
                setChangeInProgress(true);
            }
            setValue_Debounce(event.target.value);
        },
        [changeInProgress, onChangeStarted]
    );
    useEffect(() => {
        let tId: number | undefined;
        if (value !== value_Debounce || valueChanged.current) {
            valueChanged.current = true;
            tId = setTimeout(
                (() => {
                    setChangeInProgress(false);
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

    useEffect(() => {
        if (onReset) {
            onReset.current = () => {
                setValue_Debounce(value);
            };
        }
    }, [onReset, value]);

    const input = (
        <Input
            type={type}
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
            minLength={minLength}
            maxLength={maxLength}
        />
    );
    return leftAddon || rightAddon ? (
        <InputGroup>
            {leftAddon}
            {input}
            {rightAddon}
        </InputGroup>
    ) : (
        input
    );
}
