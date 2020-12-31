import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Code,
    Heading,
    Spinner,
    Text,
    useDisclosure,
    useToast,
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
    BooleanFieldFormat,
    BooleanFieldSpec,
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
import ContentGroupHallwaysModal from "./Content/ContentGroupHallwaysModal";
import ContentGroupPersonsModal from "./Content/ContentGroupPersonsModal";
import { readyToPublishVideos } from "./Content/contentPublishing";
import { deepCloneContentGroupDescriptor } from "./Content/Functions";
import ManageHallwaysModal from "./Content/ManageHallwaysModal";
import ManagePeopleModal from "./Content/ManagePeopleModal";
import ManageTagsModal from "./Content/ManageTagsModal";
import { fitGroupToTemplate, GroupTemplates, ItemBaseTemplates } from "./Content/Templates";
import type {
    ContentDescriptor,
    ContentGroupDescriptor,
    ContentItemDescriptor,
    ContentPersonDescriptor,
    HallwayDescriptor,
    RequiredContentItemDescriptor,
} from "./Content/Types";
import UploadersModal from "./Content/UploadersModal";
import { useSaveContentDiff } from "./Content/useSaveContentDiff";
import type { OriginatingDataDescriptor, TagDescriptor } from "./Shared/Types";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

const ContentGroupCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupDescriptor, "id">>) => CRUDTable(props);

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

    const [allGroupsMap, setAllContentGroupsMap] = useState<Map<string, ContentGroupDescriptor>>();
    const [allPeopleMap, setAllPeopleMap] = useState<Map<string, ContentPersonDescriptor>>();
    const [allHallwaysMap, setAllHallwaysMap] = useState<Map<string, HallwayDescriptor>>();
    const [allTagsMap, setAllTagsMap] = useState<Map<string, TagDescriptor>>();
    const [allOriginatingDatasMap, setAllOriginatingDatasMap] = useState<Map<string, OriginatingDataDescriptor>>();

    const tagOptions = useMemo(
        () =>
            allTagsMap
                ? Array.from(allTagsMap.values()).map((tag) => ({
                      label: tag.name,
                      value: tag.id,
                  }))
                : [],
        [allTagsMap]
    );

    const booleanFieldSpec: BooleanFieldSpec<boolean> = useMemo(
        () => ({
            fieldType: FieldType.boolean,
            convertFromUI: (x) => x,
            convertToUI: (x: boolean) => x,
            format: BooleanFieldFormat.checkbox,
        }),
        []
    );

    const fields = useMemo(() => {
        const result: {
            [K: string]: Readonly<PrimaryField<ContentGroupDescriptor, any>>;
        } = {
            title: {
                heading: "Title",
                ariaLabel: "Title",
                description: "Title of the content",
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
                description: "Short version of the content title",
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
            tags: {
                heading: "Tags",
                ariaLabel: "Tags",
                description: "Tags for the content to group it with other items",
                isHidden: false,
                isEditable: true,
                defaultValue: [],
                extract: (item) => item.tagIds,
                insert: (item, v) => {
                    return {
                        ...item,
                        tagIds: v,
                    };
                },
                spec: {
                    fieldType: FieldType.select,
                    multiSelect: true,
                    options: () => tagOptions,
                    convertToUI: (ids) =>
                        Array.from(ids.values()).map((id) => {
                            const opt = tagOptions.find((x) => x.value === id);
                            assert(opt);
                            return opt;
                        }),
                    convertFromUI: (opts) => {
                        opts ??= [];
                        return opts instanceof Array ? new Set(opts.map((x) => x.value)) : new Set([opts.value]);
                    },
                    filter: defaultSelectFilter,
                },
            },
            readyToPublishVideos: {
                heading: "Can publish?",
                ariaLabel: "Can this content group be published?",
                description: "Can this content group be published?",
                isHidden: false,
                isEditable: false,
                extract: readyToPublishVideos,
                spec: booleanFieldSpec,
            },
        };
        return result;
    }, [booleanFieldSpec, groupTypeOptions, tagOptions]);

    useEffect(() => {
        if (!saveContentDiff.loadingContent && !saveContentDiff.errorContent && saveContentDiff.originalContentGroups) {
            const newGroupsMap = new Map<string, ContentGroupDescriptor>();
            const newPeopleMap = new Map<string, ContentPersonDescriptor>();
            const newTagsMap = new Map<string, TagDescriptor>();
            const newHallwaysMap = new Map<string, HallwayDescriptor>();
            const newOriginatingDatasMap = new Map<string, OriginatingDataDescriptor>();
            for (const [key, group] of saveContentDiff.originalContentGroups) {
                // Deep clone so that when we manipulate stuff later it doesn't
                // accidentally screw up the query data
                const newGroup: ContentGroupDescriptor = deepCloneContentGroupDescriptor(group);
                fitGroupToTemplate(newGroup);
                newGroupsMap.set(key, newGroup);
            }
            for (const [key, value] of saveContentDiff.originalPeople) {
                newPeopleMap.set(key, { ...value });
            }
            for (const [key, value] of saveContentDiff.originalTags) {
                newTagsMap.set(key, { ...value });
            }
            for (const [key, value] of saveContentDiff.originalOriginatingDatas) {
                newOriginatingDatasMap.set(key, { ...value });
            }
            for (const [key, value] of saveContentDiff.originalHallways) {
                newHallwaysMap.set(key, { ...value });
            }
            setAllContentGroupsMap(newGroupsMap);
            setAllPeopleMap(newPeopleMap);
            setAllTagsMap(newTagsMap);
            setAllOriginatingDatasMap(newOriginatingDatasMap);
            setAllHallwaysMap(newHallwaysMap);
        }
    }, [
        saveContentDiff.errorContent,
        saveContentDiff.loadingContent,
        saveContentDiff.originalContentGroups,
        saveContentDiff.originalHallways,
        saveContentDiff.originalOriginatingDatas,
        saveContentDiff.originalPeople,
        saveContentDiff.originalTags,
    ]);

    const [sendSubmissionRequests, { loading: sendingRequestsLoading }] = useSendSubmissionRequestsMutation();

    const { isOpen: tagsModalOpen, onOpen: onTagsModalOpen, onClose: onTagsModalClose } = useDisclosure();
    const [dirtyTagIds, setDirtyTagIds] = useState<Set<string>>(new Set());

    const { isOpen: peopleModalOpen, onOpen: onPeopleModalOpen, onClose: onPeopleModalClose } = useDisclosure();
    const [editedPeopleIds, setEditedPeopleIds] = useState<Set<string>>(new Set());

    const { isOpen: hallwaysModalOpen, onOpen: onHallwaysModalOpen, onClose: onHallwaysModalClose } = useDisclosure();
    const [editedHallwaysIds, setEditedHallwaysIds] = useState<Set<string>>(new Set());

    const toast = useToast();

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
            {saveContentDiff.loadingContent &&
            (!allGroupsMap || !allTagsMap || !allPeopleMap || !allOriginatingDatasMap || !allHallwaysMap) ? (
                <Spinner />
            ) : saveContentDiff.errorContent ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <ContentGroupCRUDTable
                key="crud-table"
                data={allGroupsMap ?? new Map()}
                externalUnsavedChanges={dirtyTagIds.size > 0 || editedPeopleIds.size > 0 || editedHallwaysIds.size > 0}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, group) => {
                            const newGroup = {
                                ...group,
                                isNew: true,
                                id: tempKey,
                                items: [],
                                requiredItems: [],
                                hallways: [],
                                people: [],
                                tagIds: new Set(),
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
                            assert(allTagsMap);
                            assert(allPeopleMap);
                            assert(allHallwaysMap);
                            assert(allOriginatingDatasMap);
                            assert(!saveContentDiff.loadingContent);
                            assert(!saveContentDiff.errorContent);
                            assert(saveContentDiff.originalContentGroups);
                            const results = await saveContentDiff.saveContentDiff(
                                {
                                    groupKeys: keys,
                                    originatingDataKeys: new Set(),
                                    peopleKeys: editedPeopleIds,
                                    tagKeys: dirtyTagIds,
                                    hallwayKeys: editedHallwaysIds,
                                },
                                allTagsMap,
                                allPeopleMap,
                                allOriginatingDatasMap,
                                allGroupsMap,
                                allHallwaysMap
                            );

                            setDirtyTagIds((oldTagIds) => {
                                const newTagIds = new Set(oldTagIds);
                                for (const [tagId, result] of results.tags) {
                                    if (result) {
                                        newTagIds.delete(tagId);
                                    }
                                }
                                return newTagIds;
                            });

                            setEditedPeopleIds((oldPersonIds) => {
                                const newPersonIds = new Set(oldPersonIds);
                                for (const [personId, result] of results.people) {
                                    if (result) {
                                        newPersonIds.delete(personId);
                                    }
                                }
                                return newPersonIds;
                            });

                            setEditedHallwaysIds((oldHallwayIds) => {
                                const newHallwayIds = new Set(oldHallwayIds);
                                for (const [hallwayId, result] of results.hallways) {
                                    if (result) {
                                        newHallwayIds.delete(hallwayId);
                                    }
                                }
                                return newHallwayIds;
                            });

                            return results.groups;
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
                        getRowTitle: (v) => v.title,
                    },
                    otherFields: fields,
                }}
                secondaryFields={{
                    editSingle: (key, onClose, isDirty, markDirty) => {
                        assert(allGroupsMap);
                        assert(allPeopleMap);
                        assert(allHallwaysMap);
                        assert(allOriginatingDatasMap);
                        return ContentGroupSecondaryEditor(
                            allGroupsMap,
                            allPeopleMap,
                            allOriginatingDatasMap,
                            allHallwaysMap,
                            key,
                            markDirty,
                            setAllContentGroupsMap,
                            isDirty
                        );
                    },
                }}
                customButtons={[
                    {
                        action: async (_groupKeys) => {
                            onTagsModalOpen();
                        },
                        enabledWhenNothingSelected: true,
                        enabledWhenDirty: true,
                        tooltipWhenDisabled: "",
                        tooltipWhenEnabled: "Tags can be used to group and highlight related content.",
                        colorScheme: "purple",
                        isRunning: false,
                        label: "Manage tags",
                        text: "Manage tags",
                    },
                    {
                        action: async (_groupKeys) => {
                            onPeopleModalOpen();
                        },
                        enabledWhenNothingSelected: true,
                        enabledWhenDirty: true,
                        tooltipWhenDisabled: "",
                        tooltipWhenEnabled:
                            "People can be listed as presenters, authors, chairs and other such roles for content and events.",
                        colorScheme: "purple",
                        isRunning: false,
                        label: "Manage people",
                        text: "Manage people",
                    },
                    {
                        action: async (_groupKeys) => {
                            onHallwaysModalOpen();
                        },
                        enabledWhenNothingSelected: true,
                        enabledWhenDirty: true,
                        tooltipWhenDisabled: "",
                        tooltipWhenEnabled: "Hallways can exhibit items, rooms and events.",
                        colorScheme: "purple",
                        isRunning: false,
                        label: "Manage hallways",
                        text: "Manage hallways",
                    },
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
            <ManageTagsModal
                tags={allTagsMap ?? new Map()}
                areTagsDirty={dirtyTagIds.size > 0}
                isOpen={tagsModalOpen}
                onOpen={onTagsModalOpen}
                onClose={onTagsModalClose}
                insertTag={(tag) => {
                    setDirtyTagIds((oldTagIds) => {
                        const newTagIds = new Set(oldTagIds);
                        newTagIds.add(tag.id);
                        return newTagIds;
                    });
                    setAllTagsMap((oldTags) => {
                        const newTags: Map<string, TagDescriptor> = oldTags ? new Map(oldTags) : new Map();
                        newTags.set(tag.id, tag);
                        return newTags;
                    });
                }}
                updateTag={(tag) => {
                    setDirtyTagIds((oldTagIds) => {
                        const newTagIds = new Set(oldTagIds);
                        newTagIds.add(tag.id);
                        return newTagIds;
                    });
                    setAllTagsMap((oldTags) => {
                        const newTags: Map<string, TagDescriptor> = oldTags ? new Map(oldTags) : new Map();
                        newTags.set(tag.id, tag);
                        return newTags;
                    });
                }}
                deleteTag={(tagId) => {
                    const isInUse = Array.from(allGroupsMap?.values() ?? []).some((group) => group.tagIds.has(tagId));
                    if (isInUse) {
                        toast({
                            description:
                                "Cannot delete a tag while it is still in use. Please remove the tag from all content then try again.",
                            isClosable: true,
                            status: "error",
                            title: "Cannot delete tag",
                        });
                    } else {
                        setDirtyTagIds((oldTagIds) => {
                            const newTagIds = new Set(oldTagIds);
                            newTagIds.add(tagId);
                            return newTagIds;
                        });
                        setAllTagsMap((oldTags) => {
                            const newTags: Map<string, TagDescriptor> = oldTags ? new Map(oldTags) : new Map();
                            newTags.delete(tagId);
                            return newTags;
                        });
                    }
                }}
            />
            <ManagePeopleModal
                persons={allPeopleMap ?? new Map()}
                arePersonsEdited={editedPeopleIds.size > 0}
                isOpen={peopleModalOpen}
                onOpen={onPeopleModalOpen}
                onClose={onPeopleModalClose}
                insertPerson={(person) => {
                    setEditedPeopleIds((oldPersonIds) => {
                        const newPersonIds = new Set(oldPersonIds);
                        newPersonIds.add(person.id);
                        return newPersonIds;
                    });
                    setAllPeopleMap((oldPeople) => {
                        const newPeople: Map<string, ContentPersonDescriptor> = oldPeople
                            ? new Map(oldPeople)
                            : new Map();
                        newPeople.set(person.id, person);
                        return newPeople;
                    });
                }}
                updatePerson={(person) => {
                    setEditedPeopleIds((oldPersonIds) => {
                        const newPersonIds = new Set(oldPersonIds);
                        newPersonIds.add(person.id);
                        return newPersonIds;
                    });
                    setAllPeopleMap((oldPeople) => {
                        const newPeople: Map<string, ContentPersonDescriptor> = oldPeople
                            ? new Map(oldPeople)
                            : new Map();
                        newPeople.set(person.id, person);
                        return newPeople;
                    });
                }}
                deletePerson={(personId) => {
                    const isInUse = Array.from(allGroupsMap?.values() ?? []).some((group) =>
                        group.people.some((x) => x.personId === personId)
                    );
                    if (isInUse) {
                        toast({
                            description:
                                "Cannot delete a person while they are associated with some content. Please dissociate the person from all content then try again.",
                            isClosable: true,
                            status: "error",
                            title: "Cannot delete person",
                        });
                    } else {
                        setEditedPeopleIds((oldPersonIds) => {
                            const newPersonIds = new Set(oldPersonIds);
                            newPersonIds.add(personId);
                            return newPersonIds;
                        });
                        setAllPeopleMap((oldPeople) => {
                            const newPeople: Map<string, ContentPersonDescriptor> = oldPeople
                                ? new Map(oldPeople)
                                : new Map();
                            newPeople.delete(personId);
                            return newPeople;
                        });
                    }
                }}
            />
            <ManageHallwaysModal
                hallways={allHallwaysMap ?? new Map()}
                areHallwaysDirty={editedHallwaysIds.size > 0}
                isOpen={hallwaysModalOpen}
                onOpen={onHallwaysModalOpen}
                onClose={onHallwaysModalClose}
                insertHallway={(hallway) => {
                    setEditedHallwaysIds((oldHallwayIds) => {
                        const newHallwayIds = new Set(oldHallwayIds);
                        newHallwayIds.add(hallway.id);
                        return newHallwayIds;
                    });
                    setAllHallwaysMap((oldHallways) => {
                        const newHallways: Map<string, HallwayDescriptor> = oldHallways
                            ? new Map(oldHallways)
                            : new Map();
                        newHallways.set(hallway.id, hallway);
                        return newHallways;
                    });
                }}
                updateHallway={(hallway) => {
                    setEditedHallwaysIds((oldHallwayIds) => {
                        const newHallwayIds = new Set(oldHallwayIds);
                        newHallwayIds.add(hallway.id);
                        return newHallwayIds;
                    });
                    setAllHallwaysMap((oldHallways) => {
                        const newHallways: Map<string, HallwayDescriptor> = oldHallways
                            ? new Map(oldHallways)
                            : new Map();
                        newHallways.set(hallway.id, hallway);
                        return newHallways;
                    });
                }}
                deleteHallway={(hallwayId) => {
                    const isInUse = Array.from(allGroupsMap?.values() ?? []).some((group) =>
                        group.hallways.some((x) => x.hallwayId === hallwayId)
                    );
                    if (isInUse) {
                        toast({
                            description:
                                "Cannot delete a hallway while they are associated with some content. Please dissociate the hallway from all content then try again.",
                            isClosable: true,
                            status: "error",
                            title: "Cannot delete hallway",
                        });
                    } else {
                        setEditedHallwaysIds((oldHallwayIds) => {
                            const newHallwayIds = new Set(oldHallwayIds);
                            newHallwayIds.add(hallwayId);
                            return newHallwayIds;
                        });
                        setAllHallwaysMap((oldHallways) => {
                            const newHallways: Map<string, HallwayDescriptor> = oldHallways
                                ? new Map(oldHallways)
                                : new Map();
                            newHallways.delete(hallwayId);
                            return newHallways;
                        });
                    }
                }}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function ContentGroupSecondaryEditor(
    allGroupsMap: Map<string, ContentGroupDescriptor>,
    allPeopleMap: Map<string, ContentPersonDescriptor>,
    allOriginatingDatasMap: Map<string, OriginatingDataDescriptor>,
    allHallwaysMap: Map<string, HallwayDescriptor>,
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

            itemElements.push(
                <AccordionItem key="people">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            People
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <GroupPeopleEditorModal
                            group={group}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            peopleMap={allPeopleMap}
                            setAllContentGroupsMap={setAllContentGroupsMap}
                        />
                    </AccordionPanel>
                </AccordionItem>
            );

            itemElements.push(
                <AccordionItem key="hallways">
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Hallways
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <GroupHallwaysEditorModal
                            group={group}
                            isDirty={isDirty}
                            markDirty={markDirty}
                            hallwaysMap={allHallwaysMap}
                            setAllContentGroupsMap={setAllContentGroupsMap}
                        />
                    </AccordionPanel>
                </AccordionItem>
            );

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

            if (group.originatingDataId) {
                const originatingData = allOriginatingDatasMap.get(group.originatingDataId);
                let accordianContents: JSX.Element;
                if (originatingData) {
                    accordianContents = (
                        <>
                            <Text>The following shows the raw data received when this item was imported.</Text>
                            <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" mt={2}>
                                <Code w="100%" p={2}>
                                    Source Ids: {JSON.stringify(originatingData.sourceId.split("¬"), null, 2)}
                                </Code>
                            </Text>
                            <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" mt={2}>
                                <Code w="100%" p={2}>
                                    {JSON.stringify(originatingData.data, null, 2)}
                                </Code>
                            </Text>
                        </>
                    );
                } else {
                    accordianContents = <>Error: Data not found</>;
                }
                itemElements.push(
                    <AccordionItem key="originating-data">
                        <AccordionButton>
                            <Box flex="1" textAlign="left">
                                Originating Data
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>{accordianContents}</AccordionPanel>
                    </AccordionItem>
                );
            }

            const itemsAccordian = <Accordion allowMultiple>{itemElements}</Accordion>;
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

function GroupPeopleEditorModal({
    group,
    peopleMap,
    isDirty,
    markDirty,
    setAllContentGroupsMap,
}: {
    group: ContentGroupDescriptor;
    peopleMap: Map<string, ContentPersonDescriptor>;
    isDirty: boolean;
    markDirty: () => void;
    setAllContentGroupsMap: React.Dispatch<React.SetStateAction<Map<string, ContentGroupDescriptor> | undefined>>;
}) {
    const { isOpen: isUploadersOpen, onOpen: onUploadersOpen, onClose: onUploadersClose } = useDisclosure();
    const accordianContents = (
        <>
            <ContentGroupPersonsModal
                isGroupDirty={isDirty}
                isOpen={isUploadersOpen}
                onOpen={onUploadersOpen}
                onClose={onUploadersClose}
                group={group}
                peopleMap={peopleMap}
                insertContentGroupPerson={(contentGroupPerson) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            people: [...existingGroup.people, contentGroupPerson],
                        });
                        return newGroups;
                    });
                }}
                updateContentGroupPerson={(contentGroupPerson) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            people: existingGroup.people.map((existingContentGroupPerson) =>
                                existingContentGroupPerson.id === contentGroupPerson.id
                                    ? contentGroupPerson
                                    : existingContentGroupPerson
                            ),
                        });
                        return newGroups;
                    });
                }}
                deleteContentGroupPerson={(contentGroupPersonId) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            people: existingGroup.people.filter(
                                (existingContentGroupPerson) => existingContentGroupPerson.id !== contentGroupPersonId
                            ),
                        });
                        return newGroups;
                    });
                }}
            />
        </>
    );
    return accordianContents;
}

function GroupHallwaysEditorModal({
    group,
    hallwaysMap,
    isDirty,
    markDirty,
    setAllContentGroupsMap,
}: {
    group: ContentGroupDescriptor;
    hallwaysMap: Map<string, HallwayDescriptor>;
    isDirty: boolean;
    markDirty: () => void;
    setAllContentGroupsMap: React.Dispatch<React.SetStateAction<Map<string, ContentGroupDescriptor> | undefined>>;
}) {
    const { isOpen: isUploadersOpen, onOpen: onUploadersOpen, onClose: onUploadersClose } = useDisclosure();
    const accordianContents = (
        <>
            <ContentGroupHallwaysModal
                isGroupDirty={isDirty}
                isOpen={isUploadersOpen}
                onOpen={onUploadersOpen}
                onClose={onUploadersClose}
                group={group}
                hallwaysMap={hallwaysMap}
                insertContentGroupHallway={(contentGroupHallway) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            hallways: [...existingGroup.hallways, contentGroupHallway],
                        });
                        return newGroups;
                    });
                }}
                updateContentGroupHallway={(contentGroupHallway) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            hallways: existingGroup.hallways.map((existingContentGroupHallway) =>
                                existingContentGroupHallway.id === contentGroupHallway.id
                                    ? contentGroupHallway
                                    : existingContentGroupHallway
                            ),
                        });
                        return newGroups;
                    });
                }}
                deleteContentGroupHallway={(contentGroupHallwayId) => {
                    markDirty();
                    setAllContentGroupsMap((oldGroups) => {
                        const newGroups: Map<string, ContentGroupDescriptor> = oldGroups
                            ? new Map(oldGroups)
                            : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            hallways: existingGroup.hallways.filter(
                                (existingContentGroupHallway) =>
                                    existingContentGroupHallway.id !== contentGroupHallwayId
                            ),
                        });
                        return newGroups;
                    });
                }}
            />
        </>
    );
    return accordianContents;
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
                setUploadsRemaining={(newUploadsRemaining) => {
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
                                        uploadsRemaining: newUploadsRemaining,
                                    };
                                } else {
                                    return existingItem;
                                }
                            }),
                        });
                        return newGroups;
                    });
                }}
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
