import { FormControl, FormLabel } from "@chakra-ui/react";
import { ContentBaseType, ContentItemVersionData } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentType_Enum } from "../../../../generated/graphql";
import RenderContentItem from "../../../Content/RenderContentItem";
import type { ItemBaseTemplate } from "./Types";

function createDefaultVideo(
    type:
        | ContentType_Enum.VideoBroadcast
        | ContentType_Enum.VideoCountdown
        | ContentType_Enum.VideoFile
        | ContentType_Enum.VideoFiller
        | ContentType_Enum.VideoPrepublish
        | ContentType_Enum.VideoSponsorsFiller
        | ContentType_Enum.VideoTitles
): ContentItemVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ContentBaseType.Video,
            s3Url: "",
            subtitles: {},
        },
    };
}

export const VideoItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (group, type, required) => {
        assert(
            type === ContentType_Enum.VideoBroadcast ||
                type === ContentType_Enum.VideoCountdown ||
                type === ContentType_Enum.VideoFile ||
                type === ContentType_Enum.VideoFiller ||
                type === ContentType_Enum.VideoPrepublish ||
                type === ContentType_Enum.VideoSponsorsFiller ||
                type === ContentType_Enum.VideoTitles,
            `Video Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ContentType_Enum.VideoBroadcast
                ? "Livestream broadcast video"
                : type === ContentType_Enum.VideoCountdown
                ? "Timer countdown video"
                : type === ContentType_Enum.VideoFile
                ? "Video file"
                : type === ContentType_Enum.VideoFiller
                ? "Filler video"
                : type === ContentType_Enum.VideoPrepublish
                ? "Pre-published video"
                : type === ContentType_Enum.VideoSponsorsFiller
                ? "Sponsors filler video"
                : "Titles video";
        if (required) {
            return {
                type: "required-only",
                requiredItem: {
                    isNew: true,
                    id: uuidv4(),
                    name,
                    typeName: type,
                },
            };
        } else {
            return {
                type: "item-only",
                item: {
                    isNew: true,
                    id: uuidv4(),
                    name,
                    typeName: type,
                    isHidden: false,
                    data: [],
                    layoutData: {},
                },
            };
        }
    },
    renderEditor: function VideoItemEditor(data, update) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            assert(
                data.item.typeName === ContentType_Enum.VideoBroadcast ||
                    data.item.typeName === ContentType_Enum.VideoCountdown ||
                    data.item.typeName === ContentType_Enum.VideoFile ||
                    data.item.typeName === ContentType_Enum.VideoFiller ||
                    data.item.typeName === ContentType_Enum.VideoPrepublish ||
                    data.item.typeName === ContentType_Enum.VideoSponsorsFiller ||
                    data.item.typeName === ContentType_Enum.VideoTitles,
                `Video Item Template mistakenly used for type ${data.type}.`
            );

            const VideoLabel = "Uploaded video";

            if (data.item.data.length === 0) {
                data = {
                    ...data,
                    item: {
                        ...data.item,
                        data: [createDefaultVideo(data.item.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.item.data[data.item.data.length - 1];
            assert(
                latestVersion.data.baseType === ContentBaseType.Video,
                `Video Item Template mistakenly used for base type ${latestVersion.data.baseType}.`
            );
            return (
                <>
                    <FormControl>
                        <FormLabel>{VideoLabel}</FormLabel>
                        <RenderContentItem data={data.item.data} />
                    </FormControl>
                </>
            );
        }
        return <>No video uploaded yet.</>;
    },
    renderEditorHeading: function VideoItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.requiredItem.name}</>;
    },
};
