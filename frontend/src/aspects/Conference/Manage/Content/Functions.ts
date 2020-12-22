import type { SelectAllContentGroupsQuery } from "../../../../generated/graphql";
import type { ContentGroupDescriptor } from "./Types";

export function convertContentGroupsToDescriptors(
    allContentGroups: SelectAllContentGroupsQuery | undefined
): Map<string, ContentGroupDescriptor> | undefined {
    if (!allContentGroups) {
        return undefined;
    }

    return new Map(
        allContentGroups.ContentGroup.map((item): [string, ContentGroupDescriptor] => [
            item.id,
            {
                id: item.id,
                title: item.title,
                shortTitle: item.shortTitle,
                typeName: item.contentGroupTypeName,
                tags: item.contentGroupTags.map((x) => x.tagId),
                items: item.contentItems.map((item) => ({
                    id: item.id,
                    isHidden: item.isHidden,
                    name: item.name,
                    typeName: item.contentTypeName,
                    data: Array.isArray(item.data) ? [...item.data] : { ...item.data },
                    layoutData: item.layoutData,
                    requiredContentId: item.requiredContentId,
                })),
                requiredItems: item.requiredContentItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    typeName: item.contentTypeName,
                    uploaders: item.uploaders.map((uploader) => ({
                        id: uploader.id,
                        email: uploader.email,
                        emailsSentCount: uploader.emailsSentCount,
                        name: uploader.name,
                        requiredContentItemId: uploader.requiredContentItemId,
                    })),
                })),
                people: item.people.map((groupPerson) => ({
                    conferenceId: groupPerson.conferenceId,
                    groupId: groupPerson.groupId,
                    id: groupPerson.id,
                    person: {
                        id: groupPerson.person.id,
                        conferenceId: groupPerson.person.conferenceId,
                        name: groupPerson.person.name,
                        affiliation: groupPerson.person.affiliation,
                        email: groupPerson.person.email,
                    },
                    priority: groupPerson.priority,
                    roleName: groupPerson.roleName,
                })),
            },
        ])
    );
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
        })),
        requiredItems: group.requiredItems.map((item) => ({
            id: item.id,
            name: item.name,
            typeName: item.typeName,
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
            person: {
                id: groupPerson.person.id,
                conferenceId: groupPerson.person.conferenceId,
                name: groupPerson.person.name,
                affiliation: groupPerson.person.affiliation,
                email: groupPerson.person.email,
            },
            priority: groupPerson.priority,
            roleName: groupPerson.roleName,
        })),
        shortTitle: group.shortTitle,
        title: group.title,
        typeName: group.typeName,
        tags: group.tags,
    };
}
