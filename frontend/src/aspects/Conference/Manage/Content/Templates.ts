import { ContentBaseType, ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import { ElementType_Enum, ItemType_Enum } from "../../../../generated/graphql";
import { ComponentItemTemplate } from "./ComponentItem";
import { FileItemTemplate } from "./FileItem";
import { LinkItemTemplate } from "./LinkItem";
import { TextItemTemplate } from "./TextItem";
import type { ItemBaseTemplate, ItemDescriptor } from "./Types";
import { URLItemTemplate } from "./URLItem";
import { VideoItemTemplate } from "./VideoItem";

export const ItemBaseTemplates: { [K in ContentBaseType]: ItemBaseTemplate } = {
    [ContentBaseType.File]: FileItemTemplate,
    [ContentBaseType.Component]: ComponentItemTemplate,
    [ContentBaseType.Link]: LinkItemTemplate,
    [ContentBaseType.Text]: TextItemTemplate,
    [ContentBaseType.URL]: URLItemTemplate,
    [ContentBaseType.Video]: VideoItemTemplate,
};

export type GroupTemplate =
    | {
          supported: false;
      }
    | {
          supported: true;
          uploadableItemTypes: ElementType_Enum[];
          itemTypes: ElementType_Enum[];
      };

export const GroupTemplates: { [K in ItemType_Enum]: GroupTemplate } = {
    [ItemType_Enum.Keynote]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract],
    },
    [ItemType_Enum.Other]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [],
    },
    [ItemType_Enum.Paper]: {
        supported: true,
        uploadableItemTypes: [ElementType_Enum.VideoPrepublish, ElementType_Enum.VideoBroadcast],
        itemTypes: [ElementType_Enum.Abstract],
    },
    [ItemType_Enum.Poster]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.PosterFile],
    },
    [ItemType_Enum.Sponsor]: {
        supported: true,
        uploadableItemTypes: [ElementType_Enum.ImageFile],
        itemTypes: [],
    },
    [ItemType_Enum.Symposium]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract, ElementType_Enum.Zoom],
    },
    [ItemType_Enum.Workshop]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract, ElementType_Enum.Zoom],
    },
    [ItemType_Enum.Tutorial]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract, ElementType_Enum.Zoom],
    },
    [ItemType_Enum.LandingPage]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract, ElementType_Enum.ItemList],
    },
    [ItemType_Enum.Presentation]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract, ElementType_Enum.VideoBroadcast],
    },
    [ItemType_Enum.SessionQAndA]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Text],
    },
    [ItemType_Enum.Social]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Text],
    },
    [ItemType_Enum.Demonstration]: {
        supported: true,
        uploadableItemTypes: [],
        itemTypes: [ElementType_Enum.Abstract],
    },
};

export function fitGroupToTemplate(group: ItemDescriptor): void {
    assert(group.typeName);
    const groupTemplate = GroupTemplates[group.typeName];
    assert(groupTemplate.supported);

    group.items = [
        ...group.items,
        ...groupTemplate.itemTypes
            .filter((itemType) => {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                return itemTemplate.supported && !group.items.some((x) => x.typeName === itemType);
            })
            .map((itemType) => {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                assert(itemTemplate.supported);
                const newItemDesc = itemTemplate.createDefault(itemType, false);
                assert(newItemDesc.type === "item-only");
                return newItemDesc.item;
            }),
    ];
    group.uploadableItems = [
        ...group.uploadableItems,
        ...groupTemplate.uploadableItemTypes
            .filter((itemType) => {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                return itemTemplate.supported && !group.uploadableItems.some((x) => x.typeName === itemType);
            })
            .map((itemType) => {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                assert(itemTemplate.supported);
                const newItemDesc = itemTemplate.createDefault(itemType, true);
                assert(newItemDesc.type === "required-only");
                return newItemDesc.uploadableItem;
            }),
    ];
}
