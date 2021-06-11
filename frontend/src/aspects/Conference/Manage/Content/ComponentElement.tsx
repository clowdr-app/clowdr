import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

export const ComponentElementTemplate: ElementBaseTemplate = {
    supported: true,
    createDefault: (type, _required) => {
        assert(
            type === Content_ElementType_Enum.ContentGroupList ||
                type === Content_ElementType_Enum.WholeSchedule ||
                type === Content_ElementType_Enum.LiveProgramRooms ||
                type === Content_ElementType_Enum.ActiveSocialRooms ||
                type === Content_ElementType_Enum.Divider ||
                type === Content_ElementType_Enum.SponsorBooths ||
                type === Content_ElementType_Enum.ExploreProgramButton ||
                type === Content_ElementType_Enum.ExploreScheduleButton,
            `Component Element Template mistakenly used for type ${type}.`
        );

        const nameStr = type
            .toLowerCase()
            .split("_")
            .reduce((acc, x) => `${acc} ${x}`);
        return {
            type: "element-only",
            element: {
                isNew: true,
                id: uuidv4(),
                name: nameStr[0].toUpperCase() + nameStr.substr(1),
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
                    data.element.typeName === Content_ElementType_Enum.WholeSchedule ||
                    data.element.typeName === Content_ElementType_Enum.LiveProgramRooms ||
                    data.element.typeName === Content_ElementType_Enum.ActiveSocialRooms ||
                    data.element.typeName === Content_ElementType_Enum.Divider ||
                    data.element.typeName === Content_ElementType_Enum.SponsorBooths
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
