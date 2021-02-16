import { ContentBaseType, ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import { ContentGroupType_Enum, ContentType_Enum } from "../../../../generated/graphql";
import { ComponentItemTemplate } from "./ComponentItem";
import { FileItemTemplate } from "./FileItem";
import { LinkItemTemplate } from "./LinkItem";
import { TextItemTemplate } from "./TextItem";
import type { ContentGroupDescriptor, ItemBaseTemplate } from "./Types";
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
          requiredItemTypes: ContentType_Enum[];
          itemTypes: ContentType_Enum[];
      };

export const GroupTemplates: { [K in ContentGroupType_Enum]: GroupTemplate } = {
    [ContentGroupType_Enum.Keynote]: {
        supported: true,
        requiredItemTypes: [],
        itemTypes: [ContentType_Enum.Abstract],
    },
    [ContentGroupType_Enum.Other]: {
        supported: true,
        requiredItemTypes: [],
        itemTypes: [],
    },
    [ContentGroupType_Enum.Paper]: {
        supported: true,
        requiredItemTypes: [ContentType_Enum.VideoPrepublish, ContentType_Enum.VideoBroadcast],
        itemTypes: [ContentType_Enum.Abstract],
    },
    [ContentGroupType_Enum.Poster]: {
        supported: true,
        requiredItemTypes: [],
        itemTypes: [ContentType_Enum.PosterFile],
    },
    [ContentGroupType_Enum.Sponsor]: {
        supported: true,
        requiredItemTypes: [ContentType_Enum.ImageFile],
        itemTypes: [],
    },
    [ContentGroupType_Enum.Symposium]: {
        supported: true,
        requiredItemTypes: [],
        itemTypes: [ContentType_Enum.Abstract, ContentType_Enum.Zoom],
    },
    [ContentGroupType_Enum.Workshop]: {
        supported: true,
        requiredItemTypes: [],
        itemTypes: [ContentType_Enum.Abstract, ContentType_Enum.Zoom],
    },
    [ContentGroupType_Enum.LandingPage]: {
        supported: true,
        requiredItemTypes: [],
        itemTypes: [ContentType_Enum.Abstract, ContentType_Enum.ContentGroupList],
    },
};

export function fitGroupToTemplate(group: ContentGroupDescriptor): void {
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
    group.requiredItems = [
        ...group.requiredItems,
        ...groupTemplate.requiredItemTypes
            .filter((itemType) => {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                return itemTemplate.supported && !group.requiredItems.some((x) => x.typeName === itemType);
            })
            .map((itemType) => {
                const baseType = ItemBaseTypes[itemType];
                const itemTemplate = ItemBaseTemplates[baseType];
                assert(itemTemplate.supported);
                const newItemDesc = itemTemplate.createDefault(itemType, true);
                assert(newItemDesc.type === "required-only");
                return newItemDesc.requiredItem;
            }),
    ];
}
