import type { ElementDataBlob } from "@midspace/shared-types/content";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import type { Content_ElementType_Enum, Content_ItemType_Enum } from "../../../../generated/graphql";

export type ExhibitionDescriptor = {
    isNew?: boolean;

    id: string;
    name: string;
    colour: string;
    priority: number;
    isHidden: boolean;
};

export type ElementDescriptor = {
    isNew?: boolean;

    id: string;
    typeName: Content_ElementType_Enum;
    isHidden: boolean;
    layoutData: LayoutDataBlob | null;
    elementId?: string | null;
    name: string;
    data: ElementDataBlob;
    originatingDataId?: string;
    uploadsRemaining?: number | null;
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
    itemId: string;
    exhibitionId: string;
    priority?: number | null;
    layout?: any | null;
};

export type ItemPersonDescriptor = {
    isNew?: boolean;

    id: string;
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
    people: ItemPersonDescriptor[];
    exhibitions: ItemExhibitionDescriptor[];
    originatingDataId?: string;
    rooms: {
        id: string;
    }[];
};

export type RenderEditorProps = {
    data: ElementDescriptor;
    update: (updated: ElementDescriptor) => void;
};

export type ElementBaseTemplate =
    | {
          supported: false;
      }
    | SupportedElementBaseTemplate;

export type SupportedElementBaseTemplate = {
    supported: true;
    createDefault: (itemType: Content_ElementType_Enum, required: boolean) => ElementDescriptor;
    renderEditorHeading: (data: ElementDescriptor) => JSX.Element;
    renderEditor: (props: RenderEditorProps) => JSX.Element;
};
