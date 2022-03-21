import {
    Box,
    Button,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Spinner,
    Text,
    useColorMode,
    useDisclosure,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import type { LegacyRef } from "react";
import React, { useCallback, useMemo } from "react";
import { SketchPicker } from "react-color";
import Color from "tinycolor2";
import { v4 as uuidv4 } from "uuid";
import type { Collection_Tag_Set_Input, ManageContent_TagFragment } from "../../../../../generated/graphql";
import {
    useManageContent_DeleteTagsMutation,
    useManageContent_InsertTagMutation,
    useManageContent_SelectAllTagsQuery,
    useManageContent_UpdateTagMutation,
} from "../../../../../generated/graphql";
import { NumberRangeColumnFilter, TextColumnFilter } from "../../../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
} from "../../../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../../../CRUDTable2/CRUDTable2";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import extractActualError from "../../../../GQL/ExtractActualError";
import { makeContext } from "../../../../GQL/make-context";
import { maybeCompare } from "../../../../Utils/maybeCompare";
import { useConference } from "../../../useConference";

gql`
    mutation ManageContent_InsertTag($tag: collection_Tag_insert_input!) {
        insert_collection_Tag_one(object: $tag) {
            ...ManageContent_Tag
        }
    }

    mutation ManageContent_UpdateTag($id: uuid!, $update: collection_Tag_set_input!) {
        update_collection_Tag_by_pk(pk_columns: { id: $id }, _set: $update) {
            ...ManageContent_Tag
        }
    }

    mutation ManageContent_DeleteTags($ids: [uuid!]!) {
        delete_collection_Tag(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }
`;

export default function ManageTagsModal({ onClose: onCloseCb }: { onClose?: () => void }): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const onCloseInner = useCallback(() => {
        onClose();
        onCloseCb?.();
    }, [onClose, onCloseCb]);

    return (
        <>
            <Button colorScheme="purple" onClick={onOpen}>
                Manage Tags
            </Button>
            <Modal isOpen={isOpen} onClose={onCloseInner} size="4xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent pb={4}>
                    <ModalHeader>Manage Tags</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>{isOpen ? <ManageTagsModalBody /> : undefined}</ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

function ManageTagsModalBody(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [tagsResponse] = useManageContent_SelectAllTagsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });

    const row: RowSpecification<ManageContent_TagFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
            invalid: (record) =>
                !record.name?.length
                    ? {
                          columnId: "name",
                          reason: "Name required",
                      }
                    : false,
        }),
        []
    );

    const { colorMode } = useColorMode();

    const columns: ColumnSpecification<ManageContent_TagFragment>[] = useMemo(() => {
        const result: ColumnSpecification<ManageContent_TagFragment>[] = [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<ManageContent_TagFragment>) {
                    return isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Name{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.name,
                set: (record, value: string) => {
                    record.name = value;
                },
                sort: (x: string | null | undefined, y: string | null | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                filterFn: (rows: Array<ManageContent_TagFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.name ?? "") === "");
                    } else {
                        return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function NameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<ManageContent_TagFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={value ?? ""}
                            onChange={(ev) => onChange?.(ev.target.value)}
                            onBlur={onBlur}
                            ref={ref as LegacyRef<HTMLInputElement>}
                        />
                    );
                },
            },
            {
                id: "priority",
                header: function PriorityHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<ManageContent_TagFragment>) {
                    return isInCreate ? (
                        <FormLabel>Priority</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Priority{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.priority,
                set: (record, value: number) => {
                    record.priority = value;
                },
                sort: (x: number, y: number) => x - y,
                filterFn: (rows: Array<ManageContent_TagFragment>, filterValue: { min?: number; max?: number }) => {
                    return rows.filter(
                        (row) =>
                            (filterValue.min === undefined && filterValue.max === undefined) ||
                            (row.priority &&
                                (filterValue.min === undefined || filterValue.min <= row.priority) &&
                                (filterValue.max === undefined || filterValue.max >= row.priority))
                    );
                },
                filterEl: NumberRangeColumnFilter(-1000, 1000),
                cell: function EventNameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<ManageContent_TagFragment>>) {
                    return (
                        <NumberInput
                            value={value ?? 3000}
                            min={0}
                            max={3000}
                            onChange={(vStr, v) => onChange?.(vStr === "" ? 10 : v)}
                            onBlur={onBlur}
                        >
                            <NumberInputField ref={ref as LegacyRef<HTMLInputElement>} />
                            <NumberInputStepper>
                                <NumberIncrementStepper aria-label="Increment" />
                                <NumberDecrementStepper aria-label="Decrement" />
                            </NumberInputStepper>
                        </NumberInput>
                    );
                },
            },
            {
                id: "colour",
                header: function ColourHeader({ isInCreate }: ColumnHeaderProps<ManageContent_TagFragment>) {
                    return isInCreate ? (
                        <FormLabel>Colour</FormLabel>
                    ) : (
                        <Text fontSize="xs" p={1} textAlign="center" textTransform="none" fontWeight="normal">
                            Colour
                        </Text>
                    );
                },
                get: (data) => data.colour,
                set: (record, value: string | null | undefined) => {
                    record.colour = value && value !== "" ? value : "rgba(0,0,0,0)";
                },
                cell: function ShortTitleCell({ value, onChange }: CellProps<Partial<ManageContent_TagFragment>>) {
                    const colourObj = Color(value);
                    return (
                        <Popover placement="bottom-start" returnFocusOnClose={false} isLazy>
                            <PopoverTrigger>
                                <Button
                                    w="100%"
                                    color={
                                        colourObj.isDark() && !(colorMode === "light" && value === "rgba(0,0,0,0)")
                                            ? "white"
                                            : "black"
                                    }
                                    bgColor={value}
                                >
                                    {value}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <Box color="black">
                                    <SketchPicker
                                        width="100%"
                                        color={value}
                                        onChange={(c) => onChange?.(`rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},1)`)}
                                    />
                                </Box>
                            </PopoverContent>
                        </Popover>
                    );
                },
            },
        ];
        return result;
    }, [colorMode]);

    const data = useMemo(() => [...(tagsResponse.data?.collection_Tag ?? [])], [tagsResponse.data?.collection_Tag]);

    const [insertTagResponse, insertTag] = useManageContent_InsertTagMutation();
    const insert:
        | {
              generateDefaults: () => Partial<ManageContent_TagFragment>;
              makeWhole: (partialRecord: Partial<ManageContent_TagFragment>) => ManageContent_TagFragment | undefined;
              start: (record: ManageContent_TagFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: insertTagResponse.fetching,
            generateDefaults: () =>
                ({
                    id: uuidv4(),
                    conferenceId: conference.id,
                    subconferenceId,
                    name: "",
                    colour: "rgba(0,0,0,0)",
                    priority: data?.length ?? 0,
                } as ManageContent_TagFragment),
            makeWhole: (d) => d as ManageContent_TagFragment,
            start: (record) => {
                insertTag(
                    {
                        tag: {
                            conferenceId: record.conferenceId,
                            subconferenceId,
                            id: record.id,
                            name: record.name,
                            colour: record.colour,
                            priority: record.priority,
                        },
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
            },
        }),
        [conference.id, data?.length, insertTag, insertTagResponse.fetching, subconferenceId]
    );

    const [updateTagResponse, updateTag] = useManageContent_UpdateTagMutation();
    const update:
        | {
              start: (record: ManageContent_TagFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: updateTagResponse.fetching,
            start: (record) => {
                const tagUpdateInput: Collection_Tag_Set_Input = {
                    name: record.name,
                    colour: record.colour,
                    priority: record.priority,
                };
                updateTag(
                    {
                        id: record.id,
                        update: tagUpdateInput,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
            },
        }),
        [updateTag, updateTagResponse.fetching]
    );

    const [deleteTagsResponse, deleteTags] = useManageContent_DeleteTagsMutation();
    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: deleteTagsResponse.fetching,
            start: (keys) => {
                deleteTags(
                    {
                        ids: keys,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
            },
        }),
        [deleteTags, deleteTagsResponse.fetching]
    );

    return (
        <>
            {tagsResponse.fetching && !tagsResponse.data ? <Spinner label="Loading tags" /> : undefined}
            <CRUDTable<ManageContent_TagFragment>
                columns={columns}
                row={row}
                data={!tagsResponse.fetching && (tagsResponse.data?.collection_Tag ? data : null)}
                tableUniqueName="ManageConferenceRegistrants"
                alert={
                    insertTagResponse.error || updateTagResponse.error || deleteTagsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  extractActualError(
                                      insertTagResponse.error ?? updateTagResponse.error ?? deleteTagsResponse.error
                                  ) ?? "Unknown error",
                          }
                        : undefined
                }
                insert={insert}
                update={update}
                delete={deleteProps}
            />
        </>
    );
}
