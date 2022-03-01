import type { ElementDataBlob } from "@midspace/shared-types/content";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import type { Content_ElementType_Enum, ManageContent_ElementFragment } from "../../../../../../../generated/graphql";

export type ElementDescriptor = Omit<ManageContent_ElementFragment, "data" | "layoutData"> & {
    data: ElementDataBlob;
    layoutData: LayoutDataBlob | null | undefined;
};

export type ContentDescriptor = ElementDescriptor;

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
    allowCreate: Content_ElementType_Enum[];
    createDefault: (itemType: Content_ElementType_Enum, conferenceId: string, itemId: string) => ContentDescriptor;
    renderEditorHeading: (data: ContentDescriptor) => JSX.Element;
    renderEditor: (props: RenderEditorProps) => JSX.Element;
};
