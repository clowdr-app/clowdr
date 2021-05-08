import { gql } from "@apollo/client";
import { Button, FormLabel, Heading, Input, Select, Text, useDisclosure } from "@chakra-ui/react";
import React, { LegacyRef, useMemo, useState } from "react";
import {
    Content_ItemType_Enum,
    ManageContent_ItemFragment,
    Permissions_Permission_Enum,
    useManageContent_DeleteItemsMutation,
    useManageContent_InsertItemMutation,
    useManageContent_SelectAllExhibitionsQuery,
    useManageContent_SelectAllItemsQuery,
    useManageContent_SelectAllTagsQuery,
    useManageContent_UpdateItemMutation,
} from "../../../generated/graphql";
import MultiSelect from "../../Chakra/MultiSelect";
import { MultiSelectColumnFilter, TextColumnFilter } from "../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    DeepWriteable,
    RowSpecification,
    SortDirection,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { maybeCompare } from "../../Utils/maybeSort";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { SecondaryEditor } from "./Content/v2/SecondaryEditor";

gql`
    ## Items

    fragment ManageContent_ItemTag on content_ItemTag {
        id
        itemId
        tagId
    }

    fragment ManageContent_ItemExhibition on content_ItemExhibition {
        id
        conferenceId
        itemId
        exhibitionId
        priority
        layout
    }

    fragment ManageContent_Item on content_Item {
        id
        conferenceId
        title
        shortTitle
        typeName
        itemTags {
            ...ManageContent_ItemTag
        }
    }

    fragment ManageContent_OriginatingData on conference_OriginatingData {
        id
        conferenceId
        sourceId
        data
    }

    fragment ManageContent_Room on room_Room {
        id
        name
    }

    fragment ManageContent_Element on content_Element {
        id
        name
        typeName
        data
        layoutData
        isHidden
        updatedAt
    }

    fragment ManageContent_ProgramPerson on collection_ProgramPerson {
        id
        name
        affiliation
        email
    }

    fragment ManageContent_ItemProgramPerson on content_ItemProgramPerson {
        id
        itemId
        priority
        roleName
        person {
            ...ManageContent_ProgramPerson
        }
    }

    fragment ManageContent_ItemSecondary on content_Item {
        elements {
            ...ManageContent_Element
        }
        itemPeople {
            ...ManageContent_ItemProgramPerson
        }
        itemExhibitions {
            ...ManageContent_ItemExhibition
        }
        rooms {
            ...ManageContent_Room
        }
        chatId
        originatingData {
            ...ManageContent_OriginatingData
        }
    }

    query ManageContent_SelectAllItems($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContent_Item
        }
    }

    query ManageContent_SelectItem($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            ...ManageContent_ItemSecondary
        }
    }

    mutation ManageContent_InsertItem($group: content_Item_insert_input!) {
        insert_content_Item_one(object: $group) {
            ...ManageContent_Item
        }
    }

    mutation ManageContent_UpdateItem($id: uuid!, $update: content_Item_set_input!) {
        update_content_Item_by_pk(pk_columns: { id: $id }, _set: $update) {
            id
        }
    }

    mutation ManageContent_DeleteItems($ids: [uuid!]!) {
        delete_content_Item(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }

    ## Tags

    fragment ManageContent_Tag on collection_Tag {
        id
        conferenceId
        name
        colour
        priority
    }

    query ManageContent_SelectAllTags($conferenceId: uuid!) {
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContent_Tag
        }
    }

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

    ## Exhibitions

    fragment ManageContent_Exhibition on collection_Exhibition {
        id
        conferenceId
        name
        colour
        priority
    }

    query ManageContent_SelectAllExhibitions($conferenceId: uuid!) {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContent_Exhibition
        }
    }

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

function formatEnumValueForLabel(value: string): string {
    const parts = value.split("_");
    return parts.reduce((acc, x) => `${acc} ${x[0]}${x.substr(1).toLowerCase()}`, "").trimStart();
}

export default function ManageConferenceContentPageV2(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage content at ${conference.shortName}`);

    const { loading: loadingAllTags, error: errorAllTags, data: allTags } = useManageContent_SelectAllTagsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllTags, false);

    const {
        loading: loadingAllExhibitions,
        error: errorAllExhibitions,
        data: allExhibitions,
    } = useManageContent_SelectAllExhibitionsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllExhibitions, false);

    const { loading: loadingAllItems, error: errorAllItems, data: allItems } = useManageContent_SelectAllItemsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllItems, false);
    const data = useMemo(() => [...(allItems?.content_Item ?? [])], [allItems?.content_Item]);

    const [insertItem, insertItemResponse] = useManageContent_InsertItemMutation();
    const [deleteItems, deleteItemsResponse] = useManageContent_DeleteItemsMutation();
    const [updateItem, updateItemResponse] = useManageContent_UpdateItemMutation();

    const row: RowSpecification<ManageContent_ItemFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
            invalid: (record) =>
                !record.title?.length
                    ? {
                          columnId: "title",
                          reason: "Title required",
                      }
                    : false,
        }),
        []
    );

    const columns: ColumnSpecification<ManageContent_ItemFragment>[] = useMemo(() => {
        const tagOptions: { value: string; label: string }[] =
            allTags?.collection_Tag.map((tag) => ({
                value: tag.id,
                label: tag.name,
            })) ?? [];

        const typeOptions = Object.keys(Content_ItemType_Enum).map((key) => {
            const value = (Content_ItemType_Enum as any)[key] as string;
            return {
                value,
                label: formatEnumValueForLabel(value),
            };
        });

        const result: ColumnSpecification<ManageContent_ItemFragment>[] = [
            {
                id: "title",
                defaultSortDirection: SortDirection.Asc,
                header: function TitleHeader(props: ColumnHeaderProps<ManageContent_ItemFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Title</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Title{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.title,
                set: (record, value: string) => {
                    record.title = value;
                },
                sort: (x: string | null | undefined, y: string | null | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                filterFn: (rows: Array<ManageContent_ItemFragment>, filterValue: string) => {
                    return rows.filter((row) => row.title.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function TitleCell(props: CellProps<Partial<ManageContent_ItemFragment>>) {
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
                id: "shortTitle",
                header: function ShortTitleHeader(props: ColumnHeaderProps<ManageContent_ItemFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Short Title</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Short Title{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.shortTitle,
                set: (record, value: string | null | undefined) => {
                    record.shortTitle = value !== "" ? value : null;
                },
                sort: (x: string | null | undefined, y: string | null | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                filterFn: (rows: Array<ManageContent_ItemFragment>, filterValue: string) => {
                    return rows.filter((row) => !!row.shortTitle?.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function ShortTitleCell(props: CellProps<Partial<ManageContent_ItemFragment>>) {
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
                id: "typeName",
                header: function ShortTitleHeader(props: ColumnHeaderProps<ManageContent_ItemFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Label</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Label{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.typeName,
                set: (record, value: Content_ItemType_Enum) => {
                    record.typeName = value;
                },
                sort: (x: Content_ItemType_Enum, y: Content_ItemType_Enum) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                filterFn: (
                    rows: Array<ManageContent_ItemFragment>,
                    filterValue: { label: string; value: string }[]
                ) => {
                    const vals = filterValue.map((x) => x.value);
                    return vals.length === 0 ? rows : rows.filter((row) => vals.includes(row.typeName));
                },
                filterEl: MultiSelectColumnFilter(typeOptions),
                cell: function TypeCell(props: CellProps<Partial<ManageContent_ItemFragment>, Content_ItemType_Enum>) {
                    return (
                        <Select
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value as Content_ItemType_Enum)}
                            onBlur={props.onBlur}
                            ref={props.ref as LegacyRef<HTMLSelectElement>}
                            maxW={400}
                        >
                            {typeOptions.map((opt) => {
                                return (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                );
                            })}
                        </Select>
                    );
                },
            },
            {
                id: "itemTags",
                header: function ItemTagsHeader(props: ColumnHeaderProps<ManageContent_ItemFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Tags</FormLabel>
                    ) : (
                        <Text size="xs" p={1} textAlign="center" textTransform="none" fontWeight="normal">
                            Tags
                        </Text>
                    );
                },
                get: (data) =>
                    data.itemTags?.map(
                        (itemTag) =>
                            tagOptions.find((opt) => opt.value === itemTag.tagId) ?? {
                                label: "<Unknown tag>",
                                value: itemTag.tagId,
                            }
                    ) ?? [],
                set: (record, value: { label: string; value: string }[]) => {
                    record.itemTags = value.map((x) => ({
                        itemId: (record.id as any) as DeepWriteable<any>,
                        tagId: (x.value as any) as DeepWriteable<any>,
                        id: (undefined as any) as DeepWriteable<any>,
                    }));
                },
                filterFn: (
                    rows: Array<ManageContent_ItemFragment>,
                    filterValue: ReadonlyArray<{ label: string; value: string }>
                ) => {
                    return filterValue.length === 0
                        ? rows
                        : rows.filter((row) => {
                              return row.itemTags.some((x) => filterValue.some((y) => y.value === x.tagId));
                          });
                },
                filterEl: MultiSelectColumnFilter(tagOptions),
                cell: function ContentCell(
                    props: CellProps<
                        Partial<ManageContent_ItemFragment>,
                        ReadonlyArray<{ label: string; value: string }> | undefined
                    >
                ) {
                    return (
                        <MultiSelect
                            name="tags"
                            options={tagOptions}
                            value={props.value ?? []}
                            placeholder="Select one or more tags"
                            onChange={(ev) => props.onChange?.(ev)}
                            onBlur={props.onBlur}
                            styles={{ container: (base) => ({ ...base, maxWidth: 450 }) }}
                        />
                    );
                },
            },
            // itemExhibitions { -- Secondary editor
            //     id
            //     conferenceId
            //     itemId
            //     exhibitionId
            //     priority
            //     layout
            // }
            // rooms { -- Secondary editor, Link to each room
            //     id
            //     name
            // }
        ];
        return result;
    }, [allTags?.collection_Tag]);

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingId, setEditingId] = useState<string | null>(null);

    const edit:
        | {
              open: (key: string) => void;
          }
        | undefined = useMemo(
        () => ({
            open: (key) => {
                setEditingId(key);
                if (key !== null) {
                    onSecondaryPanelOpen();
                } else {
                    onSecondaryPanelClose();
                }
            },
        }),
        [onSecondaryPanelClose, onSecondaryPanelOpen]
    );

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Content
            </Heading>
            {(loadingAllTags && !allTags) ||
            (loadingAllExhibitions && !allExhibitions) ||
            (loadingAllItems && !allItems?.content_Item) ? (
                <></>
            ) : errorAllTags || errorAllExhibitions || errorAllItems ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <CRUDTable<ManageContent_ItemFragment>
                columns={columns}
                row={row}
                data={
                    !loadingAllTags &&
                    !loadingAllExhibitions &&
                    !loadingAllItems &&
                    (allTags?.collection_Tag && allExhibitions?.collection_Exhibition && allItems?.content_Item
                        ? data
                        : null)
                }
                tableUniqueName="ManageConferenceRegistrants"
                alert={
                    insertItemResponse.error || updateItemResponse.error || deleteItemsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertItemResponse.error?.message ??
                                  updateItemResponse.error?.message ??
                                  deleteItemsResponse.error?.message ??
                                  "Unknown error",
                          }
                        : undefined
                }
                edit={edit}
                // insert={insert}
                // update={update}
                // delete={deleteP}
                // buttons={buttons}
            />
            <SecondaryEditor itemId={editingId} onClose={onSecondaryPanelClose} isOpen={isSecondaryPanelOpen} />
        </RequireAtLeastOnePermissionWrapper>
    );
}
