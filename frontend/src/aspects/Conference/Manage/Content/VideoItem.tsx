import { Heading } from "@chakra-ui/react";
import { ContentBaseType, ElementVersionData } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ElementType_Enum } from "../../../../generated/graphql";
import { ElementVideo } from "../../Attend/Content/Element/ElementVideo";
import { RefreshSubtitles } from "./RefreshSubtitles";
import type { ItemBaseTemplate, RenderEditorProps } from "./Types";
import UploadFileForm_Element from "./UploadFileForm_Element";
import UploadFileForm_Subtitles from "./UploadFileForm_Subtitles";

function createDefaultVideo(
    type:
        | ElementType_Enum.VideoBroadcast
        | ElementType_Enum.VideoCountdown
        | ElementType_Enum.VideoFile
        | ElementType_Enum.VideoFiller
        | ElementType_Enum.VideoPrepublish
        | ElementType_Enum.VideoSponsorsFiller
        | ElementType_Enum.VideoTitles
): ElementVersionData {
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
    createDefault: (type, required) => {
        assert(
            type === ElementType_Enum.VideoBroadcast ||
                type === ElementType_Enum.VideoCountdown ||
                type === ElementType_Enum.VideoFile ||
                type === ElementType_Enum.VideoFiller ||
                type === ElementType_Enum.VideoPrepublish ||
                type === ElementType_Enum.VideoSponsorsFiller ||
                type === ElementType_Enum.VideoTitles,
            `Video Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ElementType_Enum.VideoBroadcast
                ? "Livestream broadcast video"
                : type === ElementType_Enum.VideoCountdown
                ? "Timer countdown video"
                : type === ElementType_Enum.VideoFile
                ? "Video file"
                : type === ElementType_Enum.VideoFiller
                ? "Filler video"
                : type === ElementType_Enum.VideoPrepublish
                ? "Pre-published video"
                : type === ElementType_Enum.VideoSponsorsFiller
                ? "Sponsors filler video"
                : "Titles video";
        if (required) {
            return {
                type: "required-only",
                uploadableItem: {
                    isNew: true,
                    id: uuidv4(),
                    name,
                    isHidden: false,
                    typeName: type,
                    uploaders: [],
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
                    layoutData: null,
                },
            };
        }
    },
    renderEditor: function VideoItemEditor({ data, update }: RenderEditorProps) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            if (
                !(
                    data.item.typeName === ElementType_Enum.VideoBroadcast ||
                    data.item.typeName === ElementType_Enum.VideoCountdown ||
                    data.item.typeName === ElementType_Enum.VideoFile ||
                    data.item.typeName === ElementType_Enum.VideoFiller ||
                    data.item.typeName === ElementType_Enum.VideoPrepublish ||
                    data.item.typeName === ElementType_Enum.VideoSponsorsFiller ||
                    data.item.typeName === ElementType_Enum.VideoTitles
                )
            ) {
                return <>Video Item Template mistakenly used for type {data.type}.</>;
            }

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
            if (latestVersion.data.baseType !== ContentBaseType.Video) {
                return <>Video Item Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            return (
                <>
                    <ElementVideo
                        elementId={data.item.isNew ? "" : data.item.id}
                        title={data.item.name}
                        videoElementData={latestVersion.data}
                    />
                    <Heading as="h3" fontSize="lg" mb={4}>
                        Upload new video
                    </Heading>
                    <UploadFileForm_Element
                        allowedFileTypes={["video/mp4", "video/webm"]}
                        item={data.item}
                        onItemChange={(newItem) => {
                            const newData = {
                                ...data,
                                item: newItem,
                            };
                            update(newData);
                        }}
                        contentBaseType={ContentBaseType.Video}
                    />
                    <UploadFileForm_Subtitles
                        item={data.item}
                        onItemChange={(newItem) => {
                            const newData = {
                                ...data,
                                item: newItem,
                            };
                            update(newData);
                        }}
                        contentBaseType={ContentBaseType.Video}
                    />
                    <RefreshSubtitles
                        item={data.item}
                        onItemChange={(newItem) => {
                            const newData = {
                                ...data,
                                item: newItem,
                            };
                            update(newData);
                        }}
                    />
                </>
            );
        }
        return <>No video uploaded yet.</>;
    },
    renderEditorHeading: function VideoItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.uploadableItem.name}</>;
    },
};
