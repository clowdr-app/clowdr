import { ContentRole, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import type { Content_ElementType_Enum, Content_ItemType_Enum } from "../../../../generated/graphql";

export const ContentRoleNames: ReadonlyArray<ContentRole> = [
    ContentRole.Author,
    ContentRole.Chair,
    ContentRole.Presenter,
];

export type ExhibitionDescriptor = {
    isNew?: boolean;

    id: string;
    name: string;
    colour: string;
    priority: number;
};

export type ElementDescriptor = {
    isNew?: boolean;

    id: string;
    typeName: Content_ElementType_Enum;
    isHidden: boolean;
    layoutData: LayoutDataBlob | null;
    uploadableId?: string | null;
    name: string;
    data: ElementDataBlob;
    originatingDataId?: string;
};

export type UploadableElementDescriptor = {
    isNew?: boolean;

    id: string;
    typeName: Content_ElementType_Enum;
    name: string;
    isHidden: boolean;
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
    uploadableId: string;
};

export type ContentDescriptor =
    | {
          type: "required-only";
          uploadableElement: UploadableElementDescriptor;
      }
    | {
          type: "required-and-element";
          uploadableElement: UploadableElementDescriptor;
          element: ElementDescriptor;
      }
    | {
          type: "element-only";
          element: ElementDescriptor;
      };

export type ProgramPersonDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId: string;
    name: string;
    affiliation?: string | null;
    email?: string | null;
    originatingDataId?: string;
    registrantId?: string | null;
};

export type ItemExhibitionDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId?: string;
    itemId: string;
    exhibitionId: string;
    priority?: number | null;
    layout?: any | null;
};

export type ItemPersonDescriptor = {
    isNew?: boolean;

    id: string;
    conferenceId: string;
    itemId: string;
    priority?: number | null;
    roleName: string;
    personId: string;
};

export type ItemDescriptor = {
    isNew?: boolean;

    id: string;
    title: string;
    shortTitle?: string | null;
    typeName: Content_ItemType_Enum;
    tagIds: Set<string>;
    elements: ElementDescriptor[];
    uploadableElements: UploadableElementDescriptor[];
    people: ItemPersonDescriptor[];
    exhibitions: ItemExhibitionDescriptor[];
    originatingDataId?: string;
    rooms: {
        id: string;
    }[];
};

export type RenderEditorProps = {
    data: ContentDescriptor;
    update: (updated: ContentDescriptor) => void;
};

export type ElementBaseTemplate =
    | {
          supported: false;
      }
    | SupportedElementBaseTemplate;

export type SupportedElementBaseTemplate = {
    supported: true;
    createDefault: (itemType: Content_ElementType_Enum, required: boolean) => ContentDescriptor;
    renderEditorHeading: (data: ContentDescriptor) => JSX.Element;
    renderEditor: (props: RenderEditorProps) => JSX.Element;
};
