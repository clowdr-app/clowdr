import { ApolloError, gql } from "@apollo/client";
import assert from "assert";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroup_Insert_Input,
    ContentItem_Insert_Input,
    RequiredContentItem_Insert_Input,
    useInsertDeleteContentGroupsMutation,
    useSelectAllContentGroupsQuery,
    useUpdateContentGroupMutation,
    useUpdateContentItemMutation,
    useUpdateRequiredContentItemMutation,
    useUpdateUploaderMutation,
} from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useConference } from "../../useConference";
import { convertContentGroupsToDescriptors } from "./Functions";
import type {
    ContentGroupDescriptor,
    ContentItemDescriptor,
    RequiredContentItemDescriptor,
    UploaderDescriptor,
} from "./Types";

gql`
    fragment UploaderInfo on Uploader {
        id
        conferenceId
        email
        emailsSentCount
        name
        requiredContentItemId
    }

    fragment RequiredContentItemInfo on RequiredContentItem {
        id
        name
        contentTypeName
        conferenceId
        contentGroupId
        uploaders {
            ...UploaderInfo
        }
        originatingDataId
        originatingData {
            ...OriginatingDataInfo
        }
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
        originatingDataId
        originatingData {
            ...OriginatingDataInfo
        }
    }

    fragment OriginatingDataInfo on OriginatingData {
        id
        conferenceId
        sourceId
        data
    }

    fragment ContentPersonInfo on ContentPerson {
        id
        conferenceId
        name
        affiliation
        email
        originatingDataId
        originatingData {
            ...OriginatingDataInfo
        }
    }

    fragment ContentGroupTagInfo on ContentGroupTag {
        id
        tagId
        contentGroupId
    }

    fragment ContentGroupPersonInfo on ContentGroupPerson {
        id
        conferenceId
        groupId
        personId
        person {
            ...ContentPersonInfo
        }
        priority
        roleName
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
        people {
            ...ContentGroupPersonInfo
        }
        originatingDataId
        originatingData {
            ...OriginatingDataInfo
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

    mutation InsertDeleteContentPeople($newPeople: [ContentPerson_insert_input!]!, $deletePersonIds: [uuid!]!) {
        insert_ContentPerson(objects: $newPeople) {
            returning {
                ...ContentPersonInfo
            }
        }
        delete_ContentPerson(where: { id: { _in: $deletePersonIds } }) {
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
        $newUploaders: [Uploader_insert_input!]!
        $deleteUploaderIds: [uuid!]!
        $newGroupPeople: [ContentGroupPerson_insert_input!]!
        $deleteGroupPeopleIds: [uuid!]!
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
        insert_Uploader(objects: $newUploaders) {
            returning {
                ...UploaderInfo
            }
        }
        insert_ContentGroupPerson(objects: $newGroupPeople) {
            returning {
                ...ContentGroupPersonInfo
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
        delete_Uploader(where: { id: { _in: $deleteUploaderIds } }) {
            returning {
                id
            }
        }
        delete_ContentGroupPerson(where: { id: { _in: $deleteGroupPeopleIds } }) {
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

    mutation UpdateUploader($id: uuid!, $email: String!, $name: String!) {
        update_Uploader_by_pk(pk_columns: { id: $id }, _set: { email: $email, name: $name }) {
            ...UploaderInfo
        }
    }

    mutation UpdateGroupPerson($id: uuid!, $roleName: String!, $priority: Int!) {
        update_ContentGroupPerson_by_pk(pk_columns: { id: $id }, _set: { roleName: $roleName, priority: $priority }) {
            ...ContentGroupPersonInfo
        }
    }

    mutation UpdatePerson($id: uuid!, $name: String!, $affiliation: String!, $email: String!) {
        update_ContentPerson_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, affiliation: $affiliation, email: $email }
        ) {
            ...ContentPersonInfo
        }
    }
`;

export function useSaveContentDiff():
    | {
          loadingContentGroups: true;
          errorContentGroups: ApolloError | undefined;
          originalContentGroups: undefined;
          saveContentDiff: undefined;
      }
    | {
          loadingContentGroups: false;
          errorContentGroups: ApolloError;
          originalContentGroups: undefined;
          saveContentDiff: undefined;
      }
    | {
          loadingContentGroups: false;
          errorContentGroups: undefined;
          originalContentGroups: undefined;
          saveContentDiff: undefined;
      }
    | {
          loadingContentGroups: false;
          errorContentGroups: undefined;
          originalContentGroups: Map<string, ContentGroupDescriptor>;
          saveContentDiff: (
              keys: Set<string>,
              groups: Map<string, ContentGroupDescriptor>
          ) => Promise<Map<string, boolean>>;
      } {
    const conference = useConference();

    const [insertDeleteContentGroupsMutation] = useInsertDeleteContentGroupsMutation();
    const [updateContentGroupMutation] = useUpdateContentGroupMutation();
    const [updateContentItemMutation] = useUpdateContentItemMutation();
    const [updateRequiredContentItemMutation] = useUpdateRequiredContentItemMutation();
    const [updateUploaderMutation] = useUpdateUploaderMutation();

    const {
        loading: loadingContentGroups,
        error: errorContentGroups,
        data: allContentGroups,
    } = useSelectAllContentGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorContentGroups);

    const originalContentGroups = useMemo(() => convertContentGroupsToDescriptors(allContentGroups), [
        allContentGroups,
    ]);

    if (loadingContentGroups) {
        return {
            loadingContentGroups,
            errorContentGroups,
            originalContentGroups: undefined,
            saveContentDiff: undefined,
        };
    } else if (errorContentGroups) {
        return {
            loadingContentGroups,
            errorContentGroups,
            originalContentGroups: undefined,
            saveContentDiff: undefined,
        };
    } else if (!originalContentGroups) {
        return {
            loadingContentGroups,
            errorContentGroups,
            originalContentGroups,
            saveContentDiff: undefined,
        };
    } else {
        return {
            loadingContentGroups,
            errorContentGroups,
            originalContentGroups,
            saveContentDiff: async function saveContentDiff(
                keys: Set<string>,
                groups: Map<string, ContentGroupDescriptor>
            ) {
                const results: Map<string, boolean> = new Map();
                keys.forEach((key) => {
                    results.set(key, false);
                });

                const newGroups = new Map<string, ContentGroupDescriptor>();
                const updatedGroups = new Map<string, ContentGroupDescriptor>();
                const deletedGroupKeys = new Set<string>();
                for (const key of keys.values()) {
                    const group = groups.get(key);
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
                                                uploaders: {
                                                    data: item.uploaders.map((uploader) => ({
                                                        conferenceId: conference.id,
                                                        email: uploader.email,
                                                        id: uploader.id,
                                                        name: uploader.name,
                                                    })),
                                                },
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
                                const updatedRequiredItems = new Map<string, RequiredContentItemDescriptor>();
                                const deleteRequiredItemKeys = new Set<string>();

                                const newGroupTags = new Set<string>();
                                const deleteGroupTagKeys = new Set<string>();

                                const newUploaders = new Map<string, UploaderDescriptor>();
                                const updatedUploaders = new Map<string, UploaderDescriptor>();
                                const deleteUploaderKeys = new Set<string>();

                                const existingGroup = originalContentGroups.get(group.id);
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

                                        for (const uploader of item.uploaders) {
                                            if (uploader.isNew) {
                                                newUploaders.set(uploader.id, uploader);
                                            } else {
                                                updatedUploaders.set(uploader.id, uploader);
                                            }
                                        }
                                    }
                                }
                                for (const existingItem of existingGroup.requiredItems) {
                                    if (!updatedRequiredItems.has(existingItem.id)) {
                                        deleteRequiredItemKeys.add(existingItem.id);
                                    }

                                    for (const existingUploader of existingItem.uploaders) {
                                        if (!updatedUploaders.has(existingUploader.id)) {
                                            deleteUploaderKeys.add(existingUploader.id);
                                        }
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
                                        deleteUploaderIds: Array.from(deleteUploaderKeys.values()),
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
                                        newRequiredItems: Array.from(newRequiredItems.values()).map((item) => ({
                                            accessToken: uuidv4(),
                                            conferenceId: conference.id,
                                            contentGroupId: group.id,
                                            contentTypeName: item.typeName,
                                            id: item.id,
                                            name: item.name,
                                        })),
                                        newUploaders: Array.from(newUploaders.values()).map((uploader) => ({
                                            conferenceId: conference.id,
                                            email: uploader.email,
                                            id: uploader.id,
                                            name: uploader.name,
                                            requiredContentItemId: uploader.requiredContentItemId,
                                        })),
                                        deleteGroupPeopleIds: [], // TODO
                                        newGroupPeople: [], // TODO
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

                                await Promise.all(
                                    Array.from(updatedUploaders.values()).map(async (uploader) => {
                                        await updateUploaderMutation({
                                            variables: {
                                                id: uploader.id,
                                                name: uploader.name,
                                                email: uploader.email,
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
        };
    }
}
