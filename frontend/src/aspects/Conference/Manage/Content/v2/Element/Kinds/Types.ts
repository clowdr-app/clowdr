import type { ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import type {
    Content_ElementType_Enum,
    ManageContent_ElementFragment,
    ManageContent_UploadableElementFragment,
} from "../../../../../../../generated/graphql";

export type ElementDescriptor = Omit<ManageContent_ElementFragment, "data" | "layoutData"> & {
    data: ElementDataBlob;
    layoutData: LayoutDataBlob | null | undefined;
};

export type ContentDescriptor =
    | {
          type: "required-only";
          uploadableElement: ManageContent_UploadableElementFragment;
      }
    | {
          type: "required-and-element";
          uploadableElement: ManageContent_UploadableElementFragment;
          element: ElementDescriptor;
      }
    | {
          type: "element-only";
          element: ElementDescriptor;
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
    allowCreate: Content_ElementType_Enum[];
    createDefault: (
        itemType: Content_ElementType_Enum,
        required: boolean,
        conferenceId: string,
        itemId: string
    ) => ContentDescriptor;
    renderEditorHeading: (data: ContentDescriptor) => JSX.Element;
    renderEditor: (props: RenderEditorProps) => JSX.Element;
};
