import { Box, Input } from "@chakra-ui/react";
import { format, getDate, getHours, getMinutes, getMonth, getSeconds, getYear, isValid, parse } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import React, { LegacyRef, useEffect, useMemo, useState } from "react";

export const DateTimePicker = React.forwardRef(function DateTimePicker<D extends Date | undefined = Date | undefined>(
    {
        value,
        onChange,
        onBlur,
        onFocus,
        allowUndefined = false,
        size,
        isDisabled = false,
    }: {
        value?: Date;
        onBlur?: (ev: React.FocusEvent) => void;
        onFocus?: () => void;
        onChange?: (value: D) => void;
        allowUndefined?: boolean;
        size?: string;
        isDisabled?: boolean;
    },
    ref: LegacyRef<HTMLInputElement>
): JSX.Element {
    const localTimeZone = useMemo(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }, []);

    // This implementation hinges on the fact that changes to `value` and the
    // internal input state (i.e. the user's manual input) are decoupled. Even
    // if `value` changes, the user's partial input is not overridden/destroyed.
    // However, when a complete internal date is available, the internal state
    // will be emptied by draining the value to the external controller
    // (`onChange`) and then the date/time inputs use the external `value`.

    // The internal strings hold a value while the user is inputting a value.
    // When not defined, the externally controlled `value` is used. The value
    // may be partially completed, such as hh:00 or 01/mm/yyyy.
    const [internalStrs, setInternalStrs] = useState<
        { date: string | undefined; time: string | undefined } | undefined
    >(undefined);

    // The localised strings contain the normalised, localised string versions
    // of the externally controlled current value
    const { localisedDateString, localisedTimeString } = useMemo(() => {
        const localisedDate = value ? utcToZonedTime(value, localTimeZone) : undefined;
        const localisedDateString = localisedDate ? format(localisedDate, "yyyy-MM-dd") : undefined;
        const localisedTimeString = localisedDate ? format(localisedDate, "HH:mm:ss") : undefined;
        return {
            localisedDateString,
            localisedTimeString,
        };
    }, [localTimeZone, value]);

    // When the internal strings change, a change has been made by the user or
    // the internal strings have been reset (i.e. the user has inputted a full
    // valid date / time)
    useEffect(() => {
        // If the internal strings exist, a partial or full valid datetime has
        // been entered
        if (internalStrs) {
            // If both internal strings exist, a full valid datetime has been
            // entered. If only one exists, then the user has typed into one of
            // the two inputs, and for convenience, we will auto-fill the other
            // input.
            if (internalStrs.date !== undefined && internalStrs.time !== undefined) {
                // If the strings are blank, it means the user cleared the
                // datetime.
                if (internalStrs.date === "" || internalStrs.time === "") {
                    // Only call onChange if the value actually changed
                    if (allowUndefined && value) {
                        setInternalStrs(undefined);
                        onChange?.(undefined as D);
                    }
                } else {
                    // Parse the two halves
                    const newDate = parse(internalStrs.date, "yyyy-MM-dd", value ?? new Date());
                    const newTime = parse(
                        internalStrs.time,
                        internalStrs.time.split(":").length === 2 ? "HH:mm" : "HH:mm:ss",
                        value ?? new Date()
                    );
                    // Check both halves are valid. If they aren't, the user is
                    // still in the process of inputting a datetime (i.e. at
                    // least one half is a partial value). So leave the internal
                    // (i.e. user input) state unchanged until a full value is
                    // available.
                    if (!isValid(newTime)) {
                        return;
                    }
                    if (!isValid(newDate)) {
                        return;
                    }

                    // Setup a local datetime with the result...
                    const year = getYear(newDate);
                    const month = getMonth(newDate);
                    const day = getDate(newDate);
                    const hours = getHours(newTime);
                    const minutes = getMinutes(newTime);
                    const seconds = getSeconds(newTime);
                    const result = new Date(year, month, day, hours, minutes, seconds);
                    // ...and convert it to UTC for passing back to external
                    const newUtcDateTime = zonedTimeToUtc(result, localTimeZone);

                    // Only call onChange if the value actually changed
                    if (newUtcDateTime.getTime() !== value?.getTime()) {
                        // Clear the internal state, allowing the externally
                        // supplied value to resume control...
                        setInternalStrs(undefined);
                        // ...and update the externally supplied value by
                        // calling onChange :)
                        onChange?.(newUtcDateTime as D);
                    }
                }
            }
            // Note: If a valid externally controlled value existed, the
            // onChange logic would already have used it to fill in the missing
            // half. Thus here we know that the missing half of the datetime
            // needs to be filled in with a sensible default value
            else if (internalStrs.date) {
                // Default to '0' (midnight) for the time half
                setInternalStrs({ date: internalStrs.date, time: "00:00" });
            } else if (internalStrs.time) {
                // Default to today for the date half
                setInternalStrs({
                    date: format(utcToZonedTime(new Date(), localTimeZone), "yyyy-MM-dd"),
                    time: internalStrs.time,
                });
            }
        }
        // We really only want to run this when the internal strings change.
        // Note: Although you could structure this code as a callback function
        // rather than an effect, it would complicate the state logic for
        // storing the partial results.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internalStrs]);

    return (
        <Box width="auto" display="block" minW="max-content">
            <Input
                onBlur={onBlur}
                onFocus={onFocus}
                size={size}
                flex="0 0 10em"
                width="auto"
                type="date"
                // Prefer the internal date if it's available, but fall back to
                // the externally supplied value if available. Otherwise, use
                // empty string because we still want this to be a controlled
                // input.
                value={internalStrs?.date ?? localisedDateString ?? ""}
                onChange={(e) =>
                    // Use the input value for the date, and use the
                    // closest-to-user-input value for the time
                    setInternalStrs({ date: e.target.value, time: internalStrs?.time ?? localisedTimeString })
                }
                mr={2}
                isDisabled={isDisabled}
                ref={ref}
            />
            <Input
                onBlur={onBlur}
                onFocus={onFocus}
                size={size}
                flex="0 0 9em"
                width="auto"
                type="time"
                // Prefer the internal time if it's available, but fall back to
                // the externally supplied value if available. Otherwise, use
                // empty string because we still want this to be a controlled
                // input.
                value={internalStrs?.time ?? localisedTimeString ?? ""}
                onChange={(e) =>
                    // Use the input value for the time, and use the
                    // closest-to-user-input value for the date
                    setInternalStrs({ date: internalStrs?.date ?? localisedDateString, time: e.target.value })
                }
                step="1"
                isDisabled={isDisabled}
            />
        </Box>
    );
});
