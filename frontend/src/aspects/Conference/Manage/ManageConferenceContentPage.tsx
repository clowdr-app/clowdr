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
} from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentBaseType, ItemBaseTypes } from "../../../../../shared/types/content";
import {
    ContentGroupType_Enum,
    ContentType_Enum,
    Permission_Enum,
    useSelectAllContentGroupsQuery,
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
import { TextItemTemplate } from "./Content/TextItem";
import type { ContentDescriptor, ContentGroupDescriptor, ItemBaseTemplate } from "./Content/Types";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    query SelectAllContentGroups($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            conferenceId
            contentGroupTypeName
            title
            shortTitle
            requiredContentItems {
                id
                name
                contentTypeName
                conferenceId
                contentGroupId
            }
            contentItems {
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
                    conferenceId
                    contentGroupId
                    contentTypeName
                    id
                    name
                }
            }
            contentGroupTags {
                id
                tagId
                contentGroupId
            }
        }
    }
`;

const ContentGroupCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupDescriptor, "id">>) => CRUDTable(props);

const ItemBaseTemplates: { [K in ContentBaseType]: ItemBaseTemplate } = {
    [ContentBaseType.File]: { supported: false },
    [ContentBaseType.Link]: { supported: false },
    [ContentBaseType.Text]: TextItemTemplate,
    [ContentBaseType.URL]: { supported: false },
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
                    tagIds: item.contentGroupTags.map((x) => x.tagId),
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
                isEditable: true,
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
                        create: (tempKey, item) => {
                            const newItem = {
                                ...item,
                                isNew: true,
                                id: tempKey,
                            } as ContentGroupDescriptor;
                            setAllContentGroupsMap((oldData) => {
                                const newData = new Map(oldData ? oldData.entries() : []);
                                newData.set(tempKey, newItem);
                                return newData;
                            });
                            return true;
                        },
                        update: (items) => {
                            const results: Map<string, UpdateResult> = new Map();
                            items.forEach((item, key) => {
                                results.set(key, true);
                            });

                            setAllContentGroupsMap((oldData) => {
                                if (oldData) {
                                    const newData = new Map(oldData.entries());
                                    items.forEach((item, key) => {
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
                            console.log("todo");

                            // TODO: Upsert groups, items, required items (nested?)
                            // TODO: Delete old groups, items, required items
                            return new Map<string, boolean>();
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
                    editSingle: (key, onClose) => {
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
                                        const itemDesc: ContentDescriptor = item
                                            ? {
                                                  type: "item-only",
                                                  item,
                                              }
                                            : itemTemplate.createDefault(
                                                  currentUser.user.User[0].id,
                                                  group,
                                                  itemType,
                                                  false
                                              );
                                        assert(itemDesc.type === "item-only");

                                        accordianTitle = itemTemplate.renderEditorHeading(itemDesc);
                                        accordianContents = itemTemplate.renderEditor(
                                            currentUser.user.User[0].id,
                                            itemDesc,
                                            (updatedDesc) => {
                                                assert(updatedDesc.type === "item-only");

                                                setAllContentGroupsMap((oldGroups) => {
                                                    const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                                                        ? new Map(oldGroups)
                                                        : new Map();

                                                    newGroups.set(group.id, {
                                                        ...group,
                                                        items: group.items.map((cItem) => {
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

                                        const itemDesc: ContentDescriptor =
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
                                                : itemTemplate.createDefault(
                                                      currentUser.user.User[0].id,
                                                      group,
                                                      itemType,
                                                      true
                                                  );
                                        assert(itemDesc.type !== "item-only");

                                        accordianTitle = itemTemplate.renderEditorHeading(itemDesc);
                                        accordianContents = itemTemplate.renderEditor(
                                            currentUser.user.User[0].id,
                                            itemDesc,
                                            (updatedDesc) => {
                                                assert(updatedDesc.type !== "item-only");

                                                setAllContentGroupsMap((oldGroups) => {
                                                    const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                                                        ? new Map(oldGroups)
                                                        : new Map();

                                                    newGroups.set(group.id, {
                                                        ...group,
                                                        items:
                                                            itemDesc.type === "required-and-item" &&
                                                            updatedDesc.type === "required-and-item"
                                                                ? group.items.map((cItem) => {
                                                                      return itemDesc.item.id === cItem.id
                                                                          ? updatedDesc.item
                                                                          : cItem;
                                                                  })
                                                                : itemDesc.type === "required-only" &&
                                                                  updatedDesc.type === "required-and-item"
                                                                ? [...group.items, updatedDesc.item]
                                                                : itemDesc.type === "required-and-item" &&
                                                                  updatedDesc.type === "required-only"
                                                                ? group.items.filter((x) => x.id !== itemDesc.item.id)
                                                                : group.items,
                                                        requiredItems: group.requiredItems.map((x) =>
                                                            x.id === itemDesc.requiredItem.id
                                                                ? updatedDesc.requiredItem
                                                                : x
                                                        ),
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

                                // TODO: Required items accordian

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
