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
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "urql";
import type { ManageSchedule_SessionFragment } from "../../../../../generated/graphql";
import { useManageSchedule_GetTagsQuery } from "../../../../../generated/graphql";
import { CreatableMultiSelect } from "../../../../Chakra/MultiSelect";
import type { PanelProps, ValidationState } from "../../../../CRUDCards/Types";
import { DateTimePicker } from "../../../../CRUDTable/DateTimePicker";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { roundUpToNearest } from "../../../../Utils/MathUtils";
import { useConference } from "../../../useConference";
import CreateTagModal from "./CreateTagModal";

gql`
    fragment ManageSchedule_Tag on collection_Tag {
        id
        name
        priority
        colour
    }

    query ManageSchedule_GetTags($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        collection_Tag(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }
            order_by: [{ name: asc }]
        ) {
            ...ManageSchedule_Tag
        }
    }
`;

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

    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [tagsResponse, refetchTags] = useManageSchedule_GetTagsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });
    const tagOptions = useMemo(() => {
        const result =
            tagsResponse.data?.collection_Tag.map((x) => ({
                label: x.name,
                value: x.id,
            })) ?? [];
        result.push({
            label: "Create a tag",
            value: "¬create¬",
        });
        return result;
    }, [tagsResponse.data?.collection_Tag]);
    const tagValues = useMemo(
        () =>
            record.item?.itemTags?.map((x) => ({
                label: tagsResponse.data?.collection_Tag.find((y) => y.id === x.tagId)?.name ?? "<Loading...>",
                value: x.tagId,
            })) ?? [],
        [record.item?.itemTags, tagsResponse.data?.collection_Tag]
    );

    const [createTagName, setCreateTagName] = useState<string>("");
    const createTagDisclosure = useDisclosure();
    const onCreateTag = useCallback(
        (newTagId: string) => {
            refetchTags();
            onAnyChange();
            updateRecord((old) => ({
                ...old,
                item: {
                    ...old.item,
                    itemTags: [
                        ...(old.item?.itemTags ?? []),
                        {
                            tagId: newTagId,
                        },
                    ],
                },
            }));
        },
        [onAnyChange, refetchTags, updateRecord]
    );

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

                        updateRecord((old) => ({
                            ...old,
                            scheduledStartTime: value?.toISOString(),
                            scheduledEndTime: value
                                ? new Date(value.getTime() + durationMinutes * 60 * 1000).toISOString()
                                : new Date(startTime.getTime() + durationMinutes * 60 * 1000).toISOString(),
                        }));
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
                                updateRecord((old) => ({
                                    ...old,
                                    scheduledStartTime: startTime,
                                    scheduledEndTime: endTime.toISOString(),
                                }));
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
                                updateRecord((old) => ({
                                    ...old,
                                    scheduledEndTime: endTime.toISOString(),
                                }));
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
                        updateRecord((old) => ({
                            ...old,
                            item: old.item ? { ...old.item, title: value } : { title: value },
                        }));
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
            <FormControl>
                <FormLabel>Tags</FormLabel>
                <CreatableMultiSelect
                    options={tagOptions}
                    value={tagValues}
                    onCreateOption={(value) => {
                        setCreateTagName(value);
                        createTagDisclosure.onOpen();
                    }}
                    onChange={(options, action) => {
                        if (
                            action.action === "create-option" ||
                            (action.action === "select-option" && action.option?.value === "¬create¬")
                        ) {
                            setCreateTagName(action.action === "create-option" ? action.name ?? "" : "");
                            createTagDisclosure.onOpen();
                        } else {
                            const tagIds = R.uniq(options.filter((x) => x.value !== "¬create¬").map((x) => x.value));
                            onAnyChange();
                            updateRecord((old) => ({
                                ...old,
                                item: {
                                    ...old.item,
                                    itemTags: tagIds.map((tagId) => ({ tagId })),
                                },
                            }));
                        }
                    }}
                />
            </FormControl>
            {/* TODO: For "presentations": 
                    <FormControl id="editor-session-type" isDisabled={isDisabled}>
                        <FormLabel>Session type</FormLabel>
                        <Select></Select>
                        <FormHelperText>
                            This is a descriptive label only, to help your attendees understand what kind of session this is.
                        </FormHelperText>
            </FormControl>*/}
            <CreateTagModal
                initialName={createTagName}
                isOpen={createTagDisclosure.isOpen}
                onClose={createTagDisclosure.onClose}
                onCreate={onCreateTag}
            />
        </VStack>
    );
}
