import { ContentBaseType, ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import { ContentGroupType_Enum, ContentType_Enum } from "../../../../generated/graphql";
import { LinkItemTemplate } from "./LinkItem";
import { TextItemTemplate } from "./TextItem";
import type { ContentGroupDescriptor, ItemBaseTemplate } from "./Types";
import { URLItemTemplate } from "./URLItem";
import { VideoItemTemplate } from "./VideoItem";

export const ItemBaseTemplates: { [K in ContentBaseType]: ItemBaseTemplate } = {
    [ContentBaseType.File]: { supported: false },
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
    [ContentGroupType_Enum.Keynote]: { supported: false },
    [ContentGroupType_Enum.Other]: { supported: false },
    [ContentGroupType_Enum.Paper]: {
        supported: true,
        requiredItemTypes: [ContentType_Enum.VideoPrepublish, ContentType_Enum.VideoBroadcast],
        itemTypes: [ContentType_Enum.Abstract, ContentType_Enum.PaperLink],
    },
    [ContentGroupType_Enum.Poster]: { supported: false },
    [ContentGroupType_Enum.Sponsor]: { supported: false },
    [ContentGroupType_Enum.Symposium]: { supported: false },
    [ContentGroupType_Enum.Workshop]: { supported: false },
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
                const newItemDesc = itemTemplate.createDefault(group, itemType, false);
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
                const newItemDesc = itemTemplate.createDefault(group, itemType, true);
                assert(newItemDesc.type === "required-only");
                return newItemDesc.requiredItem;
            }),
    ];
}
