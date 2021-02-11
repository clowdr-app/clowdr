import { Box, Input } from "@chakra-ui/react";
import {
    format,
    getDate,
    getHours,
    getMinutes,
    getMonth,
    getSeconds,
    getYear,
    isValid,
    parse,
    setDate,
    setHours,
    setMinutes,
    setMonth,
    setSeconds,
    setYear,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import React, { useCallback, useMemo } from "react";
import type { EditMode } from "./CRUDTable";

export function DateTimePicker<D extends Date | undefined = Date | undefined>({
    value,
    editMode,
    onChange,
    onBlur,
    onFocus,
    allowUndefined = false,
    size,
    isDisabled = false,
}: {
    value?: Date;
    onBlur?: () => void;
    onFocus?: () => void;
    editMode?: EditMode;
    onChange?: (value: D) => void;
    allowUndefined?: boolean;
    size?: string;
    isDisabled?: boolean;
}): JSX.Element {
    const localTimeZone = useMemo(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }, []);

    const localDateValue = useMemo(() => {
        const localDate = value ? utcToZonedTime(value, localTimeZone) : undefined;
        return localDate ? format(localDate, "yyyy-MM-dd") : undefined;
    }, [localTimeZone, value]);

    const localTimeValue = useMemo(() => {
        const localDate = value ? utcToZonedTime(value, localTimeZone) : undefined;
        return localDate ? format(localDate, "HH:mm:ss") : undefined;
    }, [localTimeZone, value]);

    const parsedValue = useMemo(() => {
        return typeof value === "string" ? new Date(value) : !value ? new Date() : value;
    }, [value]);

    const setDateTime = useCallback(
        (newDateValue: string) => {
            if (newDateValue === "" && allowUndefined) {
                onChange?.(undefined as D);
            } else {
                const newDate = parse(newDateValue, "yyyy-MM-dd", value ?? new Date(0));
                if (!isValid(newDate)) {
                    return;
                }
                const existingLocalDateTime = utcToZonedTime(value ?? new Date(0), localTimeZone);
                const year = getYear(newDate);
                const month = getMonth(newDate);
                const day = getDate(newDate);
                const newUtcDateTime = zonedTimeToUtc(
                    setDate(setMonth(setYear(existingLocalDateTime, year), month), day),
                    localTimeZone
                );

                if (newUtcDateTime.getTime() !== parsedValue.getTime()) {
                    editMode?.onChange(newUtcDateTime);
                    onChange?.(newUtcDateTime as D);
                }
            }
        },
        [allowUndefined, editMode, localTimeZone, onChange, parsedValue, value]
    );

    const setTime = useCallback(
        (newTimeValue: string) => {
            if (newTimeValue === "" && allowUndefined) {
                onChange?.(undefined as D);
            } else {
                const newTime = parse(
                    newTimeValue,
                    newTimeValue.split(":").length === 2 ? "HH:mm" : "HH:mm:ss",
                    value ?? new Date()
                );
                if (!isValid(newTime)) {
                    return;
                }
                const existingLocalDateTime = utcToZonedTime(value ?? new Date(), localTimeZone);
                const hours = getHours(newTime);
                const minutes = getMinutes(newTime);
                const seconds = getSeconds(newTime);
                const newUtcDateTime = zonedTimeToUtc(
                    setSeconds(setMinutes(setHours(existingLocalDateTime, hours), minutes), seconds),
                    localTimeZone
                );

                if (newUtcDateTime.getTime() !== parsedValue.getTime()) {
                    editMode?.onChange(newUtcDateTime);
                    onChange?.(newUtcDateTime as D);
                }
            }
        },
        [allowUndefined, editMode, localTimeZone, onChange, parsedValue, value]
    );

    return (
        <Box onBlur={onBlur} onFocus={onFocus} width="auto" display="block" minW="max-content">
            <Input
                size={size}
                flex="0 0 10em"
                width="auto"
                type="date"
                value={localDateValue ?? ""}
                onChange={(e) => setDateTime(e.target.value)}
                mr={2}
                isDisabled={isDisabled}
            />
            <Input
                size={size}
                flex="0 0 9em"
                width="auto"
                type="time"
                value={localTimeValue ?? ""}
                onChange={(e) => setTime(e.target.value)}
                step="1"
                isDisabled={isDisabled}
            />
        </Box>
    );
}
