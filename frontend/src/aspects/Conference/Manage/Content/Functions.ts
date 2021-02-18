import type { ContentGroupFullNestedInfoFragment, SelectAllContentQuery } from "../../../../generated/graphql";
import type { OriginatingDataDescriptor, OriginatingDataPart, TagDescriptor } from "../Shared/Types";
import type { ContentGroupDescriptor, ContentPersonDescriptor, HallwayDescriptor } from "./Types";

export function convertContentToDescriptors(
    allContent: SelectAllContentQuery
): {
    contentGroups: Map<string, ContentGroupDescriptor>;
    people: Map<string, ContentPersonDescriptor>;
    tags: Map<string, TagDescriptor>;
    originatingDatas: Map<string, OriginatingDataDescriptor>;
    hallways: Map<string, HallwayDescriptor>;
} {
    return {
        contentGroups: new Map(
            allContent.ContentGroup.map((group): [string, ContentGroupDescriptor] => [
                group.id,
                convertContentGroupToDescriptor(group),
            ])
        ),
        tags: new Map(
            allContent.Tag.map((tag): [string, TagDescriptor] => [
                tag.id,
                {
                    id: tag.id,
                    colour: tag.colour,
                    name: tag.name,
                    originatingDataId: tag.originatingDataId,
                },
            ])
        ),
        people: new Map(
            allContent.ContentPerson.map((person): [string, ContentPersonDescriptor] => [
                person.id,
                {
                    id: person.id,
                    conferenceId: person.conferenceId,
                    name: person.name,
                    affiliation: person.affiliation,
                    email: person.email,
                    originatingDataId: person.originatingDataId,
                },
            ])
        ),
        originatingDatas: new Map(
            allContent.OriginatingData.map((data): [string, OriginatingDataDescriptor] => [
                data.id,
                {
                    id: data.id,
                    sourceId: data.sourceId,
                    data: data.data as OriginatingDataPart[],
                },
            ])
        ),
        hallways: new Map(
            allContent.Hallway.map((data): [string, HallwayDescriptor] => [
                data.id,
                {
                    id: data.id,
                    colour: data.colour,
                    name: data.name,
                    priority: data.priority,
                },
            ])
        ),
    };
}

export function convertContentGroupToDescriptor(group: ContentGroupFullNestedInfoFragment): ContentGroupDescriptor {
    return {
        id: group.id,
        title: group.title,
        shortTitle: group.shortTitle,
        typeName: group.contentGroupTypeName,
        tagIds: new Set(group.contentGroupTags.map((x) => x.tagId)),
        items: group.contentItems.map((item) => ({
            id: item.id,
            isHidden: item.isHidden,
            name: item.name,
            typeName: item.contentTypeName,
            data: Array.isArray(item.data) ? [...item.data] : { ...item.data },
            layoutData: item.layoutData,
            requiredContentId: item.requiredContentId,
            originatingDataId: item.originatingDataId,
        })),
        requiredItems: group.requiredContentItems.map((item) => ({
            id: item.id,
            name: item.name,
            typeName: item.contentTypeName,
            uploadsRemaining: item.uploadsRemaining,
            isHidden: item.isHidden,
            uploaders: item.uploaders.map((uploader) => ({
                id: uploader.id,
                email: uploader.email,
                emailsSentCount: uploader.emailsSentCount,
                name: uploader.name,
                requiredContentItemId: uploader.requiredContentItemId,
            })),
            originatingDataId: item.originatingDataId,
        })),
        people: group.people.map((groupPerson) => ({
            conferenceId: groupPerson.conferenceId,
            groupId: groupPerson.groupId,
            id: groupPerson.id,
            personId: groupPerson.personId,
            priority: groupPerson.priority,
            roleName: groupPerson.roleName,
        })),
        hallways: group.hallways.map((groupHallway) => ({
            conferenceId: groupHallway.conferenceId,
            groupId: groupHallway.groupId,
            hallwayId: groupHallway.hallwayId,
            id: groupHallway.id,
            layout: groupHallway.layout,
            priority: groupHallway.priority,
        })),
        originatingDataId: group.originatingDataId,
        rooms: [...group.rooms],
    };
}

export function deepCloneContentGroupDescriptor(group: ContentGroupDescriptor): ContentGroupDescriptor {
    return {
        id: group.id,
        items: group.items.map((item) => ({
            data: item.data.map((d) => ({
                createdAt: d.createdAt,
                createdBy: d.createdBy,
                data: { ...d.data },
            })),
            id: item.id,
            isHidden: item.isHidden,
            layoutData: item.layoutData,
            name: item.name,
            typeName: item.typeName,
            requiredContentId: item.requiredContentId,
            originatingDataId: item.originatingDataId,
        })),
        requiredItems: group.requiredItems.map((item) => ({
            id: item.id,
            name: item.name,
            typeName: item.typeName,
            isHidden: item.isHidden,
            originatingDataId: item.originatingDataId,
            uploadsRemaining: item.uploadsRemaining,
            uploaders: item.uploaders.map((uploader) => ({
                id: uploader.id,
                email: uploader.email,
                emailsSentCount: uploader.emailsSentCount,
                name: uploader.name,
                requiredContentItemId: uploader.requiredContentItemId,
            })),
        })),
        people: group.people.map((groupPerson) => ({
            conferenceId: groupPerson.conferenceId,
            groupId: groupPerson.groupId,
            id: groupPerson.id,
            personId: groupPerson.personId,
            priority: groupPerson.priority,
            roleName: groupPerson.roleName,
        })),
        hallways: group.hallways.map((groupHallway) => ({
            ...groupHallway,
            layout: groupHallway.layout ? { ...groupHallway.layout } : null,
        })),
        shortTitle: group.shortTitle,
        title: group.title,
        typeName: group.typeName,
        tagIds: new Set(group.tagIds),
        originatingDataId: group.originatingDataId,
        rooms: [...group.rooms],
    };
}
