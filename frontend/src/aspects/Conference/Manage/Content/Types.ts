import type { ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import type { ContentGroupType_Enum, ContentType_Enum } from "../../../../generated/graphql";

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
