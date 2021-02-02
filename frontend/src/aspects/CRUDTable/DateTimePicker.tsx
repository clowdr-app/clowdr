import { HStack, Input, Tooltip, VisuallyHidden } from "@chakra-ui/react";
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
import FAIcon from "../Icons/FAIcon";
import type { EditMode } from "./CRUDTable";

export function DateTimePicker({
    value,
    editMode,
    onChange,
    onBlur,
}: {
    value: Date;
    onChange?: (value: Date) => void;
    onBlur?: () => void;
    editMode?: EditMode;
}): JSX.Element {
    const localTimeZone = useMemo(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }, []);

    const localDateValue = useMemo(() => {
        const localDate = utcToZonedTime(value, localTimeZone);
        return format(localDate, "yyyy-MM-dd");
    }, [localTimeZone, value]);

    const localTimeValue = useMemo(() => {
        const localDate = utcToZonedTime(value, localTimeZone);
        return format(localDate, "HH:mm:ss");
    }, [localTimeZone, value]);

    const parsedValue = useMemo(() => {
        return typeof value === "string" ? new Date(Date.parse(value)) : value;
    }, [value]);

    const setDateTime = useCallback(
        (newDateValue: string) => {
            const newDate = parse(newDateValue, "yyyy-MM-dd", value);
            if (!isValid(newDate)) {
                return;
            }
            const existingLocalDateTime = utcToZonedTime(value, localTimeZone);
            const year = getYear(newDate);
            const month = getMonth(newDate);
            const day = getDate(newDate);
            const newUtcDateTime = zonedTimeToUtc(
                setDate(setMonth(setYear(existingLocalDateTime, year), month), day),
                localTimeZone
            );

            if (newUtcDateTime.getTime() !== parsedValue.getTime()) {
                editMode?.onChange(newUtcDateTime);
                onChange?.(newUtcDateTime);
            }
        },
        [editMode, localTimeZone, onChange, parsedValue, value]
    );

    const setTime = useCallback(
        (newTimeValue: string) => {
            const newTime = parse(newTimeValue, "HH:mm:ss", value);
            if (!isValid(newTime)) {
                return;
            }
            const existingLocalDateTime = utcToZonedTime(value, localTimeZone);
            const hours = getHours(newTime);
            const minutes = getMinutes(newTime);
            const seconds = getSeconds(newTime);
            const newUtcDateTime = zonedTimeToUtc(
                setSeconds(setMinutes(setHours(existingLocalDateTime, hours), minutes), seconds),
                localTimeZone
            );

            if (newUtcDateTime.getTime() !== parsedValue.getTime()) {
                editMode?.onChange(newUtcDateTime);
                onChange?.(newUtcDateTime);
            }
        },
        [editMode, localTimeZone, onChange, parsedValue, value]
    );

    return (
        <HStack onBlur={onBlur}>
            <Input flex="0 0 10em" type="date" value={localDateValue} onChange={(e) => setDateTime(e.target.value)} />
            <Input
                flex="0 0 9em"
                type="time"
                value={localTimeValue}
                onChange={(e) => setTime(e.target.value)}
                step="1"
            />
            <Tooltip label={`Timezone: ${localTimeZone}`}>
                <FAIcon icon="user-clock" iconStyle="s" />
            </Tooltip>
            <VisuallyHidden>Timezone is {localTimeZone}</VisuallyHidden>
        </HStack>
    );
}
