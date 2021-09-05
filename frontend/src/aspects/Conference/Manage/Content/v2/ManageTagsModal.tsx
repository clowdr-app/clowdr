import { gql, Reference } from "@apollo/client";
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
import React, { LegacyRef, useCallback, useMemo } from "react";
import { SketchPicker } from "react-color";
import Color from "tinycolor2";
import { v4 as uuidv4 } from "uuid";
import {
    Collection_Tag_Set_Input,
    ManageContent_TagFragment,
    ManageContent_TagFragmentDoc,
    useManageContent_DeleteTagsMutation,
    useManageContent_InsertTagMutation,
    useManageContent_SelectAllTagsQuery,
    useManageContent_UpdateTagMutation,
} from "../../../../../generated/graphql";
import { NumberRangeColumnFilter, TextColumnFilter } from "../../../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../../../CRUDTable2/CRUDTable2";
import { maybeCompare } from "../../../../Utils/maybeSort";
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
    const tagsResponse = useManageContent_SelectAllTagsQuery({
        variables: {
            conferenceId: conference.id,
        },
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
                        <Text size="xs" p={1} textAlign="center" textTransform="none" fontWeight="normal">
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

    const [insertTag, insertTagResponse] = useManageContent_InsertTagMutation();
    const insert:
        | {
              generateDefaults: () => Partial<ManageContent_TagFragment>;
              makeWhole: (partialRecord: Partial<ManageContent_TagFragment>) => ManageContent_TagFragment | undefined;
              start: (record: ManageContent_TagFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: insertTagResponse.loading,
            generateDefaults: () =>
                ({
                    id: uuidv4(),
                    conferenceId: conference.id,
                    name: "",
                    colour: "rgba(0,0,0,0)",
                    priority: data?.length ?? 0,
                } as ManageContent_TagFragment),
            makeWhole: (d) => d as ManageContent_TagFragment,
            start: (record) => {
                insertTag({
                    variables: {
                        tag: {
                            conferenceId: record.conferenceId,
                            id: record.id,
                            name: record.name,
                            colour: record.colour,
                            priority: record.priority,
                        },
                    },
                    update: (cache, response) => {
                        if (response.data?.insert_collection_Tag_one) {
                            const data = response.data?.insert_collection_Tag_one;
                            cache.modify({
                                fields: {
                                    collection_Tag(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: ManageContent_TagFragmentDoc,
                                            fragmentName: "ManageContent_Tag",
                                        });
                                        if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                            return existingRefs;
                                        }
                                        return [...existingRefs, newRef];
                                    },
                                },
                            });
                        }
                    },
                });
            },
        }),
        [conference.id, data?.length, insertTag, insertTagResponse.loading]
    );

    const [updateTag, updateTagResponse] = useManageContent_UpdateTagMutation();
    const update:
        | {
              start: (record: ManageContent_TagFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: updateTagResponse.loading,
            start: (record) => {
                const tagUpdateInput: Collection_Tag_Set_Input = {
                    name: record.name,
                    colour: record.colour,
                    priority: record.priority,
                };
                updateTag({
                    variables: {
                        id: record.id,
                        update: tagUpdateInput,
                    },
                    optimisticResponse: {
                        update_collection_Tag_by_pk: record,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.update_collection_Tag_by_pk) {
                            const data = _data.update_collection_Tag_by_pk;
                            cache.modify({
                                fields: {
                                    collection_Tag(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: ManageContent_TagFragmentDoc,
                                            fragmentName: "ManageContent_Tag",
                                        });
                                        if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                            return existingRefs;
                                        }
                                        return [...existingRefs, newRef];
                                    },
                                },
                            });
                        }
                    },
                });
            },
        }),
        [updateTag, updateTagResponse.loading]
    );

    const [deleteTags, deleteTagsResponse] = useManageContent_DeleteTagsMutation();
    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: deleteTagsResponse.loading,
            start: (keys) => {
                deleteTags({
                    variables: {
                        ids: keys,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.delete_collection_Tag) {
                            const data = _data.delete_collection_Tag;
                            const deletedIds = data.returning.map((x) => x.id);
                            deletedIds.forEach((x) => {
                                cache.evict({
                                    id: x.id,
                                    fieldName: "ManageContent_Tag",
                                    broadcast: true,
                                });
                            });
                        }
                    },
                });
            },
        }),
        [deleteTags, deleteTagsResponse.loading]
    );

    return (
        <>
            {tagsResponse.loading && !tagsResponse.data ? <Spinner label="Loading tags" /> : undefined}
            <CRUDTable<ManageContent_TagFragment>
                columns={columns}
                row={row}
                data={!tagsResponse.loading && (tagsResponse.data?.collection_Tag ? data : null)}
                tableUniqueName="ManageConferenceRegistrants"
                alert={
                    insertTagResponse.error || updateTagResponse.error || deleteTagsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertTagResponse.error?.message ??
                                  updateTagResponse.error?.message ??
                                  deleteTagsResponse.error?.message ??
                                  "Unknown error",
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
