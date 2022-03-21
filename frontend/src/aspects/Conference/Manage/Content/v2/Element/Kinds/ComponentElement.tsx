import { assert } from "@midspace/assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

export const ComponentElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [
        Content_ElementType_Enum.ContentGroupList,
        Content_ElementType_Enum.WholeSchedule,
        Content_ElementType_Enum.ExploreProgramButton,
        Content_ElementType_Enum.ExploreScheduleButton,
        Content_ElementType_Enum.LiveProgramRooms,
        Content_ElementType_Enum.ActiveSocialRooms,
        Content_ElementType_Enum.Divider,
        Content_ElementType_Enum.SponsorBooths,
    ],
    createDefault: (type, conferenceId, subconferenceId, itemId) => {
        assert.truthy(
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
            __typename: "content_Element",
            conferenceId,
            subconferenceId,
            itemId,
            updatedAt: new Date().toISOString(),
            id: uuidv4(),
            name: nameStr[0].toUpperCase() + nameStr.substr(1),
            typeName: type,
            isHidden: false,
            data: [],
            layoutData: null,
            uploadsRemaining: null,
        };
    },
    renderEditor: function LinkElementEditor({ data }: RenderEditorProps) {
        if (
            !(
                data.typeName === Content_ElementType_Enum.ContentGroupList ||
                data.typeName === Content_ElementType_Enum.WholeSchedule ||
                data.typeName === Content_ElementType_Enum.LiveProgramRooms ||
                data.typeName === Content_ElementType_Enum.ActiveSocialRooms ||
                data.typeName === Content_ElementType_Enum.Divider ||
                data.typeName === Content_ElementType_Enum.SponsorBooths ||
                data.typeName === Content_ElementType_Enum.ExploreProgramButton ||
                data.typeName === Content_ElementType_Enum.ExploreScheduleButton
            )
        ) {
            return <>Component Element Template mistakenly used for type {data.typeName}.</>;
        }
        return <></>;
    },
    renderEditorHeading: function LinkElementEditorHeading(data) {
        return <>{data.name}</>;
    },
};
