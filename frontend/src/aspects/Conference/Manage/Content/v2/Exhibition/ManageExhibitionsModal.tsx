import {
    Box,
    Button,
    Center,
    Checkbox,
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
import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import type { LegacyRef } from "react";
import React, { useCallback, useMemo, useState } from "react";
import { SketchPicker } from "react-color";
import Color from "tinycolor2";
import { v4 as uuidv4 } from "uuid";
import type {
    Collection_Exhibition_Set_Input,
    ManageContent_ExhibitionFragment,
} from "../../../../../../generated/graphql";
import {
    useManageContent_DeleteExhibitionsMutation,
    useManageContent_InsertExhibitionMutation,
    useManageContent_SelectAllExhibitionsQuery,
    useManageContent_UpdateExhibitionMutation,
} from "../../../../../../generated/graphql";
import {
    CheckBoxColumnFilter,
    NumberRangeColumnFilter,
    TextColumnFilter,
} from "../../../../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
} from "../../../../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../../../../CRUDTable2/CRUDTable2";
import { makeContext } from "../../../../../GQL/make-context";
import { maybeCompare } from "../../../../../Utils/maybeSort";
import { useConference } from "../../../../useConference";
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
    const context = useMemo(
        () =>
            makeContext({
                "X-Auth-Role": "organizer",
            }),
        []
    );
    const [exhibitionsResponse] = useManageContent_SelectAllExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
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
                header: function NameHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
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
                filterFn: (rows: Array<ManageContent_ExhibitionFragment>, filterValue: string) => {
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
                }: CellProps<Partial<ManageContent_ExhibitionFragment>>) {
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
                }: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
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
                cell: function EventNameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<ManageContent_ExhibitionFragment>>) {
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
                header: function ColourHeader({ isInCreate }: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
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
                cell: function ShortTitleCell({
                    value,
                    onChange,
                }: CellProps<Partial<ManageContent_ExhibitionFragment>>) {
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
            {
                id: "isHidden",
                header: function Header({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<ManageContent_ExhibitionFragment>) {
                    return isInCreate ? (
                        <FormLabel>Hidden?</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Hidden?{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.isHidden,
                set: (data, value: boolean) => {
                    data.isHidden = value;
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<ManageContent_ExhibitionFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.isHidden === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function Cell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<ManageContent_ExhibitionFragment>, boolean>) {
                    return (
                        <Center>
                            <Checkbox
                                isChecked={value ?? false}
                                onChange={(ev) => onChange?.(ev.target.checked)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLInputElement>}
                            />
                        </Center>
                    );
                },
            },
        ];
        return result;
    }, [colorMode]);

    const data = useMemo(
        () => [...(exhibitionsResponse.data?.collection_Exhibition ?? [])],
        [exhibitionsResponse.data?.collection_Exhibition]
    );

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string | null>(null);
    const [editingDescriptiveItemId, setEditingDescriptiveItemId] = useState<string | null>(null);
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
                        setEditingDescriptiveItemId(exhibition.descriptiveItemId ?? null);
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

    const [insertExhibitionResponse, insertExhibition] = useManageContent_InsertExhibitionMutation();
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
            ongoing: insertExhibitionResponse.fetching,
            generateDefaults: () =>
                ({
                    id: uuidv4(),
                    conferenceId: conference.id,
                    name: "",
                    colour: "rgba(0,0,0,0)",
                    priority: data?.length ?? 0,
                    isHidden: false,
                } as ManageContent_ExhibitionFragment),
            makeWhole: (d) => d as ManageContent_ExhibitionFragment,
            start: (record) => {
                insertExhibition(
                    {
                        exhibition: {
                            conferenceId: record.conferenceId,
                            id: record.id,
                            name: record.name,
                            colour: record.colour,
                            priority: record.priority,
                            isHidden: record.isHidden,
                        },
                    },
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "organizer",
                            },
                        },
                    }
                );
            },
        }),
        [conference.id, data?.length, insertExhibition, insertExhibitionResponse.fetching]
    );

    const [updateExhibitionResponse, updateExhibition] = useManageContent_UpdateExhibitionMutation();
    const update:
        | {
              start: (record: ManageContent_ExhibitionFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: updateExhibitionResponse.fetching,
            start: (record) => {
                const exhibitionUpdateInput: Collection_Exhibition_Set_Input = {
                    name: record.name,
                    colour: record.colour,
                    priority: record.priority,
                    isHidden: record.isHidden,
                };
                updateExhibition(
                    {
                        id: record.id,
                        update: exhibitionUpdateInput,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "organizer",
                            },
                        },
                    }
                );
            },
        }),
        [updateExhibition, updateExhibitionResponse.fetching]
    );

    const [deleteExhibitionsResponse, deleteExhibitions] = useManageContent_DeleteExhibitionsMutation();
    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: deleteExhibitionsResponse.fetching,
            start: (keys) => {
                deleteExhibitions(
                    {
                        ids: keys,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "organizer",
                            },
                        },
                    }
                );
            },
        }),
        [deleteExhibitions, deleteExhibitionsResponse.fetching]
    );

    const updateDescriptiveItemId = useCallback(
        (itemId: string | null) => {
            if (editingId) {
                updateExhibition(
                    {
                        id: editingId,
                        update: {
                            descriptiveItemId: itemId,
                        },
                    },
                    makeContext({
                        [AuthHeader.Role]: "organizer",
                    })
                );
            }
        },
        [editingId, updateExhibition]
    );

    return (
        <>
            {exhibitionsResponse.fetching && !exhibitionsResponse.data ? (
                <Spinner label="Loading exhibitions" />
            ) : undefined}
            <CRUDTable<ManageContent_ExhibitionFragment>
                columns={columns}
                row={row}
                data={!exhibitionsResponse.fetching && (exhibitionsResponse.data?.collection_Exhibition ? data : null)}
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
                descriptiveItemId={editingDescriptiveItemId}
                setDescriptiveItemId={updateDescriptiveItemId}
                onClose={onSecondaryPanelClose}
                isOpen={isSecondaryPanelOpen}
            />
        </>
    );
}
