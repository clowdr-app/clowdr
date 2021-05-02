import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ElementType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate, RenderEditorProps } from "./Types";

export const ComponentItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (type, _required) => {
        assert(
            type === ElementType_Enum.ItemList || type === ElementType_Enum.WholeSchedule,
            `Component Item Template mistakenly used for type ${type}.`
        );

        return {
            type: "item-only",
            item: {
                isNew: true,
                id: uuidv4(),
                name: type,
                typeName: type,
                isHidden: false,
                data: [],
                layoutData: null,
            },
        };
    },
    renderEditor: function LinkItemEditor({ data }: RenderEditorProps) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            if (
                !(
                    data.item.typeName === ElementType_Enum.ItemList ||
                    data.item.typeName === ElementType_Enum.WholeSchedule
                )
            ) {
                return <>Component Item Template mistakenly used for type {data.type}.</>;
            }
        }
        return <></>;
    },
    renderEditorHeading: function LinkItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.uploadableItem.name}</>;
    },
};
