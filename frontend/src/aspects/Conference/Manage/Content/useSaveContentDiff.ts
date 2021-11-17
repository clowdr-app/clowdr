import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { CombinedError } from "@urql/core";
import { gql } from "@urql/core";
import { useEffect, useMemo, useState } from "react";
import type {
    Collection_Exhibition_Insert_Input,
    Collection_ProgramPerson_Insert_Input,
    Collection_Tag_Insert_Input,
    Conference_OriginatingData_Insert_Input,
    Content_Element_Insert_Input,
    Content_ItemExhibition_Insert_Input,
    Content_ItemProgramPerson_Insert_Input,
    Content_Item_Insert_Input,
} from "../../../../generated/graphql";
import {
    useDeleteExhibitionsMutation,
    useDeleteOriginatingDatasMutation,
    useDeleteProgramPeopleMutation,
    useDeleteTagsMutation,
    useInsertDeleteItemsMutation,
    useInsertElementsMutation,
    useInsertExhibitionsMutation,
    useInsertOriginatingDatasMutation,
    useInsertProgramPeopleMutation,
    useInsertTagsMutation,
    useSelectAllContentQuery,
    useUpdateElementMutation,
    useUpdateExhibitionMutation,
    useUpdateGroupExhibitionMutation,
    useUpdateGroupPersonMutation,
    useUpdateItemMutation,
    useUpdatePersonMutation,
    useUpdateTagMutation,
} from "../../../../generated/graphql";
import { makeContext } from "../../../GQL/make-context";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useConference } from "../../useConference";
import type { OriginatingDataDescriptor, TagDescriptor } from "../Shared/Types";
import { convertContentToDescriptors } from "./Functions";
import type {
    ElementDescriptor,
    ExhibitionDescriptor,
    ItemDescriptor,
    ItemExhibitionDescriptor,
    ItemPersonDescriptor,
    ProgramPersonDescriptor,
} from "./Types";

gql`
    fragment ElementInfo on content_Element {
        conferenceId
        itemId
        typeName
        data
        id
        isHidden
        layoutData
        name
        originatingDataId
        uploadsRemaining
    }

    fragment OriginatingDataInfo on conference_OriginatingData {
        id
        conferenceId
        sourceId
        data
    }

    fragment ProgramPersonInfo on collection_ProgramPerson {
        id
        conferenceId
        name
        affiliation
        email
        originatingDataId
        registrantId
    }

    fragment ItemTagInfo on content_ItemTag {
        id
        tagId
        itemId
    }

    fragment ItemExhibitionInfo on content_ItemExhibition {
        id
        itemId
        exhibitionId
        priority
        layout
    }

    fragment ItemPersonInfo on content_ItemProgramPerson {
        id
        itemId
        personId
        priority
        roleName
    }

    fragment ItemFullNestedInfo on content_Item {
        id
        conferenceId
        typeName
        title
        shortTitle
        elements {
            ...ElementInfo
        }
        itemTags {
            ...ItemTagInfo
        }
        itemExhibitions {
            ...ItemExhibitionInfo
        }
        itemPeople {
            ...ItemPersonInfo
        }
        originatingDataId
        rooms(where: { originatingEventId: { _is_null: true } }, limit: 1, order_by: { created_at: asc }) {
            id
            originatingEventId
            created_at
        }
    }

    fragment TagInfo on collection_Tag {
        id
        conferenceId
        colour
        name
        originatingDataId
        priority
    }

    fragment ExhibitionInfo on collection_Exhibition {
        id
        conferenceId
        colour
        name
        priority
        isHidden
    }

    query SelectAllContent($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId }, typeName: { _neq: SPONSOR } }) {
            ...ItemFullNestedInfo
        }
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ProgramPersonInfo
        }
        conference_OriginatingData(where: { conferenceId: { _eq: $conferenceId } }) {
            ...OriginatingDataInfo
        }
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...TagInfo
        }
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ExhibitionInfo
        }
    }

    mutation InsertDeleteItems($newGroups: [content_Item_insert_input!]!, $deleteGroupIds: [uuid!]!) {
        insert_content_Item(objects: $newGroups) {
            returning {
                ...ItemFullNestedInfo
            }
        }
        delete_content_Item(where: { id: { _in: $deleteGroupIds } }) {
            returning {
                id
            }
        }
    }

    mutation InsertElements($newElements: [content_Element_insert_input!]!) {
        insert_content_Element(objects: $newElements) {
            returning {
                ...ElementInfo
            }
        }
    }

    mutation InsertOriginatingDatas($newDatas: [conference_OriginatingData_insert_input!]!) {
        insert_conference_OriginatingData(objects: $newDatas) {
            returning {
                ...OriginatingDataInfo
            }
        }
    }

    mutation DeleteOriginatingDatas($deleteDataIds: [uuid!]!) {
        delete_conference_OriginatingData(where: { id: { _in: $deleteDataIds } }) {
            returning {
                id
            }
        }
    }

    mutation InsertTags($newTags: [collection_Tag_insert_input!]!) {
        insert_collection_Tag(objects: $newTags) {
            returning {
                ...TagInfo
            }
        }
    }

    mutation InsertExhibitions($newExhibitions: [collection_Exhibition_insert_input!]!) {
        insert_collection_Exhibition(objects: $newExhibitions) {
            returning {
                ...ExhibitionInfo
            }
        }
    }

    mutation DeleteTags($deleteTagIds: [uuid!]!) {
        delete_collection_Tag(where: { id: { _in: $deleteTagIds } }) {
            returning {
                id
            }
        }
    }

    mutation DeleteExhibitions($deleteExhibitionIds: [uuid!]!) {
        delete_collection_Exhibition(where: { id: { _in: $deleteExhibitionIds } }) {
            returning {
                id
            }
        }
    }

    mutation InsertProgramPeople($newPeople: [collection_ProgramPerson_insert_input!]!) {
        insert_collection_ProgramPerson(objects: $newPeople) {
            returning {
                ...ProgramPersonInfo
            }
        }
    }

    mutation DeleteProgramPeople($deletePersonIds: [uuid!]!) {
        delete_collection_ProgramPerson(where: { id: { _in: $deletePersonIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateItem(
        $newItems: [content_Element_insert_input!]!
        $newGroupTags: [content_ItemTag_insert_input!]!
        $newGroupExhibitions: [content_ItemExhibition_insert_input!]!
        $groupId: uuid!
        $typeName: content_ItemType_enum!
        $originatingDataId: uuid = null
        $shortTitle: String = null
        $title: String!
        $deleteItemIds: [uuid!]!
        $deleteGroupTagIds: [uuid!]!
        $deleteGroupExhibitionIds: [uuid!]!
        $newGroupPeople: [content_ItemProgramPerson_insert_input!]!
        $deleteGroupPeopleIds: [uuid!]!
    ) {
        insert_content_Element(objects: $newItems) {
            returning {
                ...ElementInfo
            }
        }
        insert_content_ItemTag(objects: $newGroupTags) {
            returning {
                ...ItemTagInfo
            }
        }
        insert_content_ItemExhibition(objects: $newGroupExhibitions) {
            returning {
                ...ItemExhibitionInfo
            }
        }
        insert_content_ItemProgramPerson(objects: $newGroupPeople) {
            returning {
                ...ItemPersonInfo
            }
        }
        update_content_Item_by_pk(
            pk_columns: { id: $groupId }
            _set: { typeName: $typeName, originatingDataId: $originatingDataId, shortTitle: $shortTitle, title: $title }
        ) {
            ...ItemFullNestedInfo
        }
        delete_content_Element(where: { id: { _in: $deleteItemIds } }) {
            returning {
                id
            }
        }
        delete_content_ItemTag(where: { itemId: { _eq: $groupId }, tagId: { _in: $deleteGroupTagIds } }) {
            returning {
                id
            }
        }
        delete_content_ItemExhibition(where: { id: { _in: $deleteGroupExhibitionIds } }) {
            returning {
                id
            }
        }
        delete_content_ItemProgramPerson(where: { id: { _in: $deleteGroupPeopleIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateElement(
        $id: uuid!
        $typeName: content_ElementType_enum!
        $layoutData: jsonb = null
        $name: String!
        $data: jsonb!
        $isHidden: Boolean!
        $originatingDataId: uuid = null
        $uploadsRemaining: Int = null
    ) {
        update_content_Element_by_pk(
            pk_columns: { id: $id }
            _set: {
                typeName: $typeName
                layoutData: $layoutData
                name: $name
                data: $data
                isHidden: $isHidden
                originatingDataId: $originatingDataId
                uploadsRemaining: $uploadsRemaining
            }
        ) {
            ...ElementInfo
        }
    }

    mutation UpdateGroupPerson($id: uuid!, $roleName: String!, $priority: Int = null) {
        update_content_ItemProgramPerson_by_pk(
            pk_columns: { id: $id }
            _set: { roleName: $roleName, priority: $priority }
        ) {
            ...ItemPersonInfo
        }
    }

    mutation UpdateGroupExhibition($id: uuid!, $priority: Int = null, $layout: jsonb = null) {
        update_content_ItemExhibition_by_pk(pk_columns: { id: $id }, _set: { layout: $layout, priority: $priority }) {
            ...ItemExhibitionInfo
        }
    }

    mutation UpdatePerson(
        $id: uuid!
        $name: String!
        $affiliation: String = null
        $email: String = null
        $originatingDataId: uuid = null
        $registrantId: uuid = null
    ) {
        update_collection_ProgramPerson(
            where: { id: { _eq: $id } }
            _set: {
                name: $name
                affiliation: $affiliation
                email: $email
                originatingDataId: $originatingDataId
                registrantId: $registrantId
            }
        ) {
            returning {
                ...ProgramPersonInfo
            }
        }
    }

    mutation UpdateTag(
        $id: uuid!
        $name: String!
        $colour: String!
        $originatingDataId: uuid = null
        $priority: Int! = 10
    ) {
        update_collection_Tag_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, colour: $colour, originatingDataId: $originatingDataId, priority: $priority }
        ) {
            ...TagInfo
        }
    }

    mutation UpdateExhibition($id: uuid!, $name: String!, $colour: String!, $priority: Int!, $isHidden: Boolean!) {
        update_collection_Exhibition_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, colour: $colour, priority: $priority, isHidden: $isHidden }
        ) {
            ...ExhibitionInfo
        }
    }
`;

export type AllContentStateT =
    | {
          items: Map<string, ItemDescriptor>;
          people: Map<string, ProgramPersonDescriptor>;
          tags: Map<string, TagDescriptor>;
          exhibitions: Map<string, ExhibitionDescriptor>;
          originatingDatas: Map<string, OriginatingDataDescriptor>;
      }
    | undefined;

export function useSaveContentDiff():
    | {
          loadingContent: true;
          errorContent: CombinedError | undefined;
          originalItems: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
          originalExhibitions: undefined;
      }
    | {
          loadingContent: false;
          errorContent: CombinedError;
          originalItems: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
          originalExhibitions: undefined;
      }
    | {
          loadingContent: false;
          errorContent: undefined;
          originalItems: undefined;
          originalPeople: undefined;
          originalTags: undefined;
          originalOriginatingDatas: undefined;
          originalExhibitions: undefined;
      }
    | {
          loadingContent: boolean;
          errorContent: undefined;
          originalItems: Map<string, ItemDescriptor>;
          originalPeople: Map<string, ProgramPersonDescriptor>;
          originalTags: Map<string, TagDescriptor>;
          originalOriginatingDatas: Map<string, OriginatingDataDescriptor>;
          originalExhibitions: Map<string, ExhibitionDescriptor>;
          saveContentDiff: (
              dirtyKeys: {
                  tagKeys: Set<string>;
                  peopleKeys: Set<string>;
                  originatingDataKeys: Set<string>;
                  groupKeys: Set<string>;
                  exhibitionKeys: Set<string>;
              },
              tags: Map<string, TagDescriptor>,
              people: Map<string, ProgramPersonDescriptor>,
              originatingDatas: Map<string, OriginatingDataDescriptor>,
              groups: Map<string, ItemDescriptor>,
              exhibitions: Map<string, ExhibitionDescriptor>
          ) => Promise<{
              groups: Map<string, boolean>;
              people: Map<string, boolean>;
              tags: Map<string, boolean>;
              originatingDatas: Map<string, boolean>;
              exhibitions: Map<string, boolean>;
          }>;
      } {
    const conference = useConference();

    const [, insertProgramPeopleMutation] = useInsertProgramPeopleMutation();
    const [, deleteProgramPeopleMutation] = useDeleteProgramPeopleMutation();
    const [, updatePersonMutation] = useUpdatePersonMutation();
    const [, insertExhibitionsMutation] = useInsertExhibitionsMutation();
    const [, deleteExhibitionsMutation] = useDeleteExhibitionsMutation();
    const [, updateExhibitionMutation] = useUpdateExhibitionMutation();
    const [, insertOriginatingDatasMutation] = useInsertOriginatingDatasMutation();
    const [, deleteOriginatingDatasMutation] = useDeleteOriginatingDatasMutation();
    const [, insertTagsMutation] = useInsertTagsMutation();
    const [, deleteTagsMutation] = useDeleteTagsMutation();
    const [, updateTagMutation] = useUpdateTagMutation();

    const [, insertDeleteItemsMutation] = useInsertDeleteItemsMutation();
    const [, insertElementsMutation] = useInsertElementsMutation();
    const [, updateItemMutation] = useUpdateItemMutation();
    const [, updateElementMutation] = useUpdateElementMutation();
    const [, updateGroupPersonMutation] = useUpdateGroupPersonMutation();
    const [, updateGroupExhibitionMutation] = useUpdateGroupExhibitionMutation();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
            }),
        []
    );
    const [{ fetching: loadingContent, error: errorContent, data: allContent }] = useSelectAllContentQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
        context,
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
            originalItems: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
            originalExhibitions: undefined,
        };
    } else if (errorContent) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalItems: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
            originalExhibitions: undefined,
        };
    } else if (!original) {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalItems: undefined,
            originalPeople: undefined,
            originalTags: undefined,
            originalOriginatingDatas: undefined,
            originalExhibitions: undefined,
        };
    } else {
        return {
            loadingContent: loadingContent,
            errorContent: errorContent,
            originalItems: original.items,
            originalOriginatingDatas: original.originatingDatas,
            originalPeople: original.people,
            originalTags: original.tags,
            originalExhibitions: original.exhibitions,
            saveContentDiff: async function saveContentDiff(
                { groupKeys, originatingDataKeys, peopleKeys, tagKeys, exhibitionKeys },
                tags,
                people,
                originatingDatas,
                groups,
                exhibitions
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

                const exhibitionResults: Map<string, boolean> = new Map();
                exhibitionKeys.forEach((key) => {
                    exhibitionResults.set(key, false);
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

                const newPeople = new Map<string, ProgramPersonDescriptor>();
                const updatedPeople = new Map<string, ProgramPersonDescriptor>();
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

                const newGroups = new Map<string, ItemDescriptor>();
                const updatedGroups = new Map<string, ItemDescriptor>();
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

                const newExhibitions = new Map<string, ExhibitionDescriptor>();
                const updatedExhibitions = new Map<string, ExhibitionDescriptor>();
                const deletedExhibitionKeys = new Set<string>();
                for (const key of exhibitionKeys.values()) {
                    const exhibition = exhibitions.get(key);
                    if (exhibition) {
                        if (exhibition.isNew) {
                            newExhibitions.set(key, exhibition);
                        } else {
                            updatedExhibitions.set(key, exhibition);
                        }
                    } else {
                        deletedExhibitionKeys.add(key);
                    }
                }

                try {
                    if (newTags.size > 0) {
                        await insertTagsMutation(
                            {
                                newTags: Array.from(newTags.values()).map(
                                    (tag): Collection_Tag_Insert_Input => ({
                                        id: tag.id,
                                        name: tag.name,
                                        colour: tag.colour,
                                        priority: tag.priority,
                                        conferenceId: conference.id,
                                        originatingDataId: tag.originatingDataId,
                                    })
                                ),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
                        for (const key of newTags.keys()) {
                            tagResults.set(key, true);
                        }
                    }

                    const updateTagResultsArr: [string, boolean][] = await Promise.all(
                        Array.from(updatedTags.values()).map(async (tag): Promise<[string, boolean]> => {
                            let ok = false;
                            try {
                                await updateTagMutation(
                                    {
                                        id: tag.id,
                                        colour: tag.colour,
                                        name: tag.name,
                                        originatingDataId: tag.originatingDataId,
                                        priority: tag.priority,
                                    },
                                    {
                                        fetchOptions: {
                                            headers: {
                                                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                            },
                                        },
                                    }
                                );
                                ok = true;
                            } catch (e) {
                                console.error("Error updating tag", e);
                                ok = false;
                            }
                            return [tag.id, ok];
                        })
                    );
                    for (const [key, val] of updateTagResultsArr) {
                        tagResults.set(key, val);
                    }

                    if (newOriginatingDatas.size > 0) {
                        await insertOriginatingDatasMutation(
                            {
                                newDatas: Array.from(newOriginatingDatas.values()).map(
                                    (originatingData): Conference_OriginatingData_Insert_Input => ({
                                        id: originatingData.id,
                                        conferenceId: conference.id,
                                        data: originatingData.data,
                                        sourceId: originatingData.sourceId,
                                    })
                                ),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
                        for (const key of newOriginatingDatas.keys()) {
                            originatingDataResults.set(key, true);
                        }
                    }

                    if (newPeople.size > 0) {
                        await insertProgramPeopleMutation(
                            {
                                newPeople: Array.from(newPeople.values()).map(
                                    (person): Collection_ProgramPerson_Insert_Input => ({
                                        id: person.id,
                                        conferenceId: conference.id,
                                        affiliation: person.affiliation,
                                        email: person.email,
                                        name: person.name,
                                        originatingDataId: person.originatingDataId,
                                        registrantId: person.registrantId,
                                    })
                                ),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
                        for (const key of newPeople.keys()) {
                            peopleResults.set(key, true);
                        }
                    }

                    const updateProgramPersonResultsArr: [string, boolean][] = await Promise.all(
                        Array.from(updatedPeople.values()).map(async (person): Promise<[string, boolean]> => {
                            let ok = false;
                            try {
                                await updatePersonMutation(
                                    {
                                        id: person.id,
                                        affiliation: person.affiliation,
                                        email: person.email,
                                        name: person.name,
                                        originatingDataId: person.originatingDataId,
                                        registrantId: person.registrantId,
                                    },
                                    {
                                        fetchOptions: {
                                            headers: {
                                                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                            },
                                        },
                                    }
                                );
                                ok = true;
                            } catch (e) {
                                console.error("Error updating content person", e);
                                ok = false;
                            }
                            return [person.id, ok];
                        })
                    );
                    for (const [key, val] of updateProgramPersonResultsArr) {
                        peopleResults.set(key, val);
                    }

                    if (newExhibitions.size > 0) {
                        await insertExhibitionsMutation(
                            {
                                newExhibitions: Array.from(newExhibitions.values()).map(
                                    (exhibition): Collection_Exhibition_Insert_Input => ({
                                        id: exhibition.id,
                                        conferenceId: conference.id,
                                        name: exhibition.name,
                                        colour: exhibition.colour,
                                        priority: exhibition.priority,
                                        isHidden: exhibition.isHidden,
                                    })
                                ),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
                        for (const key of newExhibitions.keys()) {
                            exhibitionResults.set(key, true);
                        }
                    }

                    const updateExhibitionResultsArr: [string, boolean][] = await Promise.all(
                        Array.from(updatedExhibitions.values()).map(async (exhibition): Promise<[string, boolean]> => {
                            let ok = false;
                            try {
                                await updateExhibitionMutation(
                                    {
                                        id: exhibition.id,
                                        name: exhibition.name,
                                        colour: exhibition.colour,
                                        priority: exhibition.priority,
                                        isHidden: exhibition.isHidden,
                                    },
                                    {
                                        fetchOptions: {
                                            headers: {
                                                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                            },
                                        },
                                    }
                                );
                                ok = true;
                            } catch (e) {
                                console.error("Error updating exhibition", e);
                                ok = false;
                            }
                            return [exhibition.id, ok];
                        })
                    );
                    for (const [key, val] of updateExhibitionResultsArr) {
                        exhibitionResults.set(key, val);
                    }

                    if (deletedGroupKeys.size > 0 || newGroups.size > 0) {
                        const elementsToPostInsert: Content_Element_Insert_Input[] = [];

                        await insertDeleteItemsMutation(
                            {
                                deleteGroupIds: Array.from(deletedGroupKeys.values()),
                                newGroups: Array.from(newGroups.values()).map((group) => {
                                    const groupResult: Content_Item_Insert_Input = {
                                        id: group.id,
                                        conferenceId: conference.id,
                                        itemTags: {
                                            data: Array.from(group.tagIds.values()).map((tagId) => ({
                                                tagId,
                                            })),
                                        },
                                        typeName: group.typeName,
                                        elements: {
                                            data: group.elements.map((item) => {
                                                const itemResult: Content_Element_Insert_Input = {
                                                    id: item.id,
                                                    conferenceId: conference.id,
                                                    typeName: item.typeName,
                                                    data: item.data,
                                                    layoutData: item.layoutData,
                                                    name: item.name,
                                                    isHidden: item.isHidden,
                                                    originatingDataId: item.originatingDataId,
                                                    uploadsRemaining: item.uploadsRemaining,
                                                };
                                                return itemResult;
                                            }),
                                        },
                                        itemPeople: {
                                            data: group.people.map((personGroup) => {
                                                const personGroupResult: Content_ItemProgramPerson_Insert_Input = {
                                                    id: personGroup.id,
                                                    priority: personGroup.priority,
                                                    roleName: personGroup.roleName,
                                                    personId: personGroup.personId,
                                                };
                                                return personGroupResult;
                                            }),
                                        },
                                        itemExhibitions: {
                                            data: group.exhibitions.map((exhibitionGroup) => {
                                                const exhibitionGroupResult: Content_ItemExhibition_Insert_Input = {
                                                    id: exhibitionGroup.id,
                                                    priority: exhibitionGroup.priority,
                                                    layout: exhibitionGroup.layout,
                                                    exhibitionId: exhibitionGroup.exhibitionId,
                                                };
                                                return exhibitionGroupResult;
                                            }),
                                        },
                                        originatingDataId: group.originatingDataId,
                                        shortTitle: group.shortTitle,
                                        title: group.title,
                                    };
                                    return groupResult;
                                }),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );

                        if (elementsToPostInsert.length > 0) {
                            await insertElementsMutation(
                                {
                                    newElements: elementsToPostInsert.map((item) => ({
                                        id: item.id,
                                        conferenceId: conference.id,
                                        typeName: item.typeName,
                                        data: item.data,
                                        layoutData: item.layoutData,
                                        name: item.name,
                                        isHidden: item.isHidden,
                                        originatingDataId: item.originatingDataId,
                                        itemId: item.itemId,
                                        uploadsRemaining: item.uploadsRemaining,
                                    })),
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                        },
                                    },
                                }
                            );
                        }

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
                    Array.from(updatedGroups.values()).map(async (group): Promise<[string, boolean]> => {
                        let ok = false;
                        try {
                            const newItems = new Map<string, ElementDescriptor>();
                            const updatedItems = new Map<string, ElementDescriptor>();
                            const deleteItemKeys = new Set<string>();

                            const newGroupTags = new Set<string>();
                            const deleteGroupTagKeys = new Set<string>();

                            const newGroupPersons = new Map<string, ItemPersonDescriptor>();
                            const updatedGroupPersons = new Map<string, ItemPersonDescriptor>();
                            const deleteGroupPersonKeys = new Set<string>();

                            const newGroupExhibitions = new Map<string, ItemExhibitionDescriptor>();
                            const updatedGroupExhibitions = new Map<string, ItemExhibitionDescriptor>();
                            const deleteGroupExhibitionKeys = new Set<string>();

                            const existingGroup = original.items.get(group.id);
                            assert.truthy(existingGroup);

                            for (const item of group.elements) {
                                if (item.isNew) {
                                    newItems.set(item.id, item);
                                } else {
                                    updatedItems.set(item.id, item);
                                }
                            }
                            for (const existingItem of existingGroup.elements) {
                                if (!updatedItems.has(existingItem.id)) {
                                    deleteItemKeys.add(existingItem.id);
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

                            for (const groupExhibition of group.exhibitions) {
                                if (groupExhibition.isNew) {
                                    newGroupExhibitions.set(groupExhibition.id, groupExhibition);
                                } else {
                                    updatedGroupExhibitions.set(groupExhibition.id, groupExhibition);
                                }
                            }
                            for (const existingGroupExhibition of existingGroup.exhibitions) {
                                if (!updatedGroupExhibitions.has(existingGroupExhibition.id)) {
                                    deleteGroupExhibitionKeys.add(existingGroupExhibition.id);
                                }
                            }

                            if (updatedItems.size > 0) {
                                await Promise.all(
                                    Array.from(updatedItems.values()).map(async (item) => {
                                        await updateElementMutation(
                                            {
                                                typeName: item.typeName,
                                                data: item.data,
                                                id: item.id,
                                                layoutData: item.layoutData,
                                                name: item.name,
                                                isHidden: item.isHidden,
                                                originatingDataId: item.originatingDataId,
                                                uploadsRemaining: item.uploadsRemaining,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    })
                                );
                            }

                            if (updatedGroupPersons.size > 0) {
                                await Promise.all(
                                    Array.from(updatedGroupPersons.values()).map(async (groupPerson) => {
                                        await updateGroupPersonMutation(
                                            {
                                                id: groupPerson.id,
                                                priority: groupPerson.priority,
                                                roleName: groupPerson.roleName,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    })
                                );
                            }

                            if (updatedGroupExhibitions.size > 0) {
                                await Promise.all(
                                    Array.from(updatedGroupExhibitions.values()).map(async (groupExhibition) => {
                                        await updateGroupExhibitionMutation(
                                            {
                                                id: groupExhibition.id,
                                                priority: groupExhibition.priority,
                                                layout: groupExhibition.layout,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    })
                                );
                            }

                            await updateItemMutation(
                                {
                                    typeName: group.typeName,
                                    deleteGroupTagIds: Array.from(deleteGroupTagKeys.values()),
                                    deleteItemIds: Array.from(deleteItemKeys.values()),
                                    deleteGroupPeopleIds: Array.from(deleteGroupPersonKeys.values()),
                                    deleteGroupExhibitionIds: Array.from(deleteGroupExhibitionKeys.values()),
                                    groupId: group.id,
                                    newGroupTags: Array.from(newGroupTags.values()).map((tagId) => ({
                                        itemId: group.id,
                                        tagId,
                                    })),
                                    newItems: Array.from(newItems.values()).map((item) => ({
                                        conferenceId: conference.id,
                                        itemId: group.id,
                                        typeName: item.typeName,
                                        data: item.data,
                                        id: item.id,
                                        layoutData: item.layoutData,
                                        isHidden: item.isHidden,
                                        name: item.name,
                                        originatingDataId: item.originatingDataId,
                                        uploadsRemaining: item.uploadsRemaining,
                                    })),
                                    newGroupPeople: Array.from(newGroupPersons.values()).map((groupPerson) => ({
                                        conferenceId: conference.id,
                                        id: groupPerson.id,
                                        personId: groupPerson.personId,
                                        priority: groupPerson.priority,
                                        roleName: groupPerson.roleName,
                                        itemId: group.id,
                                    })),
                                    newGroupExhibitions: Array.from(newGroupExhibitions.values()).map(
                                        (groupExhibition) => ({
                                            conferenceId: conference.id,
                                            id: groupExhibition.id,
                                            exhibitionId: groupExhibition.exhibitionId,
                                            priority: groupExhibition.priority,
                                            layout: groupExhibition.layout,
                                            itemId: group.id,
                                        })
                                    ),
                                    originatingDataId: group.originatingDataId,
                                    shortTitle: group.shortTitle,
                                    title: group.title,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                        },
                                    },
                                }
                            );

                            ok = true;
                        } catch (e) {
                            console.error("Error updating content group", e, group);
                            ok = false;
                        }
                        return [group.id, ok];
                    })
                );
                for (const [key, val] of updateGroupResultsArr) {
                    groupResults.set(key, val);
                }

                try {
                    if (deletedTagKeys.size > 0) {
                        await deleteTagsMutation(
                            {
                                deleteTagIds: Array.from(deletedTagKeys.values()),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
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
                    if (deletedExhibitionKeys.size > 0) {
                        await deleteExhibitionsMutation(
                            {
                                deleteExhibitionIds: Array.from(deletedExhibitionKeys.values()),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
                        for (const key of deletedExhibitionKeys.keys()) {
                            exhibitionResults.set(key, true);
                        }
                    }
                } catch (e) {
                    console.error("Error deleting exhibitions", e, deletedExhibitionKeys);
                    for (const key of deletedExhibitionKeys.keys()) {
                        exhibitionResults.set(key, false);
                    }
                }

                try {
                    if (deletedPersonKeys.size > 0) {
                        await deleteProgramPeopleMutation(
                            {
                                deletePersonIds: Array.from(deletedPersonKeys.values()),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
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
                        await deleteOriginatingDatasMutation(
                            {
                                deleteDataIds: Array.from(deletedOriginatingDataKeys.values()),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                    },
                                },
                            }
                        );
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
                    exhibitions: exhibitionResults,
                };
            },
        };
    }
}
