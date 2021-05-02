import { ElementBaseType, ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import { Content_ElementType_Enum, Content_ItemType_Enum } from "../../../../generated/graphql";
import { ComponentElementTemplate } from "./ComponentElement";
import { FileElementTemplate } from "./FileElement";
import { LinkElementTemplate } from "./LinkElement";
import { TextElementTemplate } from "./TextElement";
import type { ElementBaseTemplate, ItemDescriptor } from "./Types";
import { URLElementTemplate } from "./URLElement";
import { VideoElementTemplate } from "./VideoElement";

export const ElementBaseTemplates: { [K in ElementBaseType]: ElementBaseTemplate } = {
    [ElementBaseType.File]: FileElementTemplate,
    [ElementBaseType.Component]: ComponentElementTemplate,
    [ElementBaseType.Link]: LinkElementTemplate,
    [ElementBaseType.Text]: TextElementTemplate,
    [ElementBaseType.URL]: URLElementTemplate,
    [ElementBaseType.Video]: VideoElementTemplate,
};

export type ItemTemplate =
    | {
          supported: false;
      }
    | {
          supported: true;
          uploadableElementTypes: Content_ElementType_Enum[];
          itemTypes: Content_ElementType_Enum[];
      };

export const ItemTemplates: { [K in Content_ItemType_Enum]: ItemTemplate } = {
    [Content_ItemType_Enum.Keynote]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract],
    },
    [Content_ItemType_Enum.Other]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [],
    },
    [Content_ItemType_Enum.Paper]: {
        supported: true,
        uploadableElementTypes: [Content_ElementType_Enum.VideoPrepublish, Content_ElementType_Enum.VideoBroadcast],
        itemTypes: [Content_ElementType_Enum.Abstract],
    },
    [Content_ItemType_Enum.Poster]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.PosterFile],
    },
    [Content_ItemType_Enum.Sponsor]: {
        supported: true,
        uploadableElementTypes: [Content_ElementType_Enum.ImageFile],
        itemTypes: [],
    },
    [Content_ItemType_Enum.Symposium]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Zoom],
    },
    [Content_ItemType_Enum.Workshop]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Zoom],
    },
    [Content_ItemType_Enum.Tutorial]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Zoom],
    },
    [Content_ItemType_Enum.LandingPage]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.ContentGroupList],
    },
    [Content_ItemType_Enum.Presentation]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.VideoBroadcast],
    },
    [Content_ItemType_Enum.SessionQAndA]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Text],
    },
    [Content_ItemType_Enum.Social]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Text],
    },
    [Content_ItemType_Enum.Demonstration]: {
        supported: true,
        uploadableElementTypes: [],
        itemTypes: [Content_ElementType_Enum.Abstract],
    },
};

export function fitItemToTemplate(group: ItemDescriptor): void {
    assert(group.typeName);
    const groupTemplate = ItemTemplates[group.typeName];
    assert(groupTemplate.supported);

    group.elements = [
        ...group.elements,
        ...groupTemplate.itemTypes
            .filter((itemType) => {
                const baseType = ElementBaseTypes[itemType];
                const itemTemplate = ElementBaseTemplates[baseType];
                return itemTemplate.supported && !group.elements.some((x) => x.typeName === itemType);
            })
            .map((itemType) => {
                const baseType = ElementBaseTypes[itemType];
                const itemTemplate = ElementBaseTemplates[baseType];
                assert(itemTemplate.supported);
                const newElementDesc = itemTemplate.createDefault(itemType, false);
                assert(newElementDesc.type === "element-only");
                return newElementDesc.element;
            }),
    ];
    group.uploadableElements = [
        ...group.uploadableElements,
        ...groupTemplate.uploadableElementTypes
            .filter((itemType) => {
                const baseType = ElementBaseTypes[itemType];
                const itemTemplate = ElementBaseTemplates[baseType];
                return itemTemplate.supported && !group.uploadableElements.some((x) => x.typeName === itemType);
            })
            .map((itemType) => {
                const baseType = ElementBaseTypes[itemType];
                const itemTemplate = ElementBaseTemplates[baseType];
                assert(itemTemplate.supported);
                const newElementDesc = itemTemplate.createDefault(itemType, true);
                assert(newElementDesc.type === "required-only");
                return newElementDesc.uploadableElement;
            }),
    ];
}
