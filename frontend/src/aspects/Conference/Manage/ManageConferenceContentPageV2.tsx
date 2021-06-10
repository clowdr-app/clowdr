import { gql, Reference } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuGroup,
    MenuItem,
    MenuList,
    Select,
    Text,
    Tooltip,
    useDisclosure,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { LegacyRef, useCallback, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Content_ItemType_Enum,
    Content_Item_Set_Input,
    ManageContent_ItemFragment,
    ManageContent_ItemFragmentDoc,
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
    ExtraButton,
    RowSpecification,
    SortDirection,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { FAIcon } from "../../Icons/FAIcon";
import { maybeCompare } from "../../Utils/maybeSort";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { BulkOperationMenu } from "./Content/v2/BulkOperations/BulkOperationMenu";
import ManageExhibitionsModal from "./Content/v2/Exhibition/ManageExhibitionsModal";
import { SecondaryEditor } from "./Content/v2/Item/SecondaryEditor";
import ManageTagsModal from "./Content/v2/ManageTagsModal";
import { EditElementsPermissionGrantsModal } from "./Content/v2/Security/EditElementsPermissionGrantsModal";
import { SendSubmissionRequestsModal } from "./Content/v2/Submissions/SubmissionRequestsModal";
import { SubmissionsReviewModal } from "./Content/v2/Submissions/SubmissionsReviewModal";

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
        item {
            id
            title
        }
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

    fragment ManageContent_UploadableElement on content_UploadableElement {
        id
        itemId
        typeName
        name
        conferenceId
        uploadsRemaining
        isHidden
        hasBeenUploaded
        element {
            ...ManageContent_Element
        }
    }

    fragment ManageContent_ProgramPerson on collection_ProgramPerson {
        id
        name
        affiliation
        email
        registrantId
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
        typeName
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
        content_Element(where: { itemId: { _eq: $itemId }, uploadableId: { _is_null: true } }) {
            ...ManageContent_Element
        }
        content_UploadableElement(where: { itemId: { _eq: $itemId } }) {
            ...ManageContent_UploadableElement
        }
    }

    query ManageContent_SelectItemPeople($itemId: uuid!) {
        content_ItemProgramPerson(where: { itemId: { _eq: $itemId } }) {
            ...ManageContent_ItemProgramPerson
        }
    }

    mutation ManageContent_InsertItem($item: content_Item_insert_input!, $itemTags: [content_ItemTag_insert_input!]!) {
        insert_content_Item_one(object: $item) {
            ...ManageContent_Item
        }
        insert_content_ItemTag(objects: $itemTags) {
            returning {
                id
            }
        }
    }

    mutation ManageContent_UpdateItem(
        $id: uuid!
        $item: content_Item_set_input!
        $tags: [content_ItemTag_insert_input!]!
        $tagIds: [uuid!]!
    ) {
        insert_content_ItemTag(
            objects: $tags
            on_conflict: { constraint: ItemTag_itemId_tagId_key, update_columns: [] }
        ) {
            returning {
                ...ManageContent_ItemTag
            }
        }
        delete_content_ItemTag(where: { tagId: { _nin: $tagIds }, itemId: { _eq: $id } }) {
            returning {
                id
            }
        }
        update_content_Item_by_pk(pk_columns: { id: $id }, _set: $item) {
            ...ManageContent_Item
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
`;

function formatEnumValueForLabel(value: string): string {
    const parts = value.split("_");
    return parts.reduce((acc, x) => `${acc} ${x[0]}${x.substr(1).toLowerCase()}`, "").trimStart();
}

export default function ManageConferenceContentPageV2(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage content at ${conference.shortName}`);

    const {
        loading: loadingAllTags,
        error: errorAllTags,
        data: allTags,
        refetch: refetchAllTags,
    } = useManageContent_SelectAllTagsQuery({
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

    const {
        loading: loadingAllItems,
        error: errorAllItems,
        data: allItems,
        refetch: refetchAllItems,
    } = useManageContent_SelectAllItemsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllItems, false);
    const data = useMemo(() => [...(allItems?.content_Item ?? [])], [allItems?.content_Item]);

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

    const tagOptions: { value: string; label: string }[] = useMemo(
        () =>
            allTags?.collection_Tag.map((tag) => ({
                value: tag.id,
                label: tag.name,
            })) ?? [],
        [allTags?.collection_Tag]
    );

    const typeOptions = useMemo(
        () =>
            Object.keys(Content_ItemType_Enum).map((key) => {
                const value = (Content_ItemType_Enum as any)[key] as string;
                return {
                    value,
                    label: formatEnumValueForLabel(value),
                };
            }),
        []
    );

    const columns: ColumnSpecification<ManageContent_ItemFragment>[] = useMemo(() => {
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
    }, [tagOptions, typeOptions]);

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [editingIsSponsor, setEditingIsSponsor] = useState<boolean | null>(null);
    const edit:
        | {
              open: (key: string) => void;
          }
        | undefined = useMemo(
        () => ({
            open: (key) => {
                setEditingId(key);
                if (data && key) {
                    const item = data.find((x) => x.id === key);
                    if (item) {
                        setEditingTitle(item.title);
                        setEditingIsSponsor(item.typeName === Content_ItemType_Enum.Sponsor);
                    } else {
                        setEditingTitle(null);
                        setEditingIsSponsor(null);
                    }
                } else {
                    setEditingTitle(null);
                    setEditingIsSponsor(null);
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

    const [insertItem, insertItemResponse] = useManageContent_InsertItemMutation();
    const insert:
        | {
              generateDefaults: () => Partial<ManageContent_ItemFragment>;
              makeWhole: (partialRecord: Partial<ManageContent_ItemFragment>) => ManageContent_ItemFragment | undefined;
              start: (record: ManageContent_ItemFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: insertItemResponse.loading,
            generateDefaults: () =>
                ({
                    id: uuidv4(),
                    conferenceId: conference.id,
                    itemTags: [],
                    title: "",
                    typeName: Content_ItemType_Enum.Paper,
                } as ManageContent_ItemFragment),
            makeWhole: (d) => d as ManageContent_ItemFragment,
            start: (record) => {
                insertItem({
                    variables: {
                        item: {
                            conferenceId: record.conferenceId,
                            id: record.id,
                            title: record.title,
                            shortTitle: record.shortTitle,
                            typeName: record.typeName,
                        },
                        itemTags: record.itemTags,
                    },
                    update: (cache, response) => {
                        if (response.data?.insert_content_Item_one) {
                            const data = response.data?.insert_content_Item_one;
                            cache.modify({
                                fields: {
                                    content_Item(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: ManageContent_ItemFragmentDoc,
                                            fragmentName: "ManageContent_Item",
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
        [conference.id, insertItem, insertItemResponse.loading]
    );

    const [updateItem, updateItemResponse] = useManageContent_UpdateItemMutation();
    const update:
        | {
              start: (record: ManageContent_ItemFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: updateItemResponse.loading,
            start: (record) => {
                const itemUpdateInput: Content_Item_Set_Input = {
                    title: record.title,
                    shortTitle: record.shortTitle,
                    typeName: record.typeName,
                };
                updateItem({
                    variables: {
                        id: record.id,
                        item: itemUpdateInput,
                        tags: record.itemTags.map((x) => ({
                            itemId: x.itemId,
                            tagId: x.tagId,
                        })),
                        tagIds: record.itemTags.map((x) => x.tagId),
                    },
                    optimisticResponse: {
                        update_content_Item_by_pk: record,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.update_content_Item_by_pk) {
                            const data = _data.update_content_Item_by_pk;
                            cache.modify({
                                fields: {
                                    content_Item(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: ManageContent_ItemFragmentDoc,
                                            fragmentName: "ManageContent_Item",
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
        [updateItem, updateItemResponse.loading]
    );

    const [deleteItems, deleteItemsResponse] = useManageContent_DeleteItemsMutation();
    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: deleteItemsResponse.loading,
            start: (keys) => {
                deleteItems({
                    variables: {
                        ids: keys,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.delete_content_Item) {
                            const data = _data.delete_content_Item;
                            const deletedIds = data.returning.map((x) => x.id);
                            deletedIds.forEach((x) => {
                                cache.evict({
                                    id: x.id,
                                    fieldName: "ManageContent_Item",
                                    broadcast: true,
                                });
                            });
                        }
                    },
                });
            },
        }),
        [deleteItems, deleteItemsResponse.loading]
    );

    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    const {
        isOpen: sendSubmissionRequests_IsOpen,
        onOpen: sendSubmissionRequests_OnOpen,
        onClose: sendSubmissionRequests_OnClose,
    } = useDisclosure();
    const {
        isOpen: submissionsReview_IsOpen,
        onOpen: submissionsReview_OnOpen,
        onClose: submissionsReview_OnClose,
    } = useDisclosure();
    const [sendSubmissionRequests_ItemIds, setSendSubmissionRequests_ItemIds] = useState<string[]>([]);
    const [sendSubmissionRequests_UploaderIds, setSendSubmissionRequests_UploaderIds] = useState<string[] | null>(null);
    const [submissionsReview_ItemIds, setSubmissionsReview_ItemIds] = useState<string[]>([]);
    const openSendSubmissionRequests = useCallback(
        (itemId: string, uploaderIds: string[]) => {
            setSendSubmissionRequests_ItemIds([itemId]);
            setSendSubmissionRequests_UploaderIds(uploaderIds);
            sendSubmissionRequests_OnOpen();
        },
        [setSendSubmissionRequests_ItemIds, sendSubmissionRequests_OnOpen, setSendSubmissionRequests_UploaderIds]
    );
    const buttons: ExtraButton<ManageContent_ItemFragment>[] = useMemo(
        () => [
            {
                render: function SendSubmissionRequests({
                    selectedData: items,
                    key,
                }: {
                    selectedData: ManageContent_ItemFragment[];
                    key: string;
                }) {
                    return items.length > 0 ? (
                        <Tooltip
                            key={key}
                            label="Send submission request emails to selected items (first requests, reminders or repeats)."
                        >
                            <Button
                                onClick={() => {
                                    setSendSubmissionRequests_ItemIds(items.map((x) => x.id));
                                    setSendSubmissionRequests_UploaderIds(null);
                                    sendSubmissionRequests_OnOpen();
                                }}
                            >
                                Send submission requests
                            </Button>
                        </Tooltip>
                    ) : (
                        <Menu key={key}>
                            <Tooltip label="Send submission requests (first requests, reminders or repeats).">
                                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                    Send submission requests
                                </MenuButton>
                            </Tooltip>
                            <MenuList overflow="auto" maxH="30vh">
                                <MenuItem
                                    key="all-items"
                                    onClick={() => {
                                        if (allItems?.content_Item) {
                                            setSendSubmissionRequests_ItemIds(allItems.content_Item.map((x) => x.id));
                                            setSendSubmissionRequests_UploaderIds(null);
                                            sendSubmissionRequests_OnOpen();
                                        }
                                    }}
                                >
                                    All items
                                </MenuItem>
                                <MenuGroup title="Items with tag">
                                    {allTags?.collection_Tag
                                        ? R.sortBy((x) => x.name, allTags.collection_Tag).map((tag) => (
                                              <MenuItem
                                                  key={tag.id}
                                                  onClick={() => {
                                                      if (allItems?.content_Item) {
                                                          setSendSubmissionRequests_ItemIds(
                                                              allItems.content_Item
                                                                  .filter((item) =>
                                                                      item.itemTags.some(
                                                                          (itemTag) => itemTag.tagId === tag.id
                                                                      )
                                                                  )
                                                                  .map((x) => x.id)
                                                          );
                                                          setSendSubmissionRequests_UploaderIds(null);
                                                          sendSubmissionRequests_OnOpen();
                                                      }
                                                  }}
                                              >
                                                  {tag.name}
                                              </MenuItem>
                                          ))
                                        : undefined}
                                </MenuGroup>
                            </MenuList>
                        </Menu>
                    );
                },
            },
            {
                render: function SubmissionReviews({
                    selectedData: items,
                    key,
                }: {
                    selectedData: ManageContent_ItemFragment[];
                    key: string;
                }) {
                    return items.length > 0 ? (
                        <Button
                            key={key}
                            onClick={() => {
                                setSubmissionsReview_ItemIds(items.map((x) => x.id));
                                submissionsReview_OnOpen();
                            }}
                        >
                            Review submissions
                        </Button>
                    ) : (
                        <Menu key={key}>
                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                Review submissions
                            </MenuButton>
                            <MenuList overflow="auto" maxH="30vh">
                                <MenuItem
                                    key="all-items"
                                    onClick={() => {
                                        if (allItems?.content_Item) {
                                            setSubmissionsReview_ItemIds(allItems.content_Item.map((x) => x.id));
                                            submissionsReview_OnOpen();
                                        }
                                    }}
                                >
                                    All items
                                </MenuItem>
                                <MenuGroup title="Items with tag">
                                    {allTags?.collection_Tag
                                        ? R.sortBy((x) => x.name, allTags.collection_Tag).map((tag) => (
                                              <MenuItem
                                                  key={tag.id}
                                                  onClick={() => {
                                                      if (allItems?.content_Item) {
                                                          setSubmissionsReview_ItemIds(
                                                              allItems.content_Item
                                                                  .filter((item) =>
                                                                      item.itemTags.some(
                                                                          (itemTag) => itemTag.tagId === tag.id
                                                                      )
                                                                  )
                                                                  .map((x) => x.id)
                                                          );
                                                          submissionsReview_OnOpen();
                                                      }
                                                  }}
                                              >
                                                  {tag.name}
                                              </MenuItem>
                                          ))
                                        : undefined}
                                </MenuGroup>
                            </MenuList>
                        </Menu>
                    );
                },
            },
            {
                render: function RenderBulkOperationMenu({
                    selectedData,
                    key,
                }: {
                    selectedData: ManageContent_ItemFragment[];
                    key: string;
                }) {
                    return (
                        <BulkOperationMenu
                            key={key}
                            selectedData={selectedData}
                            allItems={allItems?.content_Item ?? []}
                            allTags={allTags?.collection_Tag ?? []}
                        />
                    );
                },
            },
        ],
        [allTags?.collection_Tag, sendSubmissionRequests_OnOpen, allItems?.content_Item, submissionsReview_OnOpen]
    );

    const { isOpen: editPGs_IsOpen, onOpen: editPGs_OnOpen, onClose: editPGs_OnClose } = useDisclosure();
    const editPGs_OnCloseFull = useCallback(async () => {
        await refetchAllItems();
        forceReloadRef.current();
        editPGs_OnClose();
    }, [editPGs_OnClose, refetchAllItems]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" id="page-heading" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Content &amp; Sponsors
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
            <Text fontSize="sm">Managing sponsors has been merged with managing content.</Text>
            <HStack spacing={2}>
                <ManageTagsModal
                    onClose={async () => {
                        await Promise.all([refetchAllItems(), refetchAllTags()]);
                        forceReloadRef.current();
                    }}
                />
                <ManageExhibitionsModal
                    onClose={async () => {
                        await Promise.all([refetchAllItems(), refetchAllTags()]);
                        forceReloadRef.current();
                    }}
                />
                <Tooltip label="Manage global element security">
                    <IconButton
                        ml="auto"
                        colorScheme="yellow"
                        aria-label="Manage global element security"
                        icon={<FAIcon iconStyle="s" icon="lock" />}
                        onClick={editPGs_OnOpen}
                    />
                </Tooltip>
            </HStack>
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
                insert={insert}
                update={update}
                delete={deleteProps}
                buttons={buttons}
                forceReload={forceReloadRef}
            />
            <SecondaryEditor
                itemId={editingId}
                itemTitle={editingTitle}
                isSponsor={editingIsSponsor ?? false}
                onClose={onSecondaryPanelClose}
                isOpen={isSecondaryPanelOpen}
                openSendSubmissionRequests={openSendSubmissionRequests}
            />
            <SendSubmissionRequestsModal
                isOpen={sendSubmissionRequests_IsOpen}
                onClose={sendSubmissionRequests_OnClose}
                itemIds={sendSubmissionRequests_ItemIds}
                uploaderIds={sendSubmissionRequests_UploaderIds}
            />
            <SubmissionsReviewModal
                isOpen={submissionsReview_IsOpen}
                onClose={submissionsReview_OnClose}
                itemIds={submissionsReview_ItemIds}
            />
            <EditElementsPermissionGrantsModal
                isOpen={editPGs_IsOpen}
                onClose={editPGs_OnCloseFull}
                elementIds={[]}
                uploadableIds={[]}
                treatEmptyAsAny={true}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
