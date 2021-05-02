import { Heading, Spinner, useDisclosure, useToast } from "@chakra-ui/react";
import type { EmailTemplate_BaseConfig } from "@clowdr-app/shared-types/build/conferenceConfiguration";
import assert from "assert";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ItemType_Enum,
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
import { deepCloneItemDescriptor } from "./Content/Functions";
import ItemExhibitionsModal from "./Content/ItemExhibitionsModal";
import ItemPersonsModal from "./Content/ItemPersonsModal";
import { ItemSecondaryEditor } from "./Content/ItemSecondaryEditor";
import ManageExhibitionsModal from "./Content/ManageExhibitionsModal";
import ManageTagsModal from "./Content/ManageTagsModal";
import { SendSubmissionRequestsModal } from "./Content/SubmissionRequestsModal";
import { SubmissionReviewModal } from "./Content/SubmissionReviewModal";
// import PublishVideosModal from "./Content/PublishVideosModal";
import { fitGroupToTemplate, GroupTemplates } from "./Content/Templates";
import type {
    ElementDescriptor,
    ExhibitionDescriptor,
    ItemDescriptor,
    ProgramPersonDescriptor,
    SupportedItemBaseTemplate,
    UploadableElementDescriptor,
} from "./Content/Types";
import UploadersModal from "./Content/UploadersModal";
import { useSaveContentDiff } from "./Content/useSaveContentDiff";
import type { OriginatingDataDescriptor, TagDescriptor } from "./Shared/Types";

const ItemCRUDTable = (props: Readonly<CRUDTableProps<ItemDescriptor, "id">>) => CRUDTable(props);

export default function ManageConferenceContentPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage content at ${conference.shortName}`);

    const saveContentDiff = useSaveContentDiff();

    const groupTypeOptions: SelectOption[] = useMemo(() => {
        return Object.keys(ItemType_Enum)
            .filter(
                (key) =>
                    typeof (ItemType_Enum as any)[key] === "string" &&
                    GroupTemplates[(ItemType_Enum as any)[key] as ItemType_Enum].supported
            )
            .map((key) => {
                const v = (ItemType_Enum as any)[key] as string;
                return {
                    label: v
                        .split("_")
                        .map((x) => x[0] + x.substr(1).toLowerCase())
                        .reduce((acc, x) => `${acc} ${x}`),
                    value: v,
                };
            });
    }, []);

    const [allGroupsMap, setAllItemsMap] = useState<Map<string, ItemDescriptor>>();
    const [allPeopleMap, setAllPeopleMap] = useState<Map<string, ProgramPersonDescriptor>>();
    const [allExhibitionsMap, setAllExhibitionsMap] = useState<Map<string, ExhibitionDescriptor>>();
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
                itemId={key}
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
            [K: string]: Readonly<PrimaryField<ItemDescriptor, any>>;
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
                isEditable: true,
                isEditableAtCreate: true,
                defaultValue: {
                    label: "Paper",
                    value: ItemType_Enum.Paper,
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
        if (!saveContentDiff.loadingContent && !saveContentDiff.errorContent && saveContentDiff.originalItems) {
            const newGroupsMap = new Map<string, ItemDescriptor>();
            const newPeopleMap = new Map<string, ProgramPersonDescriptor>();
            const newTagsMap = new Map<string, TagDescriptor>();
            const newExhibitionsMap = new Map<string, ExhibitionDescriptor>();
            const newOriginatingDatasMap = new Map<string, OriginatingDataDescriptor>();
            for (const [key, group] of saveContentDiff.originalItems) {
                // Deep clone so that when we manipulate stuff later it doesn't
                // accidentally screw up the query data
                const newGroup: ItemDescriptor = deepCloneItemDescriptor(group);
                // fitGroupToTemplate(newGroup);
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
            for (const [key, value] of saveContentDiff.originalExhibitions) {
                newExhibitionsMap.set(key, { ...value });
            }
            setAllItemsMap(newGroupsMap);
            setAllPeopleMap(newPeopleMap);
            setAllTagsMap(newTagsMap);
            setAllOriginatingDatasMap(newOriginatingDatasMap);
            setAllExhibitionsMap(newExhibitionsMap);
        }
    }, [
        saveContentDiff.errorContent,
        saveContentDiff.loadingContent,
        saveContentDiff.originalItems,
        saveContentDiff.originalExhibitions,
        saveContentDiff.originalOriginatingDatas,
        saveContentDiff.originalPeople,
        saveContentDiff.originalTags,
    ]);

    const [sendSubmissionRequests, { loading: sendingRequestsLoading }] = useInsertSubmissionRequestEmailJobsMutation();

    const { isOpen: tagsModalOpen, onOpen: onTagsModalOpen, onClose: onTagsModalClose } = useDisclosure();
    const [dirtyTagIds, setDirtyTagIds] = useState<Set<string>>(new Set());

    const {
        isOpen: exhibitionsModalOpen,
        onOpen: onExhibitionsModalOpen,
        onClose: onExhibitionsModalClose,
    } = useDisclosure();
    const [editedExhibitionsIds, setEditedExhibitionsIds] = useState<Set<string>>(new Set());

    const sendSubmissionRequestsModal = useDisclosure();
    const reviewSubmissionsModal = useDisclosure();
    const [submissionRequestItems, setSubmissionRequestItems] = useState<ItemDescriptor[]>([]);
    const [submissionReviewItems, setSubmissionReviewItems] = useState<ItemDescriptor[]>([]);

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
            (!allGroupsMap || !allTagsMap || !allPeopleMap || !allOriginatingDatasMap || !allExhibitionsMap) ? (
                <Spinner />
            ) : saveContentDiff.errorContent ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <ItemCRUDTable
                key="crud-table"
                data={allGroupsMap ?? new Map()}
                externalUnsavedChanges={dirtyTagIds.size > 0 || editedExhibitionsIds.size > 0}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, group) => {
                            const newGroup = {
                                ...group,
                                isNew: true,
                                id: tempKey,
                                items: [],
                                uploadableItems: [],
                                exhibitions: [],
                                people: [],
                                tagIds: group.tagIds ?? new Set(),
                                rooms: [],
                            } as ItemDescriptor;
                            fitGroupToTemplate(newGroup);
                            setAllItemsMap((oldData) => {
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

                            setAllItemsMap((oldData) => {
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

                            setAllItemsMap((oldData) => {
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
                            assert(allExhibitionsMap);
                            assert(allOriginatingDatasMap);
                            assert(!saveContentDiff.loadingContent);
                            assert(!saveContentDiff.errorContent);
                            assert(saveContentDiff.originalItems);
                            const results = await saveContentDiff.saveContentDiff(
                                {
                                    groupKeys: keys,
                                    originatingDataKeys: new Set(),
                                    peopleKeys: new Set(),
                                    tagKeys: dirtyTagIds,
                                    exhibitionKeys: editedExhibitionsIds,
                                },
                                allTagsMap,
                                allPeopleMap,
                                allOriginatingDatasMap,
                                allGroupsMap,
                                allExhibitionsMap
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

                            setEditedExhibitionsIds((oldExhibitionIds) => {
                                const newExhibitionIds = new Set(oldExhibitionIds);
                                for (const [exhibitionId, result] of results.exhibitions) {
                                    if (result) {
                                        newExhibitionIds.delete(exhibitionId);
                                    }
                                }
                                return newExhibitionIds;
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
                        assert(allExhibitionsMap);
                        assert(allOriginatingDatasMap);
                        return ItemSecondaryEditor(
                            allGroupsMap,
                            allPeopleMap,
                            allOriginatingDatasMap,
                            allExhibitionsMap,
                            key,
                            markDirty,
                            setAllItemsMap,
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
                            onExhibitionsModalOpen();
                        },
                        enabledWhenNothingSelected: true,
                        enabledWhenDirty: true,
                        tooltipWhenDisabled: "",
                        tooltipWhenEnabled: "Exhibitions can exhibit items, rooms and events.",
                        colorScheme: "purple",
                        isRunning: false,
                        label: "Manage exhibitions",
                        text: "Manage exhibitions",
                    },
                    {
                        action: async (groupKeys) => {
                            if (!allGroupsMap) {
                                return;
                            }
                            const items = Array.from(allGroupsMap.entries())
                                .filter((entry) => groupKeys.has(entry[0]))
                                .map((entry) => entry[1]);
                            setSubmissionRequestItems(items);
                            sendSubmissionRequestsModal.onOpen();
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
                    {
                        action: async (groupKeys) => {
                            if (!allGroupsMap) {
                                return;
                            }
                            const items = Array.from(allGroupsMap.entries())
                                .filter((entry) => groupKeys.has(entry[0]))
                                .map((entry) => entry[1]);
                            setSubmissionReviewItems(items);
                            reviewSubmissionsModal.onOpen();
                        },
                        enabledWhenNothingSelected: false,
                        enabledWhenDirty: false,
                        tooltipWhenDisabled: "Save your changes to enable reviewing submissions",
                        tooltipWhenEnabled: "Opens the submission review dialog for selected items",
                        colorScheme: "red",
                        isRunning: false,
                        label: "Review submissions",
                        text: "Review submissions",
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
            <SendSubmissionRequestsModal
                items={submissionRequestItems}
                isOpen={sendSubmissionRequestsModal.isOpen}
                onClose={sendSubmissionRequestsModal.onClose}
                send={async (uploaderIds: string[], emailTemplate: EmailTemplate_BaseConfig) => {
                    const result = await sendSubmissionRequests({
                        variables: {
                            objs: uploaderIds.map((id) => ({ uploaderId: id, emailTemplate })),
                        },
                    });
                    if (result?.errors && result.errors.length > 0) {
                        console.error("Failed to insert SubmissionRequestEmailJob", result.errors);
                        throw new Error("Error submitting query");
                    }
                }}
            />
            <SubmissionReviewModal
                items={submissionReviewItems}
                isOpen={reviewSubmissionsModal.isOpen}
                onClose={reviewSubmissionsModal.onClose}
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
            <ManageExhibitionsModal
                exhibitions={allExhibitionsMap ?? new Map()}
                areExhibitionsDirty={editedExhibitionsIds.size > 0}
                isOpen={exhibitionsModalOpen}
                onOpen={onExhibitionsModalOpen}
                onClose={onExhibitionsModalClose}
                insertExhibition={(exhibition) => {
                    setEditedExhibitionsIds((oldExhibitionIds) => {
                        const newExhibitionIds = new Set(oldExhibitionIds);
                        newExhibitionIds.add(exhibition.id);
                        return newExhibitionIds;
                    });
                    setAllExhibitionsMap((oldExhibitions) => {
                        const newExhibitions: Map<string, ExhibitionDescriptor> = oldExhibitions
                            ? new Map(oldExhibitions)
                            : new Map();
                        newExhibitions.set(exhibition.id, exhibition);
                        return newExhibitions;
                    });
                }}
                updateExhibition={(exhibition) => {
                    setEditedExhibitionsIds((oldExhibitionIds) => {
                        const newExhibitionIds = new Set(oldExhibitionIds);
                        newExhibitionIds.add(exhibition.id);
                        return newExhibitionIds;
                    });
                    setAllExhibitionsMap((oldExhibitions) => {
                        const newExhibitions: Map<string, ExhibitionDescriptor> = oldExhibitions
                            ? new Map(oldExhibitions)
                            : new Map();
                        newExhibitions.set(exhibition.id, exhibition);
                        return newExhibitions;
                    });
                }}
                deleteExhibition={(exhibitionId) => {
                    const isInUse = Array.from(allGroupsMap?.values() ?? []).some((group) =>
                        group.exhibitions.some((x) => x.exhibitionId === exhibitionId)
                    );
                    if (isInUse) {
                        toast({
                            description:
                                "Cannot delete a exhibition while they are associated with some content. Please dissociate the exhibition from all content then try again.",
                            isClosable: true,
                            status: "error",
                            title: "Cannot delete exhibition",
                        });
                    } else {
                        setEditedExhibitionsIds((oldExhibitionIds) => {
                            const newExhibitionIds = new Set(oldExhibitionIds);
                            newExhibitionIds.add(exhibitionId);
                            return newExhibitionIds;
                        });
                        setAllExhibitionsMap((oldExhibitions) => {
                            const newExhibitions: Map<string, ExhibitionDescriptor> = oldExhibitions
                                ? new Map(oldExhibitions)
                                : new Map();
                            newExhibitions.delete(exhibitionId);
                            return newExhibitions;
                        });
                    }
                }}
            />
            {/* <PublishVideosModal
                isOpen={publishVideosModalOpen}
                onOpen={onPublishVideosModalOpen}
                onClose={onPublishVideosModalClose}
                itemIds={publishVideosIds}
            /> */}
        </RequireAtLeastOnePermissionWrapper>
    );
}

export function GroupPeopleEditorModal({
    group,
    peopleMap,
    isDirty,
    markDirty,
    setAllItemsMap,
}: {
    group: ItemDescriptor;
    peopleMap: Map<string, ProgramPersonDescriptor>;
    isDirty: boolean;
    markDirty: () => void;
    setAllItemsMap: React.Dispatch<React.SetStateAction<Map<string, ItemDescriptor> | undefined>>;
}): JSX.Element {
    const { isOpen: isUploadersOpen, onOpen: onUploadersOpen, onClose: onUploadersClose } = useDisclosure();
    const accordianContents = (
        <>
            <ItemPersonsModal
                isGroupDirty={isDirty}
                isOpen={isUploadersOpen}
                onOpen={onUploadersOpen}
                onClose={onUploadersClose}
                group={group}
                peopleMap={peopleMap}
                insertItemPerson={(itemPerson) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            people: [...existingGroup.people, itemPerson],
                        });
                        return newGroups;
                    });
                }}
                updateItemPerson={(itemPerson) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            people: existingGroup.people.map((existingItemPerson) =>
                                existingItemPerson.id === itemPerson.id ? itemPerson : existingItemPerson
                            ),
                        });
                        return newGroups;
                    });
                }}
                deleteItemPerson={(itemPersonId) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            people: existingGroup.people.filter(
                                (existingItemPerson) => existingItemPerson.id !== itemPersonId
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

export function GroupExhibitionsEditorModal({
    group,
    exhibitionsMap,
    isDirty,
    markDirty,
    setAllItemsMap,
}: {
    group: ItemDescriptor;
    exhibitionsMap: Map<string, ExhibitionDescriptor>;
    isDirty: boolean;
    markDirty: () => void;
    setAllItemsMap: React.Dispatch<React.SetStateAction<Map<string, ItemDescriptor> | undefined>>;
}): JSX.Element {
    const { isOpen: isUploadersOpen, onOpen: onUploadersOpen, onClose: onUploadersClose } = useDisclosure();
    const accordianContents = (
        <>
            <ItemExhibitionsModal
                isGroupDirty={isDirty}
                isOpen={isUploadersOpen}
                onOpen={onUploadersOpen}
                onClose={onUploadersClose}
                group={group}
                exhibitionsMap={exhibitionsMap}
                insertItemExhibition={(itemExhibition) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            exhibitions: [...existingGroup.exhibitions, itemExhibition],
                        });
                        return newGroups;
                    });
                }}
                updateItemExhibition={(itemExhibition) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            exhibitions: existingGroup.exhibitions.map((existingItemExhibition) =>
                                existingItemExhibition.id === itemExhibition.id
                                    ? itemExhibition
                                    : existingItemExhibition
                            ),
                        });
                        return newGroups;
                    });
                }}
                deleteItemExhibition={(itemExhibitionId) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            exhibitions: existingGroup.exhibitions.filter(
                                (existingItemExhibition) => existingItemExhibition.id !== itemExhibitionId
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

export function UploadableItemEditorModal({
    group,
    itemTemplate,
    isDirty,
    markDirty,
    setAllItemsMap,
    itemDesc,
}: {
    group: ItemDescriptor;
    itemTemplate: SupportedItemBaseTemplate;
    isDirty: boolean;
    markDirty: () => void;
    setAllItemsMap: React.Dispatch<React.SetStateAction<Map<string, ItemDescriptor> | undefined>>;
    itemDesc:
        | {
              type: "required-only";
              uploadableItem: UploadableElementDescriptor;
          }
        | {
              type: "required-and-item";
              uploadableItem: UploadableElementDescriptor;
              item: ElementDescriptor;
          };
}): JSX.Element {
    const reqItemEditorContents = (
        <itemTemplate.renderEditor
            data={itemDesc}
            update={(updatedDesc) => {
                assert(updatedDesc.type !== "item-only");
                markDirty();

                setAllItemsMap((oldGroups) => {
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
                        uploadableItems: existingGroup.uploadableItems.map((x) =>
                            x.id === itemDesc.uploadableItem.id ? updatedDesc.uploadableItem : x
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
                itemDesc={itemDesc.uploadableItem}
                setUploadsRemaining={(newUploadsRemaining) => {
                    markDirty();
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            uploadableItems: existingGroup.uploadableItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.uploadableItem.id) {
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
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            uploadableItems: existingGroup.uploadableItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.uploadableItem.id) {
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
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            uploadableItems: existingGroup.uploadableItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.uploadableItem.id) {
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
                    setAllItemsMap((oldGroups) => {
                        const newGroups: Map<string, ItemDescriptor> = oldGroups ? new Map(oldGroups) : new Map();
                        const existingGroup = newGroups.get(group.id);
                        assert(existingGroup);
                        newGroups.set(group.id, {
                            ...existingGroup,
                            uploadableItems: existingGroup.uploadableItems.map((existingItem) => {
                                if (existingItem.id === itemDesc.uploadableItem.id) {
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
