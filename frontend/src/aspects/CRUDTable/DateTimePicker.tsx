import { HStack, Input, Text } from "@chakra-ui/react";
import {
    format,
    getDay,
    getHours,
    getMinutes,
    getMonth,
    getSeconds,
    getYear,
    isEqual,
    isValid,
    parse,
    setDay,
    setHours,
    setMinutes,
    setMonth,
    setSeconds,
    setYear,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { EditMode } from "./CRUDTable";

export function DateTimePicker({ value, editMode }: { value: Date; editMode: EditMode }): JSX.Element {
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

    const [utcDateTime, setUtcDateTime] = useState<Date>(value);

    useEffect(() => {
        if (utcDateTime && !isEqual(utcDateTime, value)) {
            editMode.onChange(utcDateTime);
        }
    }, [utcDateTime, editMode, value]);

    // useEffect(() => {
    //     if (!dateTime || !isEqual(value, dateTime)) {
    //         setDateTime(value);
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [value]);

    const setDate = useCallback(
        (newDateValue: string) => {
            const newDate = parse(newDateValue, "yyyy-MM-dd", value);
            if (!isValid(newDate)) {
                return;
            }
            const existingLocalDateTime = utcToZonedTime(utcDateTime, localTimeZone);
            const year = getYear(newDate);
            const month = getMonth(newDate);
            const day = getDay(newDate);
            const newUtcDateTime = zonedTimeToUtc(
                setDay(setMonth(setYear(existingLocalDateTime, year), month), day),
                localTimeZone
            );

            if (!utcDateTime || !isEqual(newUtcDateTime, utcDateTime)) {
                setUtcDateTime(newUtcDateTime);
            }
        },
        [localTimeZone, utcDateTime, value]
    );

    const setTime = useCallback(
        (newTimeValue: string) => {
            const newTime = parse(newTimeValue, "HH:mm:ss", value);
            if (!isValid(newTime)) {
                return;
            }
            const existingLocalDateTime = utcToZonedTime(utcDateTime, localTimeZone);
            const hours = getHours(newTime);
            const minutes = getMinutes(newTime);
            const seconds = getSeconds(newTime);
            const newUtcDateTime = zonedTimeToUtc(
                setSeconds(setMinutes(setHours(existingLocalDateTime, hours), minutes), seconds),
                localTimeZone
            );

            if (!utcDateTime || !isEqual(newUtcDateTime, utcDateTime)) {
                setUtcDateTime(newUtcDateTime);
            }
        },
        [localTimeZone, utcDateTime, value]
    );

    return (
        <HStack>
            <Input type="date" value={localDateValue} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={localTimeValue} onChange={(e) => setTime(e.target.value)} />
            <Text>({localTimeZone})</Text>
        </HStack>
    );
}
