import type { ItemFullNestedInfoFragment, SelectAllContentQuery } from "../../../../generated/graphql";
import type { OriginatingDataDescriptor, OriginatingDataPart, TagDescriptor } from "../Shared/Types";
import type { ExhibitionDescriptor, ItemDescriptor, ProgramPersonDescriptor } from "./Types";

export function convertContentToDescriptors(allContent: SelectAllContentQuery): {
    items: Map<string, ItemDescriptor>;
    people: Map<string, ProgramPersonDescriptor>;
    tags: Map<string, TagDescriptor>;
    originatingDatas: Map<string, OriginatingDataDescriptor>;
    exhibitions: Map<string, ExhibitionDescriptor>;
} {
    return {
        items: new Map(
            allContent.content_Item.map((group): [string, ItemDescriptor] => [group.id, convertItemToDescriptor(group)])
        ),
        tags: new Map(
            allContent.collection_Tag.map((tag): [string, TagDescriptor] => [
                tag.id,
                {
                    id: tag.id,
                    colour: tag.colour,
                    name: tag.name,
                    originatingDataId: tag.originatingDataId,
                    priority: tag.priority,
                },
            ])
        ),
        people: new Map(
            allContent.collection_ProgramPerson.map((person): [string, ProgramPersonDescriptor] => [
                person.id,
                {
                    id: person.id,
                    conferenceId: person.conferenceId,
                    name: person.name ?? "<ERROR>",
                    affiliation: person.affiliation,
                    email: person.email,
                    originatingDataId: person.originatingDataId,
                    registrantId: person.registrantId,
                },
            ])
        ),
        originatingDatas: new Map(
            allContent.conference_OriginatingData.map((data): [string, OriginatingDataDescriptor] => [
                data.id,
                {
                    id: data.id,
                    sourceId: data.sourceId,
                    data: data.data as OriginatingDataPart[],
                },
            ])
        ),
        exhibitions: new Map(
            allContent.collection_Exhibition.map((data): [string, ExhibitionDescriptor] => [
                data.id,
                {
                    id: data.id,
                    colour: data.colour,
                    name: data.name,
                    priority: data.priority,
                    isHidden: data.isHidden,
                },
            ])
        ),
    };
}

export function convertItemToDescriptor(group: ItemFullNestedInfoFragment): ItemDescriptor {
    return {
        id: group.id,
        title: group.title,
        shortTitle: group.shortTitle,
        typeName: group.typeName,
        tagIds: new Set(group.itemTags.map((x) => x.tagId)),
        elements: group.elements.map((item) => ({
            id: item.id,
            isHidden: item.isHidden,
            name: item.name,
            typeName: item.typeName,
            data: Array.isArray(item.data) ? [...item.data] : { ...item.data },
            layoutData: item.layoutData,
            originatingDataId: item.originatingDataId,
            uploadsRemaining: item.uploadsRemaining,
        })),
        people: group.itemPeople.map((groupPerson) => ({
            itemId: groupPerson.itemId,
            id: groupPerson.id,
            personId: groupPerson.personId,
            priority: groupPerson.priority,
            roleName: groupPerson.roleName,
        })),
        exhibitions: group.itemExhibitions.map((groupExhibition) => ({
            itemId: groupExhibition.itemId,
            exhibitionId: groupExhibition.exhibitionId,
            id: groupExhibition.id,
            layout: groupExhibition.layout,
            priority: groupExhibition.priority,
        })),
        originatingDataId: group.originatingDataId,
        rooms: [...group.rooms],
    };
}

export function deepCloneItemDescriptor(group: ItemDescriptor): ItemDescriptor {
    return {
        id: group.id,
        elements: group.elements.map((item) => ({
            data: item.data.map((d: any) => ({
                createdAt: d.createdAt,
                createdBy: d.createdBy,
                data: { ...d.data },
            })),
            id: item.id,
            isHidden: item.isHidden,
            layoutData: item.layoutData,
            name: item.name,
            typeName: item.typeName,
            originatingDataId: item.originatingDataId,
            uploadsRemaining: item.uploadsRemaining,
        })),
        people: group.people.map((groupPerson) => ({
            itemId: groupPerson.itemId,
            id: groupPerson.id,
            personId: groupPerson.personId,
            priority: groupPerson.priority,
            roleName: groupPerson.roleName,
        })),
        exhibitions: group.exhibitions.map((groupExhibition) => ({
            ...groupExhibition,
            layout: groupExhibition.layout ? { ...groupExhibition.layout } : null,
        })),
        shortTitle: group.shortTitle,
        title: group.title,
        typeName: group.typeName,
        tagIds: new Set(group.tagIds),
        originatingDataId: group.originatingDataId,
        rooms: [...group.rooms],
    };
}
