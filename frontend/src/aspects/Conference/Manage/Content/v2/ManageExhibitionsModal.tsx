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
import React, { LegacyRef, useCallback, useMemo, useState } from "react";
import { SketchPicker } from "react-color";
import Color from "tinycolor2";
import { v4 as uuidv4 } from "uuid";
import {
    Collection_Exhibition_Set_Input,
    ManageContent_ExhibitionFragment,
    ManageContent_ExhibitionFragmentDoc,
    useManageContent_DeleteExhibitionsMutation,
    useManageContent_InsertExhibitionMutation,
    useManageContent_SelectAllExhibitionsQuery,
    useManageContent_UpdateExhibitionMutation,
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
import { SecondaryEditor } from "./ExhibitionSecondaryEditor";

gql`
    mutation ManageContent_InsertExhibition($exhibition: collection_Exhibition_insert_input!) {
        insert_collection_Exhibition_one(object: $exhibition) {
            ...ManageContent_Exhibition
        }
    }

    mutation ManageContent_UpdateExhibition($id: uuid!, $update: collection_Exhibition_set_input!) {
        update_collection_Exhibition_by_pk(pk_columns: { id: $id }, _set: $update) {
            ...ManageContent_Exhibition
        }
    }

    mutation ManageContent_DeleteExhibitions($ids: [uuid!]!) {
        delete_collection_Exhibition(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }
`;

export default function ManageExhibitionsModal({ onClose: onCloseCb }: { onClose?: () => void }): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const onCloseInner = useCallback(() => {
        onClose();
        onCloseCb?.();
    }, [onClose, onCloseCb]);

    return (
        <>
            <Button colorScheme="purple" onClick={onOpen}>
                Manage Exhibitions
            </Button>
            <Modal isOpen={isOpen} onClose={onCloseInner} size="4xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent pb={4}>
                    <ModalHeader>Manage Exhibitions</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>{isOpen ? <ManageExhibitionsModalBody /> : undefined}</ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

function ManageExhibitionsModalBody(): JSX.Element {
    const conference = useConference();
    const exhibitionsResponse = useManageContent_SelectAllExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const row: RowSpecification<ManageContent_ExhibitionFragment> = useMemo(
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

    const columns: ColumnSpecification<ManageContent_ExhibitionFragment>[] = useMemo(() => {
        const result: ColumnSpecification<ManageContent_ExhibitionFragment>[] = [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Name{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.name,
                set: (record, value: string) => {
                    record.name = value;
                },
                sort: (x: string | null | undefined, y: string | null | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                filterFn: (rows: Array<ManageContent_ExhibitionFragment>, filterValue: string) => {
                    return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function NameCell(props: CellProps<Partial<ManageContent_ExhibitionFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            ref={props.ref as LegacyRef<HTMLInputElement>}
                        />
                    );
                },
            },
            {
                id: "priority",
                header: function PriorityHeader(props: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Priority</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Priority{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.priority,
                set: (record, value: number) => {
                    record.priority = value;
                },
                sort: (x: number, y: number) => x - y,
                filterFn: (
                    rows: Array<ManageContent_ExhibitionFragment>,
                    filterValue: { min?: number; max?: number }
                ) => {
                    return rows.filter(
                        (row) =>
                            (filterValue.min === undefined && filterValue.max === undefined) ||
                            (row.priority &&
                                (filterValue.min === undefined || filterValue.min <= row.priority) &&
                                (filterValue.max === undefined || filterValue.max >= row.priority))
                    );
                },
                filterEl: NumberRangeColumnFilter(-1000, 1000),
                cell: function EventNameCell(props: CellProps<Partial<ManageContent_ExhibitionFragment>>) {
                    return (
                        <NumberInput
                            value={props.value ?? 3000}
                            min={0}
                            max={3000}
                            onChange={(vStr, v) => props.onChange?.(vStr === "" ? 10 : v)}
                            onBlur={props.onBlur}
                        >
                            <NumberInputField ref={props.ref as LegacyRef<HTMLInputElement>} />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    );
                },
            },
            {
                id: "colour",
                header: function ColourHeader(props: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
                    return props.isInCreate ? (
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
                cell: function ShortTitleCell(props: CellProps<Partial<ManageContent_ExhibitionFragment>>) {
                    const colourObj = Color(props.value);
                    return (
                        <Popover placement="bottom-start" returnFocusOnClose={false} isLazy>
                            <PopoverTrigger>
                                <Button
                                    w="100%"
                                    color={
                                        colourObj.isDark() &&
                                        !(colorMode === "light" && props.value === "rgba(0,0,0,0)")
                                            ? "white"
                                            : "black"
                                    }
                                    bgColor={props.value}
                                >
                                    {props.value}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <Box color="black">
                                    <SketchPicker
                                        width="100%"
                                        color={props.value}
                                        onChange={(c) => props.onChange?.(`rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},1)`)}
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

    const data = useMemo(() => [...(exhibitionsResponse.data?.collection_Exhibition ?? [])], [
        exhibitionsResponse.data?.collection_Exhibition,
    ]);

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string | null>(null);
    const edit:
        | {
              open: (key: string) => void;
          }
        | undefined = useMemo(
        () => ({
            open: (key) => {
                setEditingId(key);
                if (data && key) {
                    const exhibition = data.find((x) => x.id === key);
                    if (exhibition) {
                        setEditingName(exhibition.name);
                    }
                }
                if (key !== null) {
                    onSecondaryPanelOpen();
                } else {
                    onSecondaryPanelClose();
                }
            },
        }),
        [data, onSecondaryPanelClose, onSecondaryPanelOpen]
    );

    const [insertExhibition, insertExhibitionResponse] = useManageContent_InsertExhibitionMutation();
    const insert:
        | {
              generateDefaults: () => Partial<ManageContent_ExhibitionFragment>;
              makeWhole: (
                  partialRecord: Partial<ManageContent_ExhibitionFragment>
              ) => ManageContent_ExhibitionFragment | undefined;
              start: (record: ManageContent_ExhibitionFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: insertExhibitionResponse.loading,
            generateDefaults: () =>
                ({
                    id: uuidv4(),
                    conferenceId: conference.id,
                    name: "",
                    colour: "rgba(0,0,0,0)",
                    priority: data?.length ?? 0,
                } as ManageContent_ExhibitionFragment),
            makeWhole: (d) => d as ManageContent_ExhibitionFragment,
            start: (record) => {
                insertExhibition({
                    variables: {
                        exhibition: {
                            conferenceId: record.conferenceId,
                            id: record.id,
                            name: record.name,
                            colour: record.colour,
                            priority: record.priority,
                        },
                    },
                    update: (cache, response) => {
                        if (response.data?.insert_collection_Exhibition_one) {
                            const data = response.data?.insert_collection_Exhibition_one;
                            cache.modify({
                                fields: {
                                    collection_Exhibition(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: ManageContent_ExhibitionFragmentDoc,
                                            fragmentName: "ManageContent_Exhibition",
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
        [conference.id, data?.length, insertExhibition, insertExhibitionResponse.loading]
    );

    const [updateExhibition, updateExhibitionResponse] = useManageContent_UpdateExhibitionMutation();
    const update:
        | {
              start: (record: ManageContent_ExhibitionFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: updateExhibitionResponse.loading,
            start: (record) => {
                const exhibitionUpdateInput: Collection_Exhibition_Set_Input = {
                    name: record.name,
                    colour: record.colour,
                    priority: record.priority,
                };
                updateExhibition({
                    variables: {
                        id: record.id,
                        update: exhibitionUpdateInput,
                    },
                    optimisticResponse: {
                        update_collection_Exhibition_by_pk: record,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.update_collection_Exhibition_by_pk) {
                            const data = _data.update_collection_Exhibition_by_pk;
                            cache.modify({
                                fields: {
                                    collection_Exhibition(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: ManageContent_ExhibitionFragmentDoc,
                                            fragmentName: "ManageContent_Exhibition",
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
        [updateExhibition, updateExhibitionResponse.loading]
    );

    const [deleteExhibitions, deleteExhibitionsResponse] = useManageContent_DeleteExhibitionsMutation();
    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: deleteExhibitionsResponse.loading,
            start: (keys) => {
                deleteExhibitions({
                    variables: {
                        ids: keys,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.delete_collection_Exhibition) {
                            const data = _data.delete_collection_Exhibition;
                            const deletedIds = data.returning.map((x) => x.id);
                            deletedIds.forEach((x) => {
                                cache.evict({
                                    id: x.id,
                                    fieldName: "ManageContent_Exhibition",
                                    broadcast: true,
                                });
                            });
                        }
                    },
                });
            },
        }),
        [deleteExhibitions, deleteExhibitionsResponse.loading]
    );

    return (
        <>
            {exhibitionsResponse.loading && !exhibitionsResponse.data ? (
                <Spinner label="Loading exhibitions" />
            ) : undefined}
            <CRUDTable<ManageContent_ExhibitionFragment>
                columns={columns}
                row={row}
                data={!exhibitionsResponse.loading && (exhibitionsResponse.data?.collection_Exhibition ? data : null)}
                tableUniqueName="ManageConferenceRegistrants"
                alert={
                    insertExhibitionResponse.error || updateExhibitionResponse.error || deleteExhibitionsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertExhibitionResponse.error?.message ??
                                  updateExhibitionResponse.error?.message ??
                                  deleteExhibitionsResponse.error?.message ??
                                  "Unknown error",
                          }
                        : undefined
                }
                edit={edit}
                insert={insert}
                update={update}
                delete={deleteProps}
            />
            <SecondaryEditor
                exhibitionId={editingId}
                exhibitionName={editingName}
                onClose={onSecondaryPanelClose}
                isOpen={isSecondaryPanelOpen}
            />
        </>
    );
}
