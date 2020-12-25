import type { ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import type { ContentGroupType_Enum, ContentType_Enum } from "../../../../generated/graphql";

export enum ContentRole {
    Author = "AUTHOR",
    Presenter = "PRESENTER",
    Chair = "CHAIR",
}

export const ContentRoleNames: ReadonlyArray<ContentRole> = [
    ContentRole.Author,
    ContentRole.Chair,
    ContentRole.Presenter,
];

export type TagDescriptor = {
    isNew?: boolean;

    id: string;
    name: string;
    colour: string;
    originatingDataId?: string;
};

export type HallwayDescriptor = {
    isNew?: boolean;

    id: string;
    name: string;
    colour: string;
    priority: number;
};

export type OriginatingDataPart = {
    originName: "Researchr" | "HotCRP" | string;
    data: any;
};

export type OriginatingDataDescriptor = {
    isNew?: boolean;

    id: string;
    sourceId: string;
    data: OriginatingDataPart[];
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
    originatingDataId?: string;
};

export type RequiredContentItemDescriptor = {
    isNew?: boolean;

    id: string;
    typeName: ContentType_Enum;
    name: string;
    uploaders: UploaderDescriptor[];
    originatingDataId?: string;
    uploadsRemaining?: number | null;
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
    originatingDataId?: string;
};

export type ContentGroupHallwayDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId: string;
    groupId: string;
    hallwayId: string;
    priority?: number | null;
    layout?: any | null;
};

export type ContentGroupPersonDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId: string;
    groupId: string;
    priority?: number | null;
    roleName: string;
    personId: string;
};

export type ContentGroupDescriptor = {
    isNew?: boolean;

    id: string;
    title: string;
    shortTitle?: string | null;
    typeName: ContentGroupType_Enum;
    tagIds: Set<string>;
    items: ContentItemDescriptor[];
    requiredItems: RequiredContentItemDescriptor[];
    people: ContentGroupPersonDescriptor[];
    hallways: ContentGroupHallwayDescriptor[];
    originatingDataId?: string;
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
