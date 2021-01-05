import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate } from "./Types";

export const ComponentItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (_group, type, _required) => {
        assert(
            type === ContentType_Enum.ContentGroupList || type === ContentType_Enum.WholeSchedule,
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
                layoutData: {},
            },
        };
    },
    renderEditor: function LinkItemEditor(data, _update) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            assert(
                data.item.typeName === ContentType_Enum.ContentGroupList ||
                    data.item.typeName === ContentType_Enum.WholeSchedule,
                `Component Item Template mistakenly used for type ${data.type}.`
            );
        }
        return <></>;
    },
    renderEditorHeading: function LinkItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.requiredItem.name}</>;
    },
};
