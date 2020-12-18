import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Heading,
    Spinner,
    Text,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentBaseType, ItemBaseTypes } from "../../../../../shared/types/content";
import {
    ContentGroupType_Enum,
    ContentGroup_Insert_Input,
    ContentItem_Insert_Input,
    ContentType_Enum,
    Permission_Enum,
    RequiredContentItem_Insert_Input,
    useInsertDeleteContentGroupsMutation,
    useSelectAllContentGroupsQuery,
    useUpdateContentGroupMutation,
    useUpdateContentItemMutation,
    useUpdateRequiredContentItemMutation,
} from "../../../generated/graphql";
import CRUDTable, {
    CRUDTableProps,
    defaultSelectFilter,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    SecondaryEditorFooterButton,
    SelectOption,
    UpdateResult,
} from "../../CRUDTable/CRUDTable";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import useCurrentUser from "../../Users/CurrentUser/useCurrentUser";
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { LinkItemTemplate } from "./Content/LinkItem";
import { TextItemTemplate } from "./Content/TextItem";
import type {
    ContentDescriptor,
    ContentGroupDescriptor,
    ContentItemDescriptor,
    ItemBaseTemplate,
    RequiredContentItemDescriptor,
} from "./Content/Types";
import { URLItemTemplate } from "./Content/URLItem";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    fragment RequiredContentItemInfo on RequiredContentItem {
        id
        name
        contentTypeName
        conferenceId
        contentGroupId
    }

    fragment ContentItemInfo on ContentItem {
        conferenceId
        contentGroupId
        contentTypeName
        data
        id
        isHidden
        layoutData
        name
        requiredContentId
        requiredContentItem {
            ...RequiredContentItemInfo
        }
    }

    fragment ContentGroupTagInfo on ContentGroupTag {
        id
        tagId
        contentGroupId
    }

    fragment ContentGroupFullNestedInfo on ContentGroup {
        id
        conferenceId
        contentGroupTypeName
        title
        shortTitle
        requiredContentItems {
            ...RequiredContentItemInfo
        }
        contentItems {
            ...ContentItemInfo
        }
        contentGroupTags {
            ...ContentGroupTagInfo
        }
    }

    query SelectAllContentGroups($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ContentGroupFullNestedInfo
        }
    }

    mutation InsertDeleteContentGroups($newGroups: [ContentGroup_insert_input!]!, $deleteGroupIds: [uuid!]!) {
        insert_ContentGroup(objects: $newGroups) {
            returning {
                ...ContentGroupFullNestedInfo
            }
        }
        delete_ContentGroup(where: { id: { _in: $deleteGroupIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateContentGroup(
        $newItems: [ContentItem_insert_input!]!
        $newRequiredItems: [RequiredContentItem_insert_input!]!
        $newGroupTags: [ContentGroupTag_insert_input!]!
        $groupId: uuid!
        $contentGroupTypeName: ContentGroupType_enum!
        $originatingDataId: uuid = null
        $shortTitle: String = null
        $title: String!
        $deleteItemIds: [uuid!]!
        $deleteRequiredItemIds: [uuid!]!
        $deleteGroupTagIds: [uuid!]!
    ) {
        insert_ContentItem(objects: $newItems) {
            returning {
                ...ContentItemInfo
            }
        }
        insert_RequiredContentItem(objects: $newRequiredItems) {
            returning {
                ...RequiredContentItemInfo
            }
        }
        insert_ContentGroupTag(objects: $newGroupTags) {
            returning {
                ...ContentGroupTagInfo
            }
        }
        update_ContentGroup_by_pk(
            pk_columns: { id: $groupId }
            _set: {
                contentGroupTypeName: $contentGroupTypeName
                originatingDataId: $originatingDataId
                shortTitle: $shortTitle
                title: $title
            }
        ) {
            ...ContentGroupFullNestedInfo
        }
        delete_ContentItem(where: { id: { _in: $deleteItemIds } }) {
            returning {
                id
            }
        }
        delete_RequiredContentItem(where: { id: { _in: $deleteRequiredItemIds } }) {
            returning {
                id
            }
        }
        delete_ContentGroupTag(where: { id: { _in: $deleteGroupTagIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateContentItem(
        $id: uuid!
        $contentTypeName: ContentType_enum!
        $layoutData: jsonb!
        $name: String!
        $data: jsonb!
        $originatingDataId: uuid = null
        $requiredContentId: uuid = null
    ) {
        update_ContentItem_by_pk(
            pk_columns: { id: $id }
            _set: {
                contentTypeName: $contentTypeName
                layoutData: $layoutData
                name: $name
                data: $data
                originatingDataId: $originatingDataId
                requiredContentId: $requiredContentId
            }
        ) {
            ...ContentItemInfo
        }
    }

    mutation UpdateRequiredContentItem(
        $id: uuid!
        $contentTypeName: ContentType_enum!
        $name: String!
        $originatingDataId: uuid = null
    ) {
        update_RequiredContentItem_by_pk(
            pk_columns: { id: $id }
            _set: { contentTypeName: $contentTypeName, name: $name, originatingDataId: $originatingDataId }
        ) {
            ...RequiredContentItemInfo
        }
    }
`;

const ContentGroupCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupDescriptor, "id">>) => CRUDTable(props);

const ItemBaseTemplates: { [K in ContentBaseType]: ItemBaseTemplate } = {
    [ContentBaseType.File]: { supported: false },
    [ContentBaseType.Link]: LinkItemTemplate,
    [ContentBaseType.Text]: TextItemTemplate,
    [ContentBaseType.URL]: URLItemTemplate,
    [ContentBaseType.Video]: { supported: false },
};

type GroupTemplate =
    | {
          supported: false;
      }
    | {
          supported: true;
          requiredItemTypes: ContentType_Enum[];
          itemTypes: ContentType_Enum[];
      };

const GroupTemplates: { [K in ContentGroupType_Enum]: GroupTemplate } = {
    [ContentGroupType_Enum.Keynote]: { supported: false },
    [ContentGroupType_Enum.Other]: { supported: false },
    [ContentGroupType_Enum.Paper]: {
        supported: true,
        requiredItemTypes: [ContentType_Enum.VideoPrepublish, ContentType_Enum.VideoBroadcast],
        itemTypes: [ContentType_Enum.Abstract, ContentType_Enum.PaperLink],
    },
    [ContentGroupType_Enum.Poster]: { supported: false },
    [ContentGroupType_Enum.Sponsor]: { supported: false },
    [ContentGroupType_Enum.Symposium]: { supported: false },
    [ContentGroupType_Enum.Workshop]: { supported: false },
};

export default function ManageConferenceContentPage(): JSX.Element {
    const conference = useConference();
    const currentUser = useCurrentUser();

    useDashboardPrimaryMenuButtons();

    const {
        loading: loadingAllContentGroups,
        error: errorAllContentGroups,
        data: allContentGroups,
    } = useSelectAllContentGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllContentGroups);

    const [insertDeleteContentGroupsMutation] = useInsertDeleteContentGroupsMutation();
    const [updateContentGroupMutation] = useUpdateContentGroupMutation();
    const [updateContentItemMutation] = useUpdateContentItemMutation();
    const [updateRequiredContentItemMutation] = useUpdateRequiredContentItemMutation();

    const parsedDBContentGroups = useMemo(() => {
        if (!allContentGroups) {
            return undefined;
        }

        return new Map(
            allContentGroups.ContentGroup.map((item): [string, ContentGroupDescriptor] => [
                item.id,
                {
                    id: item.id,
                    title: item.title,
                    shortTitle: item.shortTitle,
                    typeName: item.contentGroupTypeName,
                    tags: item.contentGroupTags.map((x) => x.tagId),
                    items: item.contentItems.map((item) => ({
                        id: item.id,
                        isHidden: item.isHidden,
                        name: item.name,
                        typeName: item.contentTypeName,
                        data: item.data,
                        layoutData: item.layoutData,
                        requiredContentId: item.requiredContentId,
                    })),
                    requiredItems: item.requiredContentItems.map((item) => ({
                        id: item.id,
                        name: item.name,
                        typeName: item.contentTypeName,
                    })),
                },
            ])
        );
    }, [allContentGroups]);

    const groupTypeOptions: SelectOption[] = useMemo(() => {
        return Object.keys(ContentGroupType_Enum)
            .filter(
                (key) =>
                    typeof (ContentGroupType_Enum as any)[key] === "string" &&
                    GroupTemplates[(ContentGroupType_Enum as any)[key] as ContentGroupType_Enum].supported
            )
            .map((key) => {
                const v = (ContentGroupType_Enum as any)[key] as string;
                return {
                    label: key,
                    value: v,
                };
            });
    }, []);

    const fields = useMemo(() => {
        const result: {
            [K: string]: Readonly<PrimaryField<ContentGroupDescriptor, any>>;
        } = {
            title: {
                heading: "Title",
                ariaLabel: "Title",
                description: "Title of content",
                isHidden: false,
                isEditable: true,
                defaultValue: "New content title",
                insert: (item, v) => {
                    return {
                        ...item,
                        title: v,
                    };
                },
                extract: (v) => v.title,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) => v.length >= 3 || ["Title must be at least 3 characters"],
            },
            shortTitle: {
                heading: "Short Title",
                ariaLabel: "Short Title",
                description: "Short title of content",
                isHidden: false,
                isEditable: true,
                defaultValue: "New content short title",
                insert: (item, v) => {
                    return {
                        ...item,
                        shortTitle: v,
                    };
                },
                extract: (v) => v.shortTitle,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) => v.length >= 3 || ["Short title must be at least 3 characters"],
            },
            typeName: {
                heading: "Type",
                ariaLabel: "Type",
                description: "Type of content",
                isHidden: false,
                // TODO: Make the type editable. When changing type, we must
                //       update the content items / required content items
                //       accordingly - preserve overlapping types
                //       Warn the user before deleting any content
                isEditable: false,
                isEditableAtCreate: true,
                defaultValue: {
                    label: "Paper",
                    value: ContentGroupType_Enum.Paper,
                },
                insert: (item, v) => {
                    return {
                        ...item,
                        typeName: v,
                    };
                },
                extract: (item) => item.typeName,
                spec: {
                    fieldType: FieldType.select,
                    convertFromUI: (opt) => {
                        assert(!(opt instanceof Array) || opt.length === 1);
                        if (opt instanceof Array) {
                            return opt[0].value;
                        } else {
                            return opt.value;
                        }
                    },
                    convertToUI: (typeName) => {
                        const opt = groupTypeOptions.find((x) => x.value === typeName);
                        if (opt) {
                            return opt;
                        } else {
                            return {
                                label: `<Unsupported (${typeName})>`,
                                value: typeName,
                            };
                        }
                    },
                    multiSelect: false,
                    options: () => groupTypeOptions,
                    filter: defaultSelectFilter,
                },
            },
        };
        return result;
    }, [groupTypeOptions]);

    const [allContentGroupsMap, setAllContentGroupsMap] = useState<Map<string, ContentGroupDescriptor>>();

    useEffect(() => {
        if (parsedDBContentGroups) {
            setAllContentGroupsMap(parsedDBContentGroups);
        }
    }, [parsedDBContentGroups]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Groups
            </Heading>
            {loadingAllContentGroups || !allContentGroupsMap || !parsedDBContentGroups ? (
                <Spinner />
            ) : errorAllContentGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <ContentGroupCRUDTable
                key="crud-table"
                data={allContentGroupsMap ?? new Map()}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, group) => {
                            assert(group.typeName);
                            const groupTemplate = GroupTemplates[group.typeName];
                            assert(groupTemplate.supported);
                            const newGroup = {
                                ...group,
                                isNew: true,
                                id: tempKey,
                                tags: [],
                                items: [],
                                requiredItems: [],
                            } as ContentGroupDescriptor;
                            newGroup.items = groupTemplate.itemTypes
                                .filter((itemType) => {
                                    const baseType = ItemBaseTypes[itemType];
                                    const itemTemplate = ItemBaseTemplates[baseType];
                                    return itemTemplate.supported;
                                })
                                .map((itemType) => {
                                    const baseType = ItemBaseTypes[itemType];
                                    const itemTemplate = ItemBaseTemplates[baseType];
                                    assert(itemTemplate.supported);
                                    const newItemDesc = itemTemplate.createDefault(
                                        currentUser.user.User[0].id,
                                        newGroup,
                                        itemType,
                                        false
                                    );
                                    assert(newItemDesc.type === "item-only");
                                    return newItemDesc.item;
                                });
                            newGroup.requiredItems = groupTemplate.requiredItemTypes
                                .filter((itemType) => {
                                    const baseType = ItemBaseTypes[itemType];
                                    const itemTemplate = ItemBaseTemplates[baseType];
                                    return itemTemplate.supported;
                                })
                                .map((itemType) => {
                                    const baseType = ItemBaseTypes[itemType];
                                    const itemTemplate = ItemBaseTemplates[baseType];
                                    assert(itemTemplate.supported);
                                    const newItemDesc = itemTemplate.createDefault(
                                        currentUser.user.User[0].id,
                                        newGroup,
                                        itemType,
                                        true
                                    );
                                    assert(newItemDesc.type === "required-only");
                                    return newItemDesc.requiredItem;
                                });
                            setAllContentGroupsMap((oldData) => {
                                const newData = new Map(oldData ? oldData.entries() : []);
                                newData.set(tempKey, newGroup);
                                return newData;
                            });
                            return true;
                        },
                        update: (groups) => {
                            const results: Map<string, UpdateResult> = new Map();
                            groups.forEach((item, key) => {
                                results.set(key, true);
                            });

                            setAllContentGroupsMap((oldData) => {
                                if (oldData) {
                                    const newData = new Map(oldData.entries());
                                    groups.forEach((item, key) => {
                                        newData.set(key, item);
                                    });
                                    return newData;
                                }
                                return undefined;
                            });

                            return results;
                        },
                        delete: (keys) => {
                            const results: Map<string, boolean> = new Map();
                            keys.forEach((key) => {
                                results.set(key, true);
                            });

                            setAllContentGroupsMap((oldData) => {
                                const newData = new Map(oldData ? oldData.entries() : []);
                                keys.forEach((key) => {
                                    newData.delete(key);
                                });
                                return newData;
                            });

                            return results;
                        },
                        save: async (keys) => {
                            assert(parsedDBContentGroups);
                            assert(allContentGroupsMap);

                            const results: Map<string, boolean> = new Map();
                            keys.forEach((key) => {
                                results.set(key, false);
                            });

                            const newGroups = new Map<string, ContentGroupDescriptor>();
                            const updatedGroups = new Map<string, ContentGroupDescriptor>();
                            const deletedGroupKeys = new Set<string>();
                            for (const key of keys.values()) {
                                const group = allContentGroupsMap.get(key);
                                if (group) {
                                    if (group.isNew) {
                                        newGroups.set(key, group);
                                    } else {
                                        updatedGroups.set(key, group);
                                    }
                                } else {
                                    deletedGroupKeys.add(key);
                                }
                            }

                            try {
                                await insertDeleteContentGroupsMutation({
                                    variables: {
                                        deleteGroupIds: Array.from(deletedGroupKeys.values()),
                                        newGroups: Array.from(newGroups.values()).map((group) => {
                                            const groupResult: ContentGroup_Insert_Input = {
                                                id: group.id,
                                                conferenceId: conference.id,
                                                contentGroupTags: {
                                                    data: group.tags.map((tagId) => ({
                                                        tagId,
                                                    })),
                                                },
                                                contentGroupTypeName: group.typeName,
                                                contentItems: {
                                                    data: group.items.map((item) => {
                                                        const itemResult: ContentItem_Insert_Input = {
                                                            id: item.id,
                                                            conferenceId: conference.id,
                                                            contentTypeName: item.typeName,
                                                            data: item.data,
                                                            layoutData: item.layoutData,
                                                            name: item.name,
                                                            requiredContentId: item.requiredContentId,
                                                        };
                                                        return itemResult;
                                                    }),
                                                },
                                                requiredContentItems: {
                                                    data: group.requiredItems.map((item) => {
                                                        const itemResult: RequiredContentItem_Insert_Input = {
                                                            id: item.id,
                                                            conferenceId: conference.id,
                                                            accessToken: uuidv4(),
                                                            name: item.name,
                                                            contentTypeName: item.typeName,
                                                        };
                                                        return itemResult;
                                                    }),
                                                },
                                                shortTitle: group.shortTitle,
                                                title: group.title,
                                            };
                                            return groupResult;
                                        }),
                                    },
                                });

                                for (const key of newGroups.keys()) {
                                    results.set(key, true);
                                }
                                for (const key of deletedGroupKeys.keys()) {
                                    results.set(key, true);
                                }
                            } catch {
                                for (const key of newGroups.keys()) {
                                    results.set(key, false);
                                }
                                for (const key of deletedGroupKeys.keys()) {
                                    results.set(key, false);
                                }
                            }

                            const updateResultsArr: [string, boolean][] = await Promise.all(
                                Array.from(updatedGroups.values()).map(
                                    async (group): Promise<[string, boolean]> => {
                                        let ok = false;
                                        try {
                                            const newItems = new Map<string, ContentItemDescriptor>();
                                            const updatedItems = new Map<string, ContentItemDescriptor>();
                                            const deleteItemKeys = new Set<string>();

                                            const newRequiredItems = new Map<string, RequiredContentItemDescriptor>();
                                            const updatedRequiredItems = new Map<
                                                string,
                                                RequiredContentItemDescriptor
                                            >();
                                            const deleteRequiredItemKeys = new Set<string>();

                                            const newGroupTags = new Set<string>();
                                            const deleteGroupTagKeys = new Set<string>();

                                            const existingGroup = parsedDBContentGroups.get(group.id);
                                            assert(existingGroup);
                                            for (const item of group.items) {
                                                if (item.isNew) {
                                                    newItems.set(item.id, item);
                                                } else {
                                                    updatedItems.set(item.id, item);
                                                }
                                            }
                                            for (const existingItem of existingGroup.items) {
                                                if (!updatedItems.has(existingItem.id)) {
                                                    deleteItemKeys.add(existingItem.id);
                                                }
                                            }

                                            for (const item of group.requiredItems) {
                                                if (item.isNew) {
                                                    newRequiredItems.set(item.id, item);
                                                } else {
                                                    updatedRequiredItems.set(item.id, item);
                                                }
                                            }
                                            for (const existingItem of existingGroup.requiredItems) {
                                                if (!updatedRequiredItems.has(existingItem.id)) {
                                                    deleteRequiredItemKeys.add(existingItem.id);
                                                }
                                            }

                                            for (const tag of group.tags) {
                                                if (!existingGroup.tags.find((x) => x.id === tag.id)) {
                                                    newGroupTags.add(tag.id);
                                                }
                                            }
                                            for (const tag of existingGroup.tags) {
                                                if (!newGroupTags.has(tag.id)) {
                                                    deleteGroupTagKeys.add(tag.id);
                                                }
                                            }

                                            await updateContentGroupMutation({
                                                variables: {
                                                    contentGroupTypeName: group.typeName,
                                                    deleteGroupTagIds: Array.from(deleteGroupTagKeys.values()),
                                                    deleteItemIds: Array.from(deleteItemKeys.values()),
                                                    deleteRequiredItemIds: Array.from(deleteRequiredItemKeys.values()),
                                                    groupId: group.id,
                                                    newGroupTags: Array.from(newGroupTags.values()).map((tagId) => ({
                                                        contentGroupId: group.id,
                                                        tagId,
                                                    })),
                                                    newItems: Array.from(newItems.values()).map((item) => ({
                                                        conferenceId: conference.id,
                                                        contentGroupId: group.id,
                                                        contentTypeName: item.typeName,
                                                        data: item.data,
                                                        id: item.id,
                                                        layoutData: item.layoutData,
                                                        name: item.name,
                                                        requiredContentId: item.requiredContentId,
                                                    })),
                                                    newRequiredItems: Array.from(newRequiredItems.values()).map(
                                                        (item) => ({
                                                            accessToken: uuidv4(),
                                                            conferenceId: conference.id,
                                                            contentGroupId: group.id,
                                                            contentTypeName: item.typeName,
                                                            id: item.id,
                                                            name: item.name,
                                                        })
                                                    ),
                                                    shortTitle: group.shortTitle,
                                                    title: group.title,
                                                },
                                            });

                                            await Promise.all(
                                                Array.from(updatedItems.values()).map(async (item) => {
                                                    await updateContentItemMutation({
                                                        variables: {
                                                            contentTypeName: item.typeName,
                                                            data: item.data,
                                                            id: item.id,
                                                            layoutData: item.layoutData,
                                                            name: item.name,
                                                            requiredContentId: item.requiredContentId,
                                                        },
                                                    });
                                                })
                                            );

                                            await Promise.all(
                                                Array.from(updatedRequiredItems.values()).map(async (item) => {
                                                    await updateRequiredContentItemMutation({
                                                        variables: {
                                                            contentTypeName: item.typeName,
                                                            id: item.id,
                                                            name: item.name,
                                                        },
                                                    });
                                                })
                                            );

                                            ok = true;
                                        } catch (e) {
                                            ok = false;
                                        }
                                        return [group.id, ok];
                                    }
                                )
                            );
                            for (const [key, val] of updateResultsArr) {
                                results.set(key, val);
                            }

                            return results;
                        },
                    },
                }}
                primaryFields={{
                    keyField: {
                        heading: "Id",
                        ariaLabel: "Unique identifier",
                        description: "Unique identifier",
                        isHidden: true,
                        insert: (item, v) => {
                            return {
                                ...item,
                                id: v,
                            };
                        },
                        extract: (v) => v.id,
                        spec: {
                            fieldType: FieldType.string,
                            convertToUI: (x) => x,
                            disallowSpaces: true,
                        },
                        validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                    },
                    otherFields: fields,
                }}
                secondaryFields={{
                    editSingle: (key, onClose, markDirty) => {
                        const group = allContentGroupsMap?.get(key);

                        let editorElement: JSX.Element;
                        const footerButtons: SecondaryEditorFooterButton[] = [];

                        // TODO: Configure / Edit tabs

                        if (group) {
                            const groupTemplate = GroupTemplates[group.typeName];
                            if (groupTemplate.supported) {
                                const itemElements: JSX.Element[] = [];

                                for (const itemType of groupTemplate.itemTypes) {
                                    const baseType = ItemBaseTypes[itemType];
                                    const itemTemplate = ItemBaseTemplates[baseType];
                                    let accordianTitle:
                                        | string
                                        | JSX.Element = `TODO: Unsupported item type ${itemType}`;
                                    let accordianContents: JSX.Element | undefined;

                                    if (itemTemplate.supported) {
                                        const item = group.items.find(
                                            (x) => x.typeName === itemType && !x.requiredContentId
                                        );
                                        const itemDesc: ContentDescriptor | null = item
                                            ? {
                                                  type: "item-only",
                                                  item,
                                              }
                                            : null;
                                        if (!itemDesc) {
                                            throw new Error(
                                                `Item ${itemType} does not exist for the group ${group.id} following template ${group.typeName}!`
                                            );
                                        }

                                        if (!item) {
                                            setTimeout(() => {
                                                markDirty();
                                                setAllContentGroupsMap((oldGroups) => {
                                                    assert(oldGroups);
                                                    const newGroups = new Map(oldGroups);

                                                    const existingGroup = newGroups.get(group.id);
                                                    assert(existingGroup);
                                                    if (existingGroup.items.some((x) => x.id === itemDesc.item.id)) {
                                                        return oldGroups;
                                                    }
                                                    newGroups.set(group.id, {
                                                        ...existingGroup,
                                                        items: [...existingGroup.items, itemDesc.item],
                                                    });

                                                    return newGroups;
                                                });
                                            }, 0);
                                        }

                                        accordianTitle = itemTemplate.renderEditorHeading(itemDesc);
                                        accordianContents = itemTemplate.renderEditor(
                                            currentUser.user.User[0].id,
                                            itemDesc,
                                            (updatedDesc) => {
                                                markDirty();

                                                assert(updatedDesc.type === "item-only");

                                                setAllContentGroupsMap((oldGroups) => {
                                                    assert(oldGroups);
                                                    const newGroups = new Map(oldGroups);

                                                    const existingGroup = newGroups.get(group.id);
                                                    assert(existingGroup);
                                                    newGroups.set(group.id, {
                                                        ...existingGroup,
                                                        items: existingGroup.items.map((cItem) => {
                                                            return itemDesc.item.id === cItem.id
                                                                ? updatedDesc.item
                                                                : cItem;
                                                        }),
                                                    });

                                                    return newGroups;
                                                });
                                            }
                                        );
                                    }

                                    itemElements.push(
                                        <AccordionItem key={`row-${itemType}`}>
                                            <AccordionButton>
                                                <Box flex="1" textAlign="left">
                                                    {accordianTitle}
                                                </Box>
                                                {accordianContents && <AccordionIcon />}
                                            </AccordionButton>
                                            {accordianContents && (
                                                <AccordionPanel pb={4}>{accordianContents}</AccordionPanel>
                                            )}
                                        </AccordionItem>
                                    );
                                }
                                const itemsAccordian = <Accordion allowMultiple>{itemElements}</Accordion>;

                                for (const itemType of groupTemplate.requiredItemTypes) {
                                    const baseType = ItemBaseTypes[itemType];
                                    const itemTemplate = ItemBaseTemplates[baseType];
                                    let accordianTitle:
                                        | string
                                        | JSX.Element = `TODO: Unsupported required item type ${itemType}`;
                                    let accordianContents: JSX.Element | undefined;

                                    if (itemTemplate.supported) {
                                        const requiredItem = group.requiredItems.find((x) => x.typeName === itemType);
                                        const item =
                                            requiredItem &&
                                            group.items.find(
                                                (x) =>
                                                    x.typeName === itemType && x.requiredContentId === requiredItem.id
                                            );

                                        const itemDesc: ContentDescriptor | null =
                                            requiredItem && item
                                                ? {
                                                      type: "required-and-item",
                                                      item,
                                                      requiredItem,
                                                  }
                                                : requiredItem
                                                ? {
                                                      type: "required-only",
                                                      requiredItem,
                                                  }
                                                : null;
                                        if (!itemDesc) {
                                            throw new Error(
                                                `Required item ${itemType} does not exist for the group ${group.id} following template ${group.typeName}!`
                                            );
                                        }

                                        accordianTitle = itemTemplate.renderEditorHeading(itemDesc);
                                        const reqItemEditorContents = itemTemplate.renderEditor(
                                            currentUser.user.User[0].id,
                                            itemDesc,
                                            (updatedDesc) => {
                                                assert(updatedDesc.type !== "item-only");
                                                markDirty();

                                                setAllContentGroupsMap((oldGroups) => {
                                                    assert(oldGroups);
                                                    const newGroups = new Map(oldGroups);

                                                    const existingGroup = newGroups.get(group.id);
                                                    assert(existingGroup);
                                                    newGroups.set(group.id, {
                                                        ...existingGroup,
                                                        items:
                                                            itemDesc.type === "required-and-item" &&
                                                            updatedDesc.type === "required-and-item"
                                                                ? existingGroup.items.map((cItem) => {
                                                                      return itemDesc.item.id === cItem.id
                                                                          ? updatedDesc.item
                                                                          : cItem;
                                                                  })
                                                                : itemDesc.type === "required-only" &&
                                                                  updatedDesc.type === "required-and-item"
                                                                ? [...existingGroup.items, updatedDesc.item]
                                                                : itemDesc.type === "required-and-item" &&
                                                                  updatedDesc.type === "required-only"
                                                                ? existingGroup.items.filter(
                                                                      (x) => x.id !== itemDesc.item.id
                                                                  )
                                                                : existingGroup.items,
                                                        requiredItems: existingGroup.requiredItems.map((x) =>
                                                            x.id === itemDesc.requiredItem.id
                                                                ? updatedDesc.requiredItem
                                                                : x
                                                        ),
                                                    });

                                                    return newGroups;
                                                });
                                            }
                                        );

                                        accordianContents = (
                                            <>
                                                <Box>
                                                    <Text>TODO: Manage the names/emails of who has access</Text>
                                                    <Text>TODO: Send upload reminder emails</Text>
                                                    <Text>TODO: Show if content has already been uploaded</Text>
                                                </Box>
                                                {reqItemEditorContents}
                                            </>
                                        );
                                    }

                                    itemElements.push(
                                        <AccordionItem key={`row-${itemType}`}>
                                            <AccordionButton>
                                                <Box flex="1" textAlign="left">
                                                    {accordianTitle}
                                                </Box>
                                                {accordianContents && <AccordionIcon />}
                                            </AccordionButton>
                                            {accordianContents && (
                                                <AccordionPanel pb={4}>{accordianContents}</AccordionPanel>
                                            )}
                                        </AccordionItem>
                                    );
                                }

                                editorElement = <>{itemsAccordian}</>;
                            } else {
                                editorElement = <>TODO: Unsupported group type: {group.typeName}</>;
                            }
                        } else {
                            editorElement = <>Error: Content not found.</>;
                        }

                        return {
                            includeCloseButton: true,
                            editorElement,
                            footerButtons,
                        };
                    },
                }}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
