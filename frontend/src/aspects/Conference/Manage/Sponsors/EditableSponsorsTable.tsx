import { gql, Reference } from "@apollo/client";
import { Button, FormLabel, Input, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import React, { LegacyRef, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    EditableSponsorsTable_UpdateSponsorMutationVariables,
    ItemType_Enum,
    Item_Set_Input,
    useEditableSponsorsTable_DeleteSponsorMutation,
    useEditableSponsorsTable_GetAllSponsorsQuery,
    useEditableSponsorsTable_InsertSponsorMutation,
    useEditableSponsorsTable_UpdateSponsorMutation,
} from "../../../../generated/graphql";
import { TextColumnFilter } from "../../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../../CRUDTable2/CRUDTable2";
import { useConference } from "../../useConference";
import { SponsorSecondaryEditor } from "./SponsorSecondaryEditor";
import { SponsorInfoFragment, SponsorInfoFragmentDoc } from "./Types";

gql`
    query EditableSponsorsTable_GetAllSponsors($conferenceId: uuid!) {
        content_Item(where: { typeName: { _eq: SPONSOR }, conferenceId: { _eq: $conferenceId } }) {
            ...EditableSponsorsTable_ItemInfo
        }
    }

    mutation EditableSponsorsTable_InsertSponsor($item: content_Item_insert_input!) {
        insert_content_Item_one(object: $item) {
            ...EditableSponsorsTable_ItemInfo
        }
    }

    mutation EditableSponsorsTable_UpdateSponsor($itemId: uuid!, $object: content_Item_set_input!) {
        update_content_Item_by_pk(pk_columns: { id: $itemId }, _set: $object) {
            id
        }
    }

    mutation EditableSponsorsTable_DeleteSponsor($itemIds: [uuid!]!) {
        delete_content_Item(where: { id: { _in: $itemIds } }) {
            returning {
                id
            }
        }
    }

    fragment EditableSponsorsTable_ItemInfo on content_Item {
        id
        title
        shortTitle
        room {
            id
        }
    }
`;

enum ColumnId {
    Title = "title",
    ShortTitle = "shortTitle",
}

function rowWarning(_row: SponsorInfoFragment): string | undefined {
    return undefined;
}

export function EditableSponsorsTable(): JSX.Element {
    const conference = useConference();

    const sponsors = useEditableSponsorsTable_GetAllSponsorsQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
    });
    const data = useMemo(() => [...(sponsors.data?.Item ?? [])], [sponsors.data?.Item]);

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [insertSponsor, insertSponsorResponse] = useEditableSponsorsTable_InsertSponsorMutation();
    const [updateSponsor, updateSponsorResponse] = useEditableSponsorsTable_UpdateSponsorMutation();
    const [deleteSponsors, deleteSponsorsResponse] = useEditableSponsorsTable_DeleteSponsorMutation();

    const columns = useMemo<Array<ColumnSpecification<SponsorInfoFragment>>>(
        () => [
            {
                id: ColumnId.Title,
                isDataDependency: false,
                defaultSortDirection: SortDirection.Asc,
                header: function TitleHeader(props: ColumnHeaderProps<SponsorInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Title</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Title{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (record) => record.title,
                set: (record, value: string) => {
                    record.title = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SponsorInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => row.title.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function SponsorTitleCell(props: CellProps<Partial<SponsorInfoFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            ref={props.ref as LegacyRef<HTMLInputElement>}
                        />
                    );
                },
            },
            {
                id: ColumnId.ShortTitle,
                isDataDependency: false,
                defaultSortDirection: SortDirection.Asc,
                header: function ShortTitleHeader(props: ColumnHeaderProps<SponsorInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Short Title</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Short Title{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (record) => record.shortTitle,
                set: (record, value: string) => {
                    record.shortTitle = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SponsorInfoFragment>, filterValue: string) => {
                    return rows.filter(
                        (row) => row.shortTitle && row.shortTitle.toLowerCase().includes(filterValue.toLowerCase())
                    );
                },
                filterEl: TextColumnFilter,
                cell: function SponsorShortTitleCell(props: CellProps<Partial<SponsorInfoFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            ref={props.ref as LegacyRef<HTMLInputElement>}
                        />
                    );
                },
            },
        ],
        []
    );

    const yellow = useColorModeValue("yellow.300", "yellow.700");
    const row = useMemo<RowSpecification<SponsorInfoFragment>>(
        () => ({
            getKey: (record) => record.id,
            colour: (record) => (rowWarning(record) ? yellow : undefined),
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        [yellow]
    );

    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    return (
        <>
            <CRUDTable
                tableUniqueName="ManageConferenceSponsors"
                data={!sponsors.loading && (sponsors.data?.Item ? data : null)}
                columns={columns}
                row={row}
                edit={{
                    open: (key) => {
                        const idx = sponsors.data?.Item.findIndex((item) => item.id === key);
                        const newIdx = idx !== undefined && idx !== -1 ? idx : null;
                        setEditingIndex(newIdx);
                        if (newIdx !== null) {
                            onSecondaryPanelOpen();
                        } else {
                            onSecondaryPanelClose();
                        }
                    },
                }}
                insert={{
                    ongoing: insertSponsorResponse.loading,
                    generateDefaults: () => ({
                        id: uuidv4(),
                        conferenceId: conference.id,
                        typeName: ItemType_Enum.Sponsor,
                        originatingDataId: null,
                        shortTitle: "New sponsor",
                        title: "New sponsor",
                    }),
                    makeWhole: (d) => d as SponsorInfoFragment,
                    start: (record) => {
                        insertSponsor({
                            variables: {
                                item: {
                                    id: record.id,
                                    title: record.title,
                                    shortTitle: record.shortTitle,
                                    conferenceId: conference.id,
                                    typeName: ItemType_Enum.Sponsor,
                                },
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.insert_Item_one) {
                                    const data = _data.insert_Item_one;
                                    cache.modify({
                                        fields: {
                                            Item(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data: {
                                                        ...data,
                                                    },
                                                    fragment: SponsorInfoFragmentDoc,
                                                    fragmentName: "EditableSponsorsTable_ItemInfo",
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
                }}
                update={{
                    ongoing: updateSponsorResponse.loading,
                    start: (record: Item_Set_Input & { id: any }) => {
                        const variables: DeepMutable<EditableSponsorsTable_UpdateSponsorMutationVariables> = {
                            object: {
                                shortTitle: record.shortTitle,
                                title: record.title,
                            },
                            itemId: record.id,
                        };
                        updateSponsor({
                            variables,
                            optimisticResponse: {
                                update_Item_by_pk: record,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_Item_by_pk) {
                                    const data = _data.update_Item_by_pk;
                                    cache.modify({
                                        fields: {
                                            Item(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data,
                                                    fragment: SponsorInfoFragmentDoc,
                                                    fragmentName: "EditableSponsorsTable_ItemInfo",
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
                }}
                delete={{
                    ongoing: deleteSponsorsResponse.loading,
                    start: (keys) => {
                        deleteSponsors({
                            variables: {
                                itemIds: keys,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.delete_Item) {
                                    const data = _data.delete_Item;
                                    const deletedIds = data.returning.map((x) => x.id);
                                    cache.modify({
                                        fields: {
                                            Item(existingRefs: Reference[] = [], { readField }) {
                                                deletedIds.forEach((x) => {
                                                    cache.evict({
                                                        id: x.id,
                                                        fieldName: "EditableSponsorsTable_ItemInfo",
                                                        broadcast: true,
                                                    });
                                                });
                                                return existingRefs.filter(
                                                    (ref) => !deletedIds.includes(readField("id", ref))
                                                );
                                            },
                                        },
                                    });
                                }
                            },
                        });
                    },
                }}
                alert={
                    insertSponsorResponse.error || updateSponsorResponse.error || deleteSponsorsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertSponsorResponse.error?.message ??
                                  updateSponsorResponse.error?.message ??
                                  deleteSponsorsResponse.error?.message ??
                                  "Unknown error",
                          }
                        : undefined
                }
                forceReload={forceReloadRef}
            />
            <SponsorSecondaryEditor
                sponsors={sponsors.data?.Item ?? []}
                index={editingIndex}
                isSecondaryPanelOpen={isSecondaryPanelOpen}
                onSecondaryPanelClose={() => {
                    onSecondaryPanelClose();
                    setEditingIndex(null);
                }}
            />
        </>
    );
}
