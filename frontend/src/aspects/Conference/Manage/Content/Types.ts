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

export type ContentGroupDescriptor = {
    isNew?: boolean;

    id: string;
    title: string;
    shortTitle?: string | null;
    typeName: ContentGroupType_Enum;
    tags: TagDescriptor[];
    items: ContentItemDescriptor[];
    requiredItems: RequiredContentItemDescriptor[];
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
          renderEditor: (
              data: ContentDescriptor,
              update: (updated: ContentDescriptor) => void
          ) => JSX.Element;
      };
