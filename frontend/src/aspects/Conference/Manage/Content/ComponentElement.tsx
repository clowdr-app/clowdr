import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

export const ComponentElementTemplate: ElementBaseTemplate = {
    supported: true,
    createDefault: (type, _required) => {
        assert(
            type === Content_ElementType_Enum.ContentGroupList || type === Content_ElementType_Enum.WholeSchedule,
            `Component Element Template mistakenly used for type ${type}.`
        );

        return {
            type: "element-only",
            element: {
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
    renderEditor: function LinkElementEditor({ data }: RenderEditorProps) {
        if (data.type === "element-only" || data.type === "required-and-element") {
            if (
                !(
                    data.element.typeName === Content_ElementType_Enum.ContentGroupList ||
                    data.element.typeName === Content_ElementType_Enum.WholeSchedule
                )
            ) {
                return <>Component Element Template mistakenly used for type {data.type}.</>;
            }
        }
        return <></>;
    },
    renderEditorHeading: function LinkElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
