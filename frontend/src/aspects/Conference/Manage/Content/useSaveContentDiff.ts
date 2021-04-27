import { ApolloError, gql } from "@apollo/client";
import assert from "assert";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupHallway_Insert_Input,
    ContentGroupPerson_Insert_Input,
    ContentGroup_Insert_Input,
    ContentItem_Insert_Input,
    ContentPerson_Insert_Input,
    Hallway_Insert_Input,
    OriginatingData_Insert_Input,
    RequiredContentItem_Insert_Input,
    Tag_Insert_Input,
    Uploader_Constraint,
    Uploader_Insert_Input,
    Uploader_Update_Column,
    useDeleteContentPeopleMutation,
    useDeleteHallwaysMutation,
    useDeleteOriginatingDatasMutation,
    useDeleteTagsMutation,
    useInsertContentPeopleMutation,
    useInsertDeleteContentGroupsMutation,
    useInsertHallwaysMutation,
    useInsertOriginatingDatasMutation,
    useInsertTagsMutation,
    useSelectAllContentQuery,
    useUpdateContentGroupMutation,
    useUpdateContentItemMutation,
    useUpdateGroupHallwayMutation,
    useUpdateGroupPersonMutation,
    useUpdateHallwayMutation,
    useUpdatePersonMutation,
    useUpdateRequiredContentItemMutation,
    useUpdateTagMutation,
    useUpdateUploaderMutation,
} from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useConference } from "../../useConference";
import type { OriginatingDataDescriptor, TagDescriptor } from "../Shared/Types";
import { convertContentToDescriptors } from "./Functions";
import type {
    ContentGroupDescriptor,
    ContentGroupHallwayDescriptor,
    ContentGroupPersonDescriptor,
    ContentItemDescriptor,
    ContentPersonDescriptor,
    HallwayDescriptor,
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
        isHidden
        contentTypeName
        conferenceId
        contentGroupId
        uploadsRemaining
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
        attendeeId
    }

    fragment ContentGroupTagInfo on ContentGroupTag {
        id
        tagId
        contentGroupId
    }

    fragment ContentGroupHallwayInfo on ContentGroupHallway {
        id
        groupId
        hallwayId
        conferenceId
        priority
        layout
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
        hallways {
            ...ContentGroupHallwayInfo
        }
        people {
            ...ContentGroupPersonInfo
        }
        originatingDataId
        rooms(where: { originatingEventId: { _is_null: true } }, limit: 1, order_by: { created_at: asc }) {
            id
        }
    }

    fragment TagInfo on Tag {
        id
        conferenceId
        colour
        name
        originatingDataId
        priority
    }

    fragment HallwayInfo on Hallway {
        id
        conferenceId
        colour
        name
        priority
    }

    query SelectAllContent($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId }, contentGroupTypeName: { _neq: SPONSOR } }) {
            ...ContentGroupFullNestedInfo
        }
        ContentPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ContentPersonInfo
        }
        OriginatingData(where: { conferenceId: { _eq: $conferenceId } }) {
            ...OriginatingDataInfo
        }
        Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...TagInfo
        }
        Hallway(where: { conferenceId: { _eq: $conferenceId } }) {
            ...HallwayInfo
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

    mutation InsertHallways($newHallways: [Hallway_insert_input!]!) {
        insert_Hallway(objects: $newHallways) {
            returning {
                ...HallwayInfo
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

    mutation DeleteHallways($deleteHallwayIds: [uuid!]!) {
        delete_Hallway(where: { id: { _in: $deleteHallwayIds } }) {
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
        $newGroupHallways: [ContentGroupHallway_insert_input!]!
        $groupId: uuid!
        $contentGroupTypeName: ContentGroupType_enum!
        $originatingDataId: uuid = null
        $shortTitle: String = null
        $title: String!
        $deleteItemIds: [uuid!]!
        $deleteRequiredItemIds: [uuid!]!
        $deleteGroupTagIds: [uuid!]!
        $deleteGroupHallwayIds: [uuid!]!
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
        insert_ContentGroupHallway(objects: $newGroupHallways) {
            returning {
                ...ContentGroupHallwayInfo
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
        delete_ContentGroupTag(where: { contentGroupId: { _eq: $groupId }, tagId: { _in: $deleteGroupTagIds } }) {
            returning {
                id
            }
        }
        delete_ContentGroupHallway(where: { id: { _in: $deleteGroupHallwayIds } }) {
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
        $layoutData: jsonb = null
        $name: String!
        $data: jsonb!
        $isHidden: Boolean!
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
                isHidden: $isHidden
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
        $isHidden: Boolean!
        $uploadsRemaining: Int = null
        $originatingDataId: uuid = null
    ) {
        update_RequiredContentItem_by_pk(
            pk_columns: { id: $id }
            _set: {
                contentTypeName: $contentTypeName
                name: $name
                isHidden: $isHidden
                originatingDataId: $originatingDataId
                uploadsRemaining: $uploadsRemaining
            }
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

    mutation UpdateGroupHallway($id: uuid!, $priority: Int = null, $layout: jsonb = null) {
        update_ContentGroupHallway_by_pk(pk_columns: { id: $id }, _set: { layout: $layout, priority: $priority }) {
            ...ContentGroupHallwayInfo
        }
    }

    mutation UpdatePerson(
        $id: uuid!
        $name: String!
        $affiliation: String = null
        $email: String = null
        $originatingDataId: uuid = null
        $attendeeId: uuid = null
    ) {
        update_ContentPerson_by_pk(
            pk_columns: { id: $id }
            _set: {
                name: $name
                affiliation: $affiliation
                email: $email
                originatingDataId: $originatingDataId
                attendeeId: $attendeeId
            }
        ) {
            ...ContentPersonInfo
        }
    }

    mutation UpdateTag(
        $id: uuid!
        $name: String!
        $colour: String!
        $originatingDataId: uuid = null
        $priority: Int! = 10
    ) {
        update_Tag_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, colour: $colour, originatingDataId: $originatingDataId, priority: $priority }
        ) {
            ...TagInfo
        }
    }

    mutation UpdateHallway($id: uuid!, $name: String!, $colour: String!, $priority: Int!) {
        update_Hallway_by_pk(pk_columns: { id: $id }, _set: { name: $name, colour: $colour, priority: $priority }) {
            ...HallwayInfo
        }
    }
`;

export type AllContentStateT =
    | {
          contentGroups: Map<string, ContentGroupDescriptor>;
          people: Map<string, ContentPersonDescriptor>;
          tags: Map<string, TagDescriptor>;
          hallways: Map<string, HallwayDescriptor>;
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
          originalHallways: undefined;
      }
    | {
          loadingContent: false;
          errorContent: ApolloError;
          originalContentGroups: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
          originalHallways: undefined;
      }
    | {
          loadingContent: false;
          errorContent: undefined;
          originalContentGroups: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
          originalHallways: undefined;
      }
    | {
          loadingContent: boolean;
          errorContent: undefined;
          originalContentGroups: Map<string, ContentGroupDescriptor>;
          originalPeople: Map<string, ContentPersonDescriptor>;
          originalTags: Map<string, TagDescriptor>;
          originalOriginatingDatas: Map<string, OriginatingDataDescriptor>;
          originalHallways: Map<string, HallwayDescriptor>;
          saveContentDiff: (
              dirtyKeys: {
                  tagKeys: Set<string>;
                  peopleKeys: Set<string>;
                  originatingDataKeys: Set<string>;
                  groupKeys: Set<string>;
                  hallwayKeys: Set<string>;
              },
              tags: Map<string, TagDescriptor>,
              people: Map<string, ContentPersonDescriptor>,
              originatingDatas: Map<string, OriginatingDataDescriptor>,
              groups: Map<string, ContentGroupDescriptor>,
              hallways: Map<string, HallwayDescriptor>
          ) => Promise<{
              groups: Map<string, boolean>;
              people: Map<string, boolean>;
              tags: Map<string, boolean>;
              originatingDatas: Map<string, boolean>;
              hallways: Map<string, boolean>;
          }>;
      } {
    const conference = useConference();

    const [insertContentPeopleMutation] = useInsertContentPeopleMutation();
    const [deleteContentPeopleMutation] = useDeleteContentPeopleMutation();
    const [updatePersonMutation] = useUpdatePersonMutation();
    const [insertHallwaysMutation] = useInsertHallwaysMutation();
    const [deleteHallwaysMutation] = useDeleteHallwaysMutation();
    const [updateHallwayMutation] = useUpdateHallwayMutation();
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
    const [updateGroupHallwayMutation] = useUpdateGroupHallwayMutation();

    const { loading: loadingContent, error: errorContent, data: allContent } = useSelectAllContentQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorContent, false);

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
            originalHallways: undefined,
        };
    } else if (errorContent) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
            originalHallways: undefined,
        };
    } else if (!original) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
            originalHallways: undefined,
        };
    } else {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalContentGroups: original.contentGroups,
            originalOriginatingDatas: original.originatingDatas,
            originalPeople: original.people,
            originalTags: original.tags,
            originalHallways: original.hallways,
            saveContentDiff: async function saveContentDiff(
                { groupKeys, originatingDataKeys, peopleKeys, tagKeys, hallwayKeys },
                tags,
                people,
                originatingDatas,
                groups,
                hallways
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

                const hallwayResults: Map<string, boolean> = new Map();
                hallwayKeys.forEach((key) => {
                    hallwayResults.set(key, false);
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

                const newHallways = new Map<string, HallwayDescriptor>();
                const updatedHallways = new Map<string, HallwayDescriptor>();
                const deletedHallwayKeys = new Set<string>();
                for (const key of hallwayKeys.values()) {
                    const hallway = hallways.get(key);
                    if (hallway) {
                        if (hallway.isNew) {
                            newHallways.set(key, hallway);
                        } else {
                            updatedHallways.set(key, hallway);
                        }
                    } else {
                        deletedHallwayKeys.add(key);
                    }
                }

                try {
                    if (newTags.size > 0) {
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
                                            priority: tag.priority,
                                        },
                                    });
                                    ok = true;
                                } catch (e) {
                                    console.error("Error updating tag", e);
                                    ok = false;
                                }
                                return [tag.id, ok];
                            }
                        )
                    );
                    for (const [key, val] of updateTagResultsArr) {
                        tagResults.set(key, val);
                    }

                    if (newOriginatingDatas.size > 0) {
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
                    }

                    if (newPeople.size > 0) {
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
                                        attendeeId: person.attendeeId,
                                    })
                                ),
                            },
                        });
                        for (const key of newPeople.keys()) {
                            peopleResults.set(key, true);
                        }
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
                                            attendeeId: person.attendeeId,
                                        },
                                    });
                                    ok = true;
                                } catch (e) {
                                    console.error("Error updating content person", e);
                                    ok = false;
                                }
                                return [person.id, ok];
                            }
                        )
                    );
                    for (const [key, val] of updateContentPersonResultsArr) {
                        peopleResults.set(key, val);
                    }

                    if (newHallways.size > 0) {
                        await insertHallwaysMutation({
                            variables: {
                                newHallways: Array.from(newHallways.values()).map(
                                    (hallway): Hallway_Insert_Input => ({
                                        id: hallway.id,
                                        conferenceId: conference.id,
                                        name: hallway.name,
                                        colour: hallway.colour,
                                        priority: hallway.priority,
                                    })
                                ),
                            },
                        });
                        for (const key of newHallways.keys()) {
                            hallwayResults.set(key, true);
                        }
                    }

                    const updateHallwayResultsArr: [string, boolean][] = await Promise.all(
                        Array.from(updatedHallways.values()).map(
                            async (hallway): Promise<[string, boolean]> => {
                                let ok = false;
                                try {
                                    await updateHallwayMutation({
                                        variables: {
                                            id: hallway.id,
                                            name: hallway.name,
                                            colour: hallway.colour,
                                            priority: hallway.priority,
                                        },
                                    });
                                    ok = true;
                                } catch (e) {
                                    console.error("Error updating hallway", e);
                                    ok = false;
                                }
                                return [hallway.id, ok];
                            }
                        )
                    );
                    for (const [key, val] of updateHallwayResultsArr) {
                        hallwayResults.set(key, val);
                    }

                    if (deletedGroupKeys.size > 0 || newGroups.size > 0) {
                        await insertDeleteContentGroupsMutation({
                            variables: {
                                deleteGroupIds: Array.from(deletedGroupKeys.values()),
                                newGroups: Array.from(newGroups.values()).map((group) => {
                                    const groupResult: ContentGroup_Insert_Input = {
                                        id: group.id,
                                        conferenceId: conference.id,
                                        contentGroupTags: {
                                            data: Array.from(group.tagIds.values()).map((tagId) => ({
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
                                                    isHidden: item.isHidden,
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
                                                    isHidden: item.isHidden,
                                                    contentTypeName: item.typeName,
                                                    uploadsRemaining: item.uploadsRemaining,
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
                                        hallways: {
                                            data: group.hallways.map((hallwayGroup) => {
                                                const hallwayGroupResult: ContentGroupHallway_Insert_Input = {
                                                    id: hallwayGroup.id,
                                                    conferenceId: conference.id,
                                                    priority: hallwayGroup.priority,
                                                    layout: hallwayGroup.layout,
                                                    hallwayId: hallwayGroup.hallwayId,
                                                };
                                                return hallwayGroupResult;
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
                    }
                } catch (e) {
                    console.error("Bulk save error", e);

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

                                const newGroupHallways = new Map<string, ContentGroupHallwayDescriptor>();
                                const updatedGroupHallways = new Map<string, ContentGroupHallwayDescriptor>();
                                const deleteGroupHallwayKeys = new Set<string>();

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

                                for (const tagId of group.tagIds) {
                                    if (!existingGroup.tagIds.has(tagId)) {
                                        newGroupTags.add(tagId);
                                    }
                                }
                                for (const tagId of existingGroup.tagIds) {
                                    if (!group.tagIds.has(tagId)) {
                                        deleteGroupTagKeys.add(tagId);
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

                                for (const groupHallway of group.hallways) {
                                    if (groupHallway.isNew) {
                                        newGroupHallways.set(groupHallway.id, groupHallway);
                                    } else {
                                        updatedGroupHallways.set(groupHallway.id, groupHallway);
                                    }
                                }
                                for (const existingGroupHallway of existingGroup.hallways) {
                                    if (!updatedGroupHallways.has(existingGroupHallway.id)) {
                                        deleteGroupHallwayKeys.add(existingGroupHallway.id);
                                    }
                                }

                                if (updatedItems.size > 0) {
                                    await Promise.all(
                                        Array.from(updatedItems.values()).map(async (item) => {
                                            await updateContentItemMutation({
                                                variables: {
                                                    contentTypeName: item.typeName,
                                                    data: item.data,
                                                    id: item.id,
                                                    layoutData: item.layoutData,
                                                    name: item.name,
                                                    isHidden: item.isHidden,
                                                    requiredContentId: item.requiredContentId,
                                                    originatingDataId: item.originatingDataId,
                                                },
                                            });
                                        })
                                    );
                                }

                                if (updatedRequiredItems.size > 0) {
                                    await Promise.all(
                                        Array.from(updatedRequiredItems.values()).map(async (item) => {
                                            await updateRequiredContentItemMutation({
                                                variables: {
                                                    contentTypeName: item.typeName,
                                                    id: item.id,
                                                    name: item.name,
                                                    isHidden: item.isHidden,
                                                    uploadsRemaining: item.uploadsRemaining,
                                                    originatingDataId: item.originatingDataId,
                                                },
                                            });
                                        })
                                    );
                                }

                                if (updatedUploaders.size > 0) {
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
                                }

                                if (updatedGroupPersons.size > 0) {
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
                                }

                                if (updatedGroupHallways.size > 0) {
                                    await Promise.all(
                                        Array.from(updatedGroupHallways.values()).map(async (groupHallway) => {
                                            await updateGroupHallwayMutation({
                                                variables: {
                                                    id: groupHallway.id,
                                                    priority: groupHallway.priority,
                                                    layout: groupHallway.layout,
                                                },
                                            });
                                        })
                                    );
                                }

                                await updateContentGroupMutation({
                                    variables: {
                                        contentGroupTypeName: group.typeName,
                                        deleteGroupTagIds: Array.from(deleteGroupTagKeys.values()),
                                        deleteItemIds: Array.from(deleteItemKeys.values()),
                                        deleteRequiredItemIds: Array.from(deleteRequiredItemKeys.values()),
                                        deleteUploaderIds: Array.from(deleteUploaderKeys.values()),
                                        deleteGroupPeopleIds: Array.from(deleteGroupPersonKeys.values()),
                                        deleteGroupHallwayIds: Array.from(deleteGroupHallwayKeys.values()),
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
                                            isHidden: item.isHidden,
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
                                            isHidden: item.isHidden,
                                            uploadsRemaining: item.uploadsRemaining,
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
                                            personId: groupPerson.personId,
                                            priority: groupPerson.priority,
                                            roleName: groupPerson.roleName,
                                            groupId: group.id,
                                        })),
                                        newGroupHallways: Array.from(newGroupHallways.values()).map((groupHallway) => ({
                                            conferenceId: conference.id,
                                            id: groupHallway.id,
                                            hallwayId: groupHallway.hallwayId,
                                            priority: groupHallway.priority,
                                            layout: groupHallway.layout,
                                            groupId: group.id,
                                        })),
                                        originatingDataId: group.originatingDataId,
                                        shortTitle: group.shortTitle,
                                        title: group.title,
                                    },
                                });

                                ok = true;
                            } catch (e) {
                                console.error("Error updating content group", e, group);
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
                    if (deletedTagKeys.size > 0) {
                        await deleteTagsMutation({
                            variables: {
                                deleteTagIds: Array.from(deletedTagKeys.values()),
                            },
                        });
                        for (const key of deletedTagKeys.keys()) {
                            tagResults.set(key, true);
                        }
                    }
                } catch (e) {
                    console.error("Error deleting tags", e, deletedTagKeys);
                    for (const key of deletedTagKeys.keys()) {
                        tagResults.set(key, false);
                    }
                }

                try {
                    if (deletedHallwayKeys.size > 0) {
                        await deleteHallwaysMutation({
                            variables: {
                                deleteHallwayIds: Array.from(deletedHallwayKeys.values()),
                            },
                        });
                        for (const key of deletedHallwayKeys.keys()) {
                            hallwayResults.set(key, true);
                        }
                    }
                } catch (e) {
                    console.error("Error deleting hallways", e, deletedHallwayKeys);
                    for (const key of deletedHallwayKeys.keys()) {
                        hallwayResults.set(key, false);
                    }
                }

                try {
                    if (deletedPersonKeys.size > 0) {
                        await deleteContentPeopleMutation({
                            variables: {
                                deletePersonIds: Array.from(deletedPersonKeys.values()),
                            },
                        });
                        for (const key of deletedPersonKeys.keys()) {
                            peopleResults.set(key, true);
                        }
                    }
                } catch (e) {
                    console.error("Error deleting persons", e, deletedPersonKeys);
                    for (const key of deletedPersonKeys.keys()) {
                        peopleResults.set(key, false);
                    }
                }

                try {
                    if (deletedOriginatingDataKeys.size > 0) {
                        await deleteOriginatingDatasMutation({
                            variables: {
                                deleteDataIds: Array.from(deletedOriginatingDataKeys.values()),
                            },
                        });
                        for (const key of deletedOriginatingDataKeys.keys()) {
                            originatingDataResults.set(key, true);
                        }
                    }
                } catch (e) {
                    console.error("Error deleting originating datas", e, deletedOriginatingDataKeys);
                    for (const key of deletedOriginatingDataKeys.keys()) {
                        originatingDataResults.set(key, false);
                    }
                }

                return {
                    groups: groupResults,
                    originatingDatas: originatingDataResults,
                    people: peopleResults,
                    tags: tagResults,
                    hallways: hallwayResults,
                };
            },
        };
    }
}
