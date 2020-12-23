import { ApolloError, gql } from "@apollo/client";
import assert from "assert";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupPerson_Insert_Input,
    ContentGroup_Insert_Input,
    ContentItem_Insert_Input,
    ContentPerson_Insert_Input,
    OriginatingData_Insert_Input,
    RequiredContentItem_Insert_Input,
    Tag_Insert_Input,
    Uploader_Constraint,
    Uploader_Insert_Input,
    Uploader_Update_Column,
    useDeleteContentPeopleMutation,
    useDeleteOriginatingDatasMutation,
    useDeleteTagsMutation,
    useInsertContentPeopleMutation,
    useInsertDeleteContentGroupsMutation,
    useInsertOriginatingDatasMutation,
    useInsertTagsMutation,
    useSelectAllContentQuery,
    useUpdateContentGroupMutation,
    useUpdateContentItemMutation,
    useUpdateGroupPersonMutation,
    useUpdatePersonMutation,
    useUpdateRequiredContentItemMutation,
    useUpdateTagMutation,
    useUpdateUploaderMutation,
} from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useConference } from "../../useConference";
import { convertContentToDescriptors } from "./Functions";
import type {
    ContentGroupDescriptor,
    ContentGroupPersonDescriptor,
    ContentItemDescriptor,
    ContentPersonDescriptor,
    OriginatingDataDescriptor,
    RequiredContentItemDescriptor,
    TagDescriptor,
    UploaderDescriptor,
} from "./Types";

// person: {
//     data: {
//         affiliation: personGroup.person.affiliation,
//         conferenceId: conference.id,
//         email: personGroup.person.email,
//         id: personGroup.person.id,
//         name: personGroup.person.name,
//     },
//     on_conflict: {
//         constraint:
//             ContentPerson_Constraint.ContentPersonConferenceIdNameAffiliationKey,
//         update_columns: [ContentPerson_Update_Column.Email],
//     },
// },

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
        originatingDataId
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
    }

    fragment TagInfo on Tag {
        id
        conferenceId
        colour
        name
        originatingDataId
    }

    query SelectAllContent($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ContentGroupFullNestedInfo
        }
        ContentPerson {
            ...ContentPersonInfo
        }
        OriginatingData {
            ...OriginatingDataInfo
        }
        Tag {
            ...TagInfo
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

    mutation InsertOriginatingDatas($newDatas: [OriginatingData_insert_input!]!) {
        insert_OriginatingData(objects: $newDatas) {
            returning {
                ...OriginatingDataInfo
            }
        }
    }

    mutation DeleteOriginatingDatas($deleteDataIds: [uuid!]!) {
        delete_OriginatingData(where: { id: { _in: $deleteDataIds } }) {
            returning {
                id
            }
        }
    }

    mutation InsertTags($newTags: [Tag_insert_input!]!) {
        insert_Tag(objects: $newTags) {
            returning {
                ...TagInfo
            }
        }
    }

    mutation DeleteTags($deleteTagIds: [uuid!]!) {
        delete_Tag(where: { id: { _in: $deleteTagIds } }) {
            returning {
                id
            }
        }
    }

    mutation InsertContentPeople($newPeople: [ContentPerson_insert_input!]!) {
        insert_ContentPerson(objects: $newPeople) {
            returning {
                ...ContentPersonInfo
            }
        }
    }

    mutation DeleteContentPeople($deletePersonIds: [uuid!]!) {
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

    mutation UpdateGroupPerson($id: uuid!, $roleName: String!, $priority: Int = null) {
        update_ContentGroupPerson_by_pk(pk_columns: { id: $id }, _set: { roleName: $roleName, priority: $priority }) {
            ...ContentGroupPersonInfo
        }
    }

    mutation UpdatePerson(
        $id: uuid!
        $name: String!
        $affiliation: String = null
        $email: String = null
        $originatingDataId: uuid = null
    ) {
        update_ContentPerson_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, affiliation: $affiliation, email: $email, originatingDataId: $originatingDataId }
        ) {
            ...ContentPersonInfo
        }
    }

    mutation UpdateTag($id: uuid!, $name: String!, $colour: String!, $originatingDataId: uuid = null) {
        update_Tag_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, colour: $colour, originatingDataId: $originatingDataId }
        ) {
            ...TagInfo
        }
    }
`;

export type AllContentStateT =
    | {
          contentGroups: Map<string, ContentGroupDescriptor>;
          people: Map<string, ContentPersonDescriptor>;
          tags: Map<string, TagDescriptor>;
          originatingDatas: Map<string, OriginatingDataDescriptor>;
      }
    | undefined;

export function useSaveContentDiff():
    | {
          loadingContent: true;
          errorContent: ApolloError | undefined;
          originalContentGroups: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
      }
    | {
          loadingContent: false;
          errorContent: ApolloError;
          originalContentGroups: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
      }
    | {
          loadingContent: false;
          errorContent: undefined;
          originalContentGroups: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
      }
    | {
          loadingContent: boolean;
          errorContent: undefined;
          originalContentGroups: Map<string, ContentGroupDescriptor>;
          originalPeople: Map<string, ContentPersonDescriptor>;
          originalTags: Map<string, TagDescriptor>;
          originalOriginatingDatas: Map<string, OriginatingDataDescriptor>;
          saveContentDiff: (
              dirtyKeys: {
                  tagKeys: Set<string>;
                  peopleKeys: Set<string>;
                  originatingDataKeys: Set<string>;
                  groupKeys: Set<string>;
              },
              tags: Map<string, TagDescriptor>,
              people: Map<string, ContentPersonDescriptor>,
              originatingDatas: Map<string, OriginatingDataDescriptor>,
              groups: Map<string, ContentGroupDescriptor>
          ) => Promise<{
              groups: Map<string, boolean>;
              people: Map<string, boolean>;
              tags: Map<string, boolean>;
              originatingDatas: Map<string, boolean>;
          }>;
      } {
    const conference = useConference();

    const [insertContentPeopleMutation] = useInsertContentPeopleMutation();
    const [deleteContentPeopleMutation] = useDeleteContentPeopleMutation();
    const [updatePersonMutation] = useUpdatePersonMutation();
    const [insertOriginatingDatasMutation] = useInsertOriginatingDatasMutation();
    const [deleteOriginatingDatasMutation] = useDeleteOriginatingDatasMutation();
    const [insertTagsMutation] = useInsertTagsMutation();
    const [deleteTagsMutation] = useDeleteTagsMutation();
    const [updateTagMutation] = useUpdateTagMutation();

    const [insertDeleteContentGroupsMutation] = useInsertDeleteContentGroupsMutation();
    const [updateContentGroupMutation] = useUpdateContentGroupMutation();
    const [updateContentItemMutation] = useUpdateContentItemMutation();
    const [updateRequiredContentItemMutation] = useUpdateRequiredContentItemMutation();
    const [updateUploaderMutation] = useUpdateUploaderMutation();
    const [updateGroupPersonMutation] = useUpdateGroupPersonMutation();

    const { loading: loadingContent, error: errorContent, data: allContent } = useSelectAllContentQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorContent);

    const [original, setOriginal] = useState<AllContentStateT>();
    useEffect(() => {
        if (allContent) {
            setOriginal(convertContentToDescriptors(allContent));
        }
    }, [allContent]);

    if (loadingContent && !original) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
        };
    } else if (errorContent) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
        };
    } else if (!original) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
        };
    } else {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: original.contentGroups,
            originalOriginatingDatas: original.originatingDatas,
            originalPeople: original.people,
            originalTags: original.tags,
            saveContentDiff: async function saveContentDiff(
                { groupKeys, originatingDataKeys, peopleKeys, tagKeys },
                tags,
                people,
                originatingDatas,
                groups
            ) {
                const tagResults: Map<string, boolean> = new Map();
                tagKeys.forEach((key) => {
                    tagResults.set(key, false);
                });

                const originatingDataResults: Map<string, boolean> = new Map();
                originatingDataKeys.forEach((key) => {
                    originatingDataResults.set(key, false);
                });

                const peopleResults: Map<string, boolean> = new Map();
                peopleKeys.forEach((key) => {
                    peopleResults.set(key, false);
                });

                const groupResults: Map<string, boolean> = new Map();
                groupKeys.forEach((key) => {
                    groupResults.set(key, false);
                });

                const newTags = new Map<string, TagDescriptor>();
                const updatedTags = new Map<string, TagDescriptor>();
                const deletedTagKeys = new Set<string>();
                for (const key of tagKeys.values()) {
                    const tag = tags.get(key);
                    if (tag) {
                        if (tag.isNew) {
                            newTags.set(key, tag);
                        } else {
                            updatedTags.set(key, tag);
                        }
                    } else {
                        deletedTagKeys.add(key);
                    }
                }

                const newPeople = new Map<string, ContentPersonDescriptor>();
                const updatedPeople = new Map<string, ContentPersonDescriptor>();
                const deletedPersonKeys = new Set<string>();
                for (const key of peopleKeys.values()) {
                    const person = people.get(key);
                    if (person) {
                        if (person.isNew) {
                            newPeople.set(key, person);
                        } else {
                            updatedPeople.set(key, person);
                        }
                    } else {
                        deletedPersonKeys.add(key);
                    }
                }

                const newOriginatingDatas = new Map<string, OriginatingDataDescriptor>();
                const updatedOriginatingDatas = new Map<string, OriginatingDataDescriptor>();
                const deletedOriginatingDataKeys = new Set<string>();
                for (const key of originatingDataKeys.values()) {
                    const originatingData = originatingDatas.get(key);
                    if (originatingData) {
                        if (originatingData.isNew) {
                            newOriginatingDatas.set(key, originatingData);
                        } else {
                            updatedOriginatingDatas.set(key, originatingData);
                        }
                    } else {
                        deletedOriginatingDataKeys.add(key);
                    }
                }

                const newGroups = new Map<string, ContentGroupDescriptor>();
                const updatedGroups = new Map<string, ContentGroupDescriptor>();
                const deletedGroupKeys = new Set<string>();
                for (const key of groupKeys.values()) {
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
                    await insertTagsMutation({
                        variables: {
                            newTags: Array.from(newTags.values()).map(
                                (tag): Tag_Insert_Input => ({
                                    id: tag.id,
                                    name: tag.name,
                                    colour: tag.colour,
                                    conferenceId: conference.id,
                                    originatingDataId: tag.originatingDataId,
                                })
                            ),
                        },
                    });
                    for (const key of newTags.keys()) {
                        tagResults.set(key, true);
                    }

                    const updateTagResultsArr: [string, boolean][] = await Promise.all(
                        Array.from(updatedTags.values()).map(
                            async (tag): Promise<[string, boolean]> => {
                                let ok = false;
                                try {
                                    await updateTagMutation({
                                        variables: {
                                            id: tag.id,
                                            colour: tag.colour,
                                            name: tag.name,
                                            originatingDataId: tag.originatingDataId,
                                        },
                                    });
                                    ok = true;
                                } catch (_e) {
                                    ok = false;
                                }
                                return [tag.id, ok];
                            }
                        )
                    );
                    for (const [key, val] of updateTagResultsArr) {
                        tagResults.set(key, val);
                    }

                    await insertOriginatingDatasMutation({
                        variables: {
                            newDatas: Array.from(newOriginatingDatas.values()).map(
                                (originatingData): OriginatingData_Insert_Input => ({
                                    id: originatingData.id,
                                    conferenceId: conference.id,
                                    data: originatingData.data,
                                    sourceId: originatingData.sourceId,
                                })
                            ),
                        },
                    });
                    for (const key of newOriginatingDatas.keys()) {
                        originatingDataResults.set(key, true);
                    }

                    await insertContentPeopleMutation({
                        variables: {
                            newPeople: Array.from(newPeople.values()).map(
                                (person): ContentPerson_Insert_Input => ({
                                    id: person.id,
                                    conferenceId: conference.id,
                                    affiliation: person.affiliation,
                                    email: person.email,
                                    name: person.name,
                                    originatingDataId: person.originatingDataId,
                                })
                            ),
                        },
                    });
                    for (const key of newPeople.keys()) {
                        peopleResults.set(key, true);
                    }

                    const updateContentPersonResultsArr: [string, boolean][] = await Promise.all(
                        Array.from(updatedPeople.values()).map(
                            async (person): Promise<[string, boolean]> => {
                                let ok = false;
                                try {
                                    await updatePersonMutation({
                                        variables: {
                                            id: person.id,
                                            affiliation: person.affiliation,
                                            email: person.email,
                                            name: person.name,
                                            originatingDataId: person.originatingDataId,
                                        },
                                    });
                                    ok = true;
                                } catch (_e) {
                                    ok = false;
                                }
                                return [person.id, ok];
                            }
                        )
                    );
                    for (const [key, val] of updateContentPersonResultsArr) {
                        peopleResults.set(key, val);
                    }

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
                                                originatingDataId: item.originatingDataId,
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
                                                    data: item.uploaders.map(
                                                        (uploader): Uploader_Insert_Input => ({
                                                            conferenceId: conference.id,
                                                            email: uploader.email,
                                                            id: uploader.id,
                                                            name: uploader.name,
                                                        })
                                                    ),
                                                    on_conflict: {
                                                        constraint:
                                                            Uploader_Constraint.UploaderEmailRequiredContentItemIdKey,
                                                        update_columns: [Uploader_Update_Column.Name],
                                                    },
                                                },
                                                originatingDataId: item.originatingDataId,
                                            };
                                            return itemResult;
                                        }),
                                    },
                                    people: {
                                        data: group.people.map((personGroup) => {
                                            const personGroupResult: ContentGroupPerson_Insert_Input = {
                                                id: personGroup.id,
                                                conferenceId: conference.id,
                                                priority: personGroup.priority,
                                                roleName: personGroup.roleName,
                                                personId: personGroup.personId,
                                            };
                                            return personGroupResult;
                                        }),
                                    },
                                    originatingDataId: group.originatingDataId,
                                    shortTitle: group.shortTitle,
                                    title: group.title,
                                };
                                return groupResult;
                            }),
                        },
                    });

                    for (const key of newGroups.keys()) {
                        groupResults.set(key, true);
                    }
                    for (const key of deletedGroupKeys.keys()) {
                        groupResults.set(key, true);
                    }
                } catch {
                    for (const key of newGroups.keys()) {
                        groupResults.set(key, false);
                    }
                    for (const key of deletedGroupKeys.keys()) {
                        groupResults.set(key, false);
                    }
                }

                const updateGroupResultsArr: [string, boolean][] = await Promise.all(
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

                                const newGroupPersons = new Map<string, ContentGroupPersonDescriptor>();
                                const updatedGroupPersons = new Map<string, ContentGroupPersonDescriptor>();
                                const deleteGroupPersonKeys = new Set<string>();

                                const existingGroup = original.contentGroups.get(group.id);
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

                                for (const groupPerson of group.people) {
                                    if (groupPerson.isNew) {
                                        newGroupPersons.set(groupPerson.id, groupPerson);
                                    } else {
                                        updatedGroupPersons.set(groupPerson.id, groupPerson);
                                    }
                                }
                                for (const existingGroupPerson of existingGroup.people) {
                                    if (!updatedGroupPersons.has(existingGroupPerson.id)) {
                                        deleteGroupPersonKeys.add(existingGroupPerson.id);
                                    }
                                }

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
                                                originatingDataId: item.originatingDataId,
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
                                                originatingDataId: item.originatingDataId,
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

                                await Promise.all(
                                    Array.from(updatedGroupPersons.values()).map(async (groupPerson) => {
                                        await updateGroupPersonMutation({
                                            variables: {
                                                id: groupPerson.id,
                                                priority: groupPerson.priority,
                                                roleName: groupPerson.roleName,
                                            },
                                        });
                                    })
                                );

                                await updateContentGroupMutation({
                                    variables: {
                                        contentGroupTypeName: group.typeName,
                                        deleteGroupTagIds: Array.from(deleteGroupTagKeys.values()),
                                        deleteItemIds: Array.from(deleteItemKeys.values()),
                                        deleteRequiredItemIds: Array.from(deleteRequiredItemKeys.values()),
                                        deleteUploaderIds: Array.from(deleteUploaderKeys.values()),
                                        deleteGroupPeopleIds: Array.from(deleteGroupPersonKeys.values()),
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
                                            originatingDataId: item.originatingDataId,
                                        })),
                                        newRequiredItems: Array.from(newRequiredItems.values()).map((item) => ({
                                            accessToken: uuidv4(),
                                            conferenceId: conference.id,
                                            contentGroupId: group.id,
                                            contentTypeName: item.typeName,
                                            id: item.id,
                                            name: item.name,
                                            originatingDataId: item.originatingDataId,
                                            uploaders: {
                                                data: item.uploaders.map(
                                                    (uploader): Uploader_Insert_Input => ({
                                                        id: uploader.id,
                                                        email: uploader.email,
                                                        name: uploader.name,
                                                        conferenceId: conference.id,
                                                    })
                                                ),
                                            },
                                        })),
                                        newUploaders: Array.from(newUploaders.values()).map((uploader) => ({
                                            conferenceId: conference.id,
                                            email: uploader.email,
                                            id: uploader.id,
                                            name: uploader.name,
                                            requiredContentItemId: uploader.requiredContentItemId,
                                        })),
                                        newGroupPeople: Array.from(newGroupPersons.values()).map((groupPerson) => ({
                                            conferenceId: conference.id,
                                            id: groupPerson.id,
                                            personId: groupPerson.id,
                                            priority: groupPerson.priority,
                                            roleName: groupPerson.roleName,
                                        })),
                                        originatingDataId: group.originatingDataId,
                                        shortTitle: group.shortTitle,
                                        title: group.title,
                                    },
                                });

                                ok = true;
                            } catch (e) {
                                ok = false;
                            }
                            return [group.id, ok];
                        }
                    )
                );
                for (const [key, val] of updateGroupResultsArr) {
                    groupResults.set(key, val);
                }

                try {
                    await deleteTagsMutation({
                        variables: {
                            deleteTagIds: Array.from(deletedTagKeys.values()),
                        },
                    });
                    for (const key of deletedTagKeys.keys()) {
                        tagResults.set(key, true);
                    }
                } catch {
                    for (const key of deletedTagKeys.keys()) {
                        tagResults.set(key, false);
                    }
                }

                try {
                    await deleteContentPeopleMutation({
                        variables: {
                            deletePersonIds: Array.from(deletedPersonKeys.values()),
                        },
                    });
                    for (const key of deletedPersonKeys.keys()) {
                        peopleResults.set(key, true);
                    }
                } catch {
                    for (const key of deletedPersonKeys.keys()) {
                        peopleResults.set(key, false);
                    }
                }

                try {
                    await deleteOriginatingDatasMutation({
                        variables: {
                            deleteDataIds: Array.from(deletedOriginatingDataKeys.values()),
                        },
                    });
                    for (const key of deletedOriginatingDataKeys.keys()) {
                        originatingDataResults.set(key, true);
                    }
                } catch {
                    for (const key of deletedOriginatingDataKeys.keys()) {
                        originatingDataResults.set(key, false);
                    }
                }

                return {
                    groups: groupResults,
                    originatingDatas: originatingDataResults,
                    people: peopleResults,
                    tags: tagResults,
                };
            },
        };
    }
}
