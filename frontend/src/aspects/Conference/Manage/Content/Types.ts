import type { ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import type {
    ContentGroupType_Enum,
    ContentType_Enum,
    SelectAllContentGroupsQuery,
} from "../../../../generated/graphql";

export type TagDescriptor = {
    id: string;
    name: string;
    desciptor: string;
};

export type ContentItemDescriptor = {
    isNew?: boolean;

    id: string;
    typeName: ContentType_Enum;
    isHidden: boolean;
    layoutData: any;
    requiredContentId?: string | null;
    name: string;
    data: ContentItemDataBlob;
};

export type RequiredContentItemDescriptor = {
    isNew?: boolean;

    id: string;
    typeName: ContentType_Enum;
    name: string;
    uploaders: UploaderDescriptor[];
};

export type UploaderDescriptor = {
    isNew?: boolean;

    id: string;
    email: string;
    emailsSentCount: number;
    name: string;
    requiredContentItemId: string;
};

export type ContentDescriptor =
    | {
          type: "required-only";
          requiredItem: RequiredContentItemDescriptor;
      }
    | {
          type: "required-and-item";
          requiredItem: RequiredContentItemDescriptor;
          item: ContentItemDescriptor;
      }
    | {
          type: "item-only";
          item: ContentItemDescriptor;
      };

export type ContentPersonDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId: string;
    name: string;
    affiliation?: string | null;
    email?: string | null;
};

export type ContentGroupPersonDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId: string;
    groupId: string;
    priority?: number | null;
    roleName: string;

    person: ContentPersonDescriptor;
};

export type ContentGroupDescriptor = {
    isNew?: boolean;

    id: string;
    title: string;
    shortTitle?: string | null;
    typeName: ContentGroupType_Enum;
    tags: TagDescriptor[];
    items: ContentItemDescriptor[];
    requiredItems: RequiredContentItemDescriptor[];
    people: ContentGroupPersonDescriptor[];
};
export type ItemBaseTemplate =
    | {
          supported: false;
      }
    | {
          supported: true;
          createDefault: (
              group: ContentGroupDescriptor,
              itemType: ContentType_Enum,
              required: boolean
          ) => ContentDescriptor;
          renderEditorHeading: (data: ContentDescriptor) => JSX.Element;
          renderEditor: (data: ContentDescriptor, update: (updated: ContentDescriptor) => void) => JSX.Element;
      };

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
