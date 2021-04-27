import { gql, Reference } from "@apollo/client";
import { Button, FormLabel, Input, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import React, { LegacyRef, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupType_Enum,
    ContentGroup_Set_Input,
    EditableSponsorsTable_UpdateSponsorMutationVariables,
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
        ContentGroup(where: { contentGroupTypeName: { _eq: SPONSOR }, conferenceId: { _eq: $conferenceId } }) {
            ...EditableSponsorsTable_ContentGroupInfo
        }
    }

    mutation EditableSponsorsTable_InsertSponsor($contentGroup: ContentGroup_insert_input!) {
        insert_ContentGroup_one(object: $contentGroup) {
            ...EditableSponsorsTable_ContentGroupInfo
        }
    }

    mutation EditableSponsorsTable_UpdateSponsor($contentGroupId: uuid!, $object: ContentGroup_set_input!) {
        update_ContentGroup_by_pk(pk_columns: { id: $contentGroupId }, _set: $object) {
            id
        }
    }

    mutation EditableSponsorsTable_DeleteSponsor($contentGroupIds: [uuid!]!) {
        delete_ContentGroup(where: { id: { _in: $contentGroupIds } }) {
            returning {
                id
            }
        }
    }

    fragment EditableSponsorsTable_ContentGroupInfo on ContentGroup {
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
    const data = useMemo(() => [...(sponsors.data?.ContentGroup ?? [])], [sponsors.data?.ContentGroup]);

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
                data={!sponsors.loading && (sponsors.data?.ContentGroup ? data : null)}
                columns={columns}
                row={row}
                edit={{
                    open: (key) => {
                        const idx = sponsors.data?.ContentGroup.findIndex((contentGroup) => contentGroup.id === key);
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
                        contentGroupTypeName: ContentGroupType_Enum.Sponsor,
                        originatingDataId: null,
                        shortTitle: "New sponsor",
                        title: "New sponsor",
                    }),
                    makeWhole: (d) => d as SponsorInfoFragment,
                    start: (record) => {
                        insertSponsor({
                            variables: {
                                contentGroup: {
                                    id: record.id,
                                    title: record.title,
                                    shortTitle: record.shortTitle,
                                    conferenceId: conference.id,
                                    contentGroupTypeName: ContentGroupType_Enum.Sponsor,
                                },
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.insert_ContentGroup_one) {
                                    const data = _data.insert_ContentGroup_one;
                                    cache.modify({
                                        fields: {
                                            ContentGroup(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data: {
                                                        ...data,
                                                    },
                                                    fragment: SponsorInfoFragmentDoc,
                                                    fragmentName: "EditableSponsorsTable_ContentGroupInfo",
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
                    start: (record: ContentGroup_Set_Input & { id: any }) => {
                        const variables: DeepMutable<EditableSponsorsTable_UpdateSponsorMutationVariables> = {
                            object: {
                                shortTitle: record.shortTitle,
                                title: record.title,
                            },
                            contentGroupId: record.id,
                        };
                        updateSponsor({
                            variables,
                            optimisticResponse: {
                                update_ContentGroup_by_pk: record,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_ContentGroup_by_pk) {
                                    const data = _data.update_ContentGroup_by_pk;
                                    cache.modify({
                                        fields: {
                                            ContentGroup(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data,
                                                    fragment: SponsorInfoFragmentDoc,
                                                    fragmentName: "EditableSponsorsTable_ContentGroupInfo",
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
                                contentGroupIds: keys,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.delete_ContentGroup) {
                                    const data = _data.delete_ContentGroup;
                                    const deletedIds = data.returning.map((x) => x.id);
                                    cache.modify({
                                        fields: {
                                            ContentGroup(existingRefs: Reference[] = [], { readField }) {
                                                deletedIds.forEach((x) => {
                                                    cache.evict({
                                                        id: x.id,
                                                        fieldName: "EditableSponsorsTable_ContentGroupInfo",
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
                sponsors={sponsors.data?.ContentGroup ?? []}
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
