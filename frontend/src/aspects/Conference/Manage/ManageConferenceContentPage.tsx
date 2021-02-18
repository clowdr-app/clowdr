import { Heading, Spinner, useDisclosure, useToast } from "@chakra-ui/react";
import assert from "assert";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupType_Enum,
    Permission_Enum,
    useInsertSubmissionRequestEmailJobsMutation,
} from "../../../generated/graphql";
import CRUDTable, {
    CRUDTableProps,
    defaultSelectFilter,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    SelectOption,
    UpdateResult,
} from "../../CRUDTable/CRUDTable";
import PageNotFound from "../../Errors/PageNotFound";
import isValidUUID from "../../Utils/isValidUUID";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { CombineVideosModal } from "./Content/CombineVideosModal";
import ContentGroupHallwaysModal from "./Content/ContentGroupHallwaysModal";
import ContentGroupPersonsModal from "./Content/ContentGroupPersonsModal";
import { ContentGroupSecondaryEditor } from "./Content/ContentGroupSecondaryEditor";
import { deepCloneContentGroupDescriptor } from "./Content/Functions";
import ManageHallwaysModal from "./Content/ManageHallwaysModal";
import ManagePeopleModal from "./Content/ManagePeopleModal";
import ManageTagsModal from "./Content/ManageTagsModal";
// import PublishVideosModal from "./Content/PublishVideosModal";
import { fitGroupToTemplate, GroupTemplates } from "./Content/Templates";
import type {
    ContentGroupDescriptor,
    ContentItemDescriptor,
    ContentPersonDescriptor,
    HallwayDescriptor,
    RequiredContentItemDescriptor,
    SupportedItemBaseTemplate,
} from "./Content/Types";
import UploadersModal from "./Content/UploadersModal";
import { useSaveContentDiff } from "./Content/useSaveContentDiff";
import type { OriginatingDataDescriptor, TagDescriptor } from "./Shared/Types";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

const ContentGroupCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupDescriptor, "id">>) => CRUDTable(props);

export default function ManageConferenceContentPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage content at ${conference.shortName}`);

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
                    label: v
                        .split("_")
                        .map((x) => x[0] + x.substr(1).toLowerCase())
                        .reduce((acc, x) => `${acc} ${x}`),
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

    const { onOpen: onCombineVideosOpen, isOpen: isCombineVideosOpen, onClose: onCombineVideosClose } = useDisclosure();
    const combineVideosModal = useCallback(
        (key: string) => (
            <CombineVideosModal
                isOpen={isCombineVideosOpen}
                onClose={onCombineVideosClose}
                contentGroupId={key}
                allGroupsMap={allGroupsMap}
            />
        ),
        [allGroupsMap, isCombineVideosOpen, onCombineVideosClose]
    );

    // const booleanFieldSpec: BooleanFieldSpec<boolean> = useMemo(
    //     () => ({
    //         fieldType: FieldType.boolean,
    //         convertFromUI: (x) => x,
    //         convertToUI: (x: boolean) => x,
    //         format: BooleanFieldFormat.checkbox,
    //     }),
    //     []
    // );

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
            // readyToPublishVideos: {
            //     heading: "Can publish?",
            //     ariaLabel: "Are all video items ready to publish?",
            //     description: "Are all video items ready to publish?",
            //     isHidden: false,
            //     isEditable: false,
            //     extract: readyToPublishVideos,
            //     spec: booleanFieldSpec,
            // },
        };
        return result;
    }, [groupTypeOptions, tagOptions]);

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

    const [sendSubmissionRequests, { loading: sendingRequestsLoading }] = useInsertSubmissionRequestEmailJobsMutation();

    const { isOpen: tagsModalOpen, onOpen: onTagsModalOpen, onClose: onTagsModalClose } = useDisclosure();
    const [dirtyTagIds, setDirtyTagIds] = useState<Set<string>>(new Set());

    const { isOpen: peopleModalOpen, onOpen: onPeopleModalOpen, onClose: onPeopleModalClose } = useDisclosure();
    const [editedPeopleIds, setEditedPeopleIds] = useState<Set<string>>(new Set());

    const { isOpen: hallwaysModalOpen, onOpen: onHallwaysModalOpen, onClose: onHallwaysModalClose } = useDisclosure();
    const [editedHallwaysIds, setEditedHallwaysIds] = useState<Set<string>>(new Set());

    // const {
    //     isOpen: publishVideosModalOpen,
    //     onOpen: onPublishVideosModalOpen,
    //     onClose: onPublishVideosModalClose,
    // } = useDisclosure();
    // const [publishVideosIds, setPublishVideosIds] = useState<Set<string>>(new Set());

    const toast = useToast();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
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
                            isDirty,
                            conference.slug,
                            onCombineVideosOpen,
                            combineVideosModal
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
                                    objs: Array.from(groupKeys.values()).reduce((acc1, groupId) => {
                                        const group = allGroupsMap?.get(groupId);
                                        assert(group);
                                        return [
                                            ...acc1,
                                            ...group.requiredItems.reduce(
                                                (acc, item) => [
                                                    ...acc,
                                                    ...item.uploaders.map((x) => ({ uploaderId: x.id })),
                                                ],
                                                [] as { uploaderId: string }[]
                                            ),
                                        ];
                                    }, [] as { uploaderId: string }[]),
                                },
                            });
                            toast({
                                title: "Requests sent",
                                duration: 3000,
                                isClosable: true,
                                status: "success",
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
                    // {
                    //     action: async (groupKeys) => {
                    //         setPublishVideosIds(groupKeys);
                    //         onPublishVideosModalOpen();
                    //     },
                    //     enabledWhenNothingSelected: false,
                    //     enabledWhenDirty: false,
                    //     tooltipWhenDisabled: "Save your changes to enable publishing videos",
                    //     tooltipWhenEnabled: "Publish videos from the select items",
                    //     colorScheme: "red",
                    //     isRunning: false,
                    //     label: "Publish videos",
                    //     text: "Publish videos",
                    // },
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
            {/* <PublishVideosModal
                isOpen={publishVideosModalOpen}
                onOpen={onPublishVideosModalOpen}
                onClose={onPublishVideosModalClose}
                contentGroupIds={publishVideosIds}
            /> */}
        </RequireAtLeastOnePermissionWrapper>
    );
}

export function GroupPeopleEditorModal({
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

export function GroupHallwaysEditorModal({
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

export function RequiredItemEditorModal({
    group,
    itemTemplate,
    isDirty,
    markDirty,
    setAllContentGroupsMap,
    itemDesc,
}: {
    group: ContentGroupDescriptor;
    itemTemplate: SupportedItemBaseTemplate;
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
    const reqItemEditorContents = (
        <itemTemplate.renderEditor
            data={itemDesc}
            update={(updatedDesc) => {
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
            }}
        />
    );

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
