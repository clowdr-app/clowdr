import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    InputGroup,
    InputRightAddon,
    Link,
    Select,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ManageSchedule_SessionFragment } from "../../../../../generated/graphql";
import type { PanelProps, ValidationState } from "../../../../CRUDCards/Types";
import { DateTimePicker } from "../../../../CRUDTable/DateTimePicker";
import { roundUpToNearest } from "../../../../Utils/MathUtils";

export default function DetailsPanel({
    isCreate,
    isDisabled,
    clearState,
    firstInputRef,
    record,
    updateRecord,
    onValid,
    onInvalid,
    onAnyChange,
}: PanelProps<Partial<ManageSchedule_SessionFragment>>): JSX.Element {
    const hoursOptions = useMemo(() => {
        const result: JSX.Element[] = [];
        for (let i = 0; i <= 4; i++) {
            result.push(
                <option key={i} value={i}>
                    {i}
                </option>
            );
        }
        return result;
    }, []);
    const minutesOptions = useMemo(() => {
        const result: JSX.Element[] = [];
        for (let i = 0; i <= 59; i++) {
            result.push(
                <option key={i} value={i}>
                    {i}
                </option>
            );
        }
        return result;
    }, []);

    const startTime = useMemo(
        () =>
            record.scheduledStartTime
                ? new Date(record.scheduledStartTime)
                : new Date(roundUpToNearest(Date.now(), 1000 * 60 * 5)),
        [record.scheduledStartTime]
    );
    const durationMinutes = useMemo(
        () =>
            startTime && record.scheduledEndTime
                ? Math.max(0, Math.round((Date.parse(record.scheduledEndTime) - startTime.getTime()) / (60 * 1000)))
                : 60,
        [record.scheduledEndTime, startTime]
    );

    const [startTimeHasChanged, setStartTimeHasChanged] = useState<boolean>(false);
    const [startTimeValidation, setStartTimeValidation] = useState<ValidationState>("no error");

    const [durationHasChanged, setDurationHasChanged] = useState<boolean>(false);
    const [durationValidation, setDurationValidation] = useState<ValidationState>("no error");

    const [nameHasChanged, setNameHasChanged] = useState<boolean>(false);
    const [nameValidation, setNameValidation] = useState<ValidationState>("no error");

    const updateValidity = useCallback(() => {
        if (isCreate) {
            if (!nameHasChanged) {
                onInvalid({
                    error: "A name is required.",
                });
                return;
            }
        }
        if (startTimeValidation !== "no error") {
            onInvalid(startTimeValidation);
        } else if (durationValidation !== "no error") {
            onInvalid(durationValidation);
        } else if (nameValidation !== "no error") {
            onInvalid(nameValidation);
        } else {
            onValid();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [durationValidation, isCreate, nameHasChanged, nameValidation, startTimeValidation]);

    clearState.current = useCallback(() => {
        setStartTimeHasChanged(false);
        setDurationHasChanged(false);
        setNameHasChanged(false);

        updateValidity();
    }, [updateValidity]);

    useEffect(() => {
        if (startTimeHasChanged || durationHasChanged || nameHasChanged) {
            onAnyChange();
        }
    }, [durationHasChanged, nameHasChanged, onAnyChange, startTimeHasChanged]);

    useEffect(() => {
        if (startTimeHasChanged) {
            if (record.scheduledStartTime) {
                setStartTimeValidation("no error");
            } else {
                setStartTimeValidation({ error: "A start date/time is required." });
            }
        } else {
            setStartTimeValidation("no error");
        }
    }, [record.scheduledStartTime, startTimeHasChanged]);

    useEffect(() => {
        if (durationHasChanged) {
            if (record.scheduledStartTime && record.scheduledEndTime) {
                const duration = Math.max(
                    0,
                    Math.round(
                        (Date.parse(record.scheduledEndTime) - Date.parse(record.scheduledStartTime)) / (60 * 1000)
                    )
                );
                if (duration >= 3) {
                    setDurationValidation("no error");
                } else {
                    setDurationValidation({ error: "Must be at least 3 minutes." });
                }
            } else {
                setDurationValidation({ error: "Duration is required." });
            }
        } else {
            setDurationValidation("no error");
        }
    }, [durationHasChanged, record.scheduledStartTime, record.scheduledEndTime]);

    useEffect(() => {
        if (nameHasChanged) {
            if (record.item?.title?.length || record.name?.length) {
                setNameValidation("no error");
            } else {
                setNameValidation({ error: "A name is required." });
            }
        } else {
            setNameValidation("no error");
        }
    }, [nameHasChanged, record.item?.title, record.name]);

    useEffect(updateValidity, [updateValidity]);

    return (
        <VStack spacing={4} p={0}>
            <FormControl
                isInvalid={startTimeValidation !== "no error"}
                isDisabled={isDisabled}
                id="editor-session-start-time"
            >
                <FormLabel>Start date and time</FormLabel>
                <DateTimePicker
                    isDisabled={isDisabled}
                    ref={firstInputRef as any}
                    value={startTime}
                    onChange={(value) => {
                        setStartTimeHasChanged(true);

                        updateRecord({
                            ...record,
                            scheduledStartTime: value?.toISOString(),
                            scheduledEndTime: value
                                ? new Date(value.getTime() + durationMinutes * 60 * 1000).toISOString()
                                : new Date(startTime.getTime() + durationMinutes * 60 * 1000).toISOString(),
                        });
                    }}
                />
                <FormHelperText>Enter times in your local timezone.</FormHelperText>
                <FormErrorMessage>
                    {startTimeValidation !== "no error" ? startTimeValidation.error : "No error"}
                </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={durationValidation !== "no error"} isDisabled={isDisabled}>
                <FormLabel id="editor-session-duration-label">Duration</FormLabel>
                <HStack w="auto">
                    <InputGroup w="auto">
                        <Select
                            aria-labelledby="editor-session-duration-label editor-session-duration-hours-label"
                            value={Math.floor(durationMinutes / 60)}
                            onChange={(ev) => {
                                setDurationHasChanged(true);

                                const existingMinutes = durationMinutes % 60;
                                const newHours = parseInt(ev.target.value, 10);
                                const value = newHours * 60 + existingMinutes;
                                const endTime = new Date(startTime.getTime() + value * 60 * 1000);
                                updateRecord({
                                    ...record,
                                    scheduledStartTime: startTime,
                                    scheduledEndTime: endTime.toISOString(),
                                });
                            }}
                        >
                            {hoursOptions}
                        </Select>
                        <InputRightAddon id="editor-session-duration-hours-label">hours</InputRightAddon>
                    </InputGroup>
                    <InputGroup w="auto">
                        <Select
                            aria-labelledby="editor-session-duration-label editor-session-duration-minutes-label"
                            value={durationMinutes % 60}
                            onChange={(ev) => {
                                setDurationHasChanged(true);

                                const existingHours = Math.floor(durationMinutes / 60);
                                const newMinutes = parseInt(ev.target.value, 10);
                                const value = existingHours * 60 + newMinutes;
                                const endTime = new Date(startTime.getTime() + value * 60 * 1000);
                                updateRecord({
                                    ...record,
                                    scheduledEndTime: endTime.toISOString(),
                                });
                            }}
                        >
                            {minutesOptions}
                        </Select>
                        <InputRightAddon id="editor-session-duration-minutes-label">minutes</InputRightAddon>
                    </InputGroup>
                </HStack>
                <FormErrorMessage>
                    {durationValidation !== "no error" ? durationValidation.error : "No error"}
                </FormErrorMessage>
            </FormControl>
            <FormControl id="editor-session-name" isInvalid={nameValidation !== "no error"} isDisabled={isDisabled}>
                <FormLabel>Name of session</FormLabel>
                <Input
                    type="text"
                    value={record.item?.title ?? record.name ?? ""}
                    onChange={(ev) => {
                        setNameHasChanged(true);

                        const value = ev.target.value;
                        updateRecord({
                            ...record,
                            item: record.item ? { ...record.item, title: value } : { title: value },
                        });
                    }}
                />
                <FormErrorMessage>{nameValidation !== "no error" ? nameValidation.error : "No error"}</FormErrorMessage>
            </FormControl>
            <FormControl id="editor-session-description" isDisabled={isDisabled}>
                <FormLabel>Session description (abstract)</FormLabel>
                <Textarea />
                <FormHelperText>
                    Use{" "}
                    <Link isExternal href="https://itsfoss.com/markdown-guide/">
                        Markdown syntax
                        <sup>
                            <ExternalLinkIcon />
                        </sup>
                    </Link>{" "}
                    to format your text.
                </FormHelperText>
            </FormControl>
            {/* TODO: Tags */}
            {/* TODO: For "presentations": 
                    <FormControl id="editor-session-type" isDisabled={isDisabled}>
                        <FormLabel>Session type</FormLabel>
                        <Select></Select>
                        <FormHelperText>
                            This is a descriptive label only, to help your attendees understand what kind of session this is.
                        </FormHelperText>
            </FormControl>*/}
        </VStack>
    );
}
