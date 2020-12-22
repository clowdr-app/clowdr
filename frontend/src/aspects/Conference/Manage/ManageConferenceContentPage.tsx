import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Heading,
    Spinner,
    useDisclosure,
} from "@chakra-ui/react";
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupType_Enum,
    ContentType_Enum,
    Permission_Enum,
    useSendSubmissionRequestsMutation,
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
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { deepCloneContentGroupDescriptor } from "./Content/Functions";
import { fitGroupToTemplate, GroupTemplates, ItemBaseTemplates } from "./Content/Templates";
import type {
    ContentDescriptor,
    ContentGroupDescriptor,
    ContentItemDescriptor,
    RequiredContentItemDescriptor,
} from "./Content/Types";
import UploadersModal from "./Content/UploadersModal";
import { useSaveContentDiff } from "./Content/useSaveContentDiff";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

const ContentGroupCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupDescriptor, "id">>) => CRUDTable(props);

// TODO: Render and allow editing (through a modal) of Content People
// TODO: Secondary buttons (at top level and in Content People modal) to enable
//       automatic linking based on email addresses.

export default function ManageConferenceContentPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    const saveContentDiff = useSaveContentDiff();

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

    const [allGroupsMap, setAllContentGroupsMap] = useState<Map<string, ContentGroupDescriptor>>();

    useEffect(() => {
        if (saveContentDiff.originalContentGroups) {
            const newMap: Map<string, ContentGroupDescriptor> = new Map();
            for (const [key, group] of saveContentDiff.originalContentGroups) {
                // Deep clone so that when we manipulate stuff later it doesn't
                // accidentally screw up the query data
                const newGroup: ContentGroupDescriptor = deepCloneContentGroupDescriptor(group);
                fitGroupToTemplate(newGroup);
                newMap.set(key, newGroup);
            }
            setAllContentGroupsMap(newMap);
        }
    }, [saveContentDiff.originalContentGroups]);

    const [sendSubmissionRequests, { loading: sendingRequestsLoading }] = useSendSubmissionRequestsMutation();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Content
            </Heading>
            {saveContentDiff.loadingContentGroups || !allGroupsMap || !saveContentDiff.originalContentGroups ? (
                <Spinner />
            ) : saveContentDiff.errorContentGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <ContentGroupCRUDTable
                key="crud-table"
                data={allGroupsMap ?? new Map()}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, group) => {
                            const newGroup = {
                                ...group,
                                isNew: true,
                                id: tempKey,
                                tags: [],
                                items: [],
                                requiredItems: [],
                            } as ContentGroupDescriptor;
                            fitGroupToTemplate(newGroup);
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
                            assert(allGroupsMap);
                            assert(!saveContentDiff.loadingContentGroups);
                            assert(!saveContentDiff.errorContentGroups);
                            assert(saveContentDiff.originalContentGroups);
                            return await saveContentDiff.saveContentDiff(keys, allGroupsMap);
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
                    editSingle: (key, onClose, isDirty, markDirty) => {
                        assert(allGroupsMap);
                        return ContentGroupSecondaryEditor(
                            allGroupsMap,
                            key,
                            markDirty,
                            setAllContentGroupsMap,
                            isDirty
                        );
                    },
                }}
                customButtons={[
                    {
                        action: async (groupKeys) => {
                            await sendSubmissionRequests({
                                variables: {
                                    uploaderIds: Array.from(groupKeys.values()).reduce((acc1, groupId) => {
                                        const group = allGroupsMap?.get(groupId);
                                        assert(group);
                                        return [
                                            ...acc1,
                                            ...group.requiredItems.reduce(
                                                (acc, item) => [...acc, ...item.uploaders.map((x) => x.id)],
                                                [] as string[]
                                            ),
                                        ];
                                    }, [] as string[]),
                                },
                            });
                        },
                        enabledWhenNothingSelected: false,
                        enabledWhenDirty: false,
                        tooltipWhenDisabled: "Save your changes to enable sending submission requests",
                        tooltipWhenEnabled: "Sends submission requests to all uploaders of selected items",
                        colorScheme: "red",
                        isRunning: sendingRequestsLoading,
                        label: "Send submission requests",
                        text: "Send submission requests",
                    },
                ]}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function ContentGroupSecondaryEditor(
    allGroupsMap: Map<string, ContentGroupDescriptor>,
    key: string,
    markDirty: () => void,
    setAllContentGroupsMap: React.Dispatch<React.SetStateAction<Map<string, ContentGroupDescriptor> | undefined>>,
    isDirty: boolean
) {
    const group = allGroupsMap.get(key);

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
                let accordianTitle: string | JSX.Element = `TODO: Unsupported item type ${itemType}`;
                let accordianContents: JSX.Element | undefined;

                if (itemTemplate.supported) {
                    const item = group.items.find((x) => x.typeName === itemType && !x.requiredContentId);
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
                    accordianContents = itemTemplate.renderEditor(itemDesc, (updatedDesc) => {
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
                                    return itemDesc.item.id === cItem.id ? updatedDesc.item : cItem;
                                }),
                            });

                            return newGroups;
                        });
                    });
                }

                itemElements.push(
                    <AccordionItem key={`row-${itemType}`}>
                        <AccordionButton>
                            <Box flex="1" textAlign="left">
                                {accordianTitle}
                            </Box>
                            {accordianContents && <AccordionIcon />}
                        </AccordionButton>
                        {accordianContents && <AccordionPanel pb={4}>{accordianContents}</AccordionPanel>}
                    </AccordionItem>
                );
            }
            const itemsAccordian = <Accordion allowMultiple>{itemElements}</Accordion>;

            for (const itemType of groupTemplate.requiredItemTypes) {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                let accordianTitle: string | JSX.Element = `TODO: Unsupported required item type ${itemType}`;
                let accordianContents: JSX.Element | undefined;

                if (itemTemplate.supported) {
                    const requiredItem = group.requiredItems.find((x) => x.typeName === itemType);
                    const item =
                        requiredItem &&
                        group.items.find((x) => x.typeName === itemType && x.requiredContentId === requiredItem.id);

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

                    accordianContents = (
                        <RequiredItemEditorModal
                            group={group}
                            itemTemplate={itemTemplate}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            setAllContentGroupsMap={setAllContentGroupsMap}
                            itemDesc={itemDesc}
                        />
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
                        {accordianContents && <AccordionPanel pb={4}>{accordianContents}</AccordionPanel>}
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
}

function RequiredItemEditorModal({
    group,
    itemTemplate,
    isDirty,
    markDirty,
    setAllContentGroupsMap,
    itemDesc,
}: {
    group: ContentGroupDescriptor;
    itemTemplate: {
        supported: true;
        createDefault: (
            group: ContentGroupDescriptor,
            itemType: ContentType_Enum,
            required: boolean
        ) => ContentDescriptor;
        renderEditorHeading: (data: ContentDescriptor) => JSX.Element;
        renderEditor: (data: ContentDescriptor, update: (updated: ContentDescriptor) => void) => JSX.Element;
    };
    isDirty: boolean;
    markDirty: () => void;
    setAllContentGroupsMap: React.Dispatch<React.SetStateAction<Map<string, ContentGroupDescriptor> | undefined>>;
    itemDesc:
        | {
              type: "required-only";
              requiredItem: RequiredContentItemDescriptor;
          }
        | {
              type: "required-and-item";
              requiredItem: RequiredContentItemDescriptor;
              item: ContentItemDescriptor;
          };
}) {
    const reqItemEditorContents = itemTemplate.renderEditor(itemDesc, (updatedDesc) => {
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
                    itemDesc.type === "required-and-item" && updatedDesc.type === "required-and-item"
                        ? existingGroup.items.map((cItem) => {
                              return itemDesc.item.id === cItem.id ? updatedDesc.item : cItem;
                          })
                        : itemDesc.type === "required-only" && updatedDesc.type === "required-and-item"
                        ? [...existingGroup.items, updatedDesc.item]
                        : itemDesc.type === "required-and-item" && updatedDesc.type === "required-only"
                        ? existingGroup.items.filter((x) => x.id !== itemDesc.item.id)
                        : existingGroup.items,
                requiredItems: existingGroup.requiredItems.map((x) =>
                    x.id === itemDesc.requiredItem.id ? updatedDesc.requiredItem : x
                ),
            });

            return newGroups;
        });
    });

    const { isOpen: isUploadersOpen, onOpen: onUploadersOpen, onClose: onUploadersClose } = useDisclosure();
    const accordianContents = (
        <>
            {reqItemEditorContents}
            <UploadersModal
                isItemDirty={isDirty}
                isOpen={isUploadersOpen}
                onOpen={onUploadersOpen}
                onClose={onUploadersClose}
                groupTitle={group.title}
                itemDesc={itemDesc.requiredItem}
                insertUploader={(uploader) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            requiredItems: existingGroup.requiredItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.requiredItem.id) {
                                    return {
                                        ...existingItem,
                                        uploaders: [...existingItem.uploaders, uploader],
                                    };
                                } else {
                                    return existingItem;
                                }
                            }),
                        });
                        return newGroups;
                    });
                }}
                updateUploader={(uploader) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            requiredItems: existingGroup.requiredItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.requiredItem.id) {
                                    return {
                                        ...existingItem,
                                        uploaders: existingItem.uploaders.map((existingUploader) =>
                                            existingUploader.id === uploader.id ? uploader : existingUploader
                                        ),
                                    };
                                } else {
                                    return existingItem;
                                }
                            }),
                        });
                        return newGroups;
                    });
                }}
                deleteUploader={(uploaderId) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            requiredItems: existingGroup.requiredItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.requiredItem.id) {
                                    return {
                                        ...existingItem,
                                        uploaders: existingItem.uploaders.filter(
                                            (existingUploader) => existingUploader.id !== uploaderId
                                        ),
                                    };
                                } else {
                                    return existingItem;
                                }
                            }),
                        });
                        return newGroups;
                    });
                }}
            />
        </>
    );
    return accordianContents;
}
