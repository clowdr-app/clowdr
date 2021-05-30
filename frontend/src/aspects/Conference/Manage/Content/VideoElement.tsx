import { Heading } from "@chakra-ui/react";
import { ElementBaseType, ElementVersionData } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../generated/graphql";
import { VideoElement } from "../../Attend/Content/Element/VideoElement";
import { RefreshSubtitles } from "./RefreshSubtitles";
import type { RenderEditorProps, SupportedElementBaseTemplate } from "./Types";
import UploadFileForm_Element from "./UploadFileForm_Element";
import UploadFileForm_Subtitles from "./UploadFileForm_Subtitles";

function createDefaultVideo(
    type:
        | Content_ElementType_Enum.VideoBroadcast
        | Content_ElementType_Enum.VideoCountdown
        | Content_ElementType_Enum.VideoFile
        | Content_ElementType_Enum.VideoFiller
        | Content_ElementType_Enum.VideoPrepublish
        | Content_ElementType_Enum.VideoSponsorsFiller
        | Content_ElementType_Enum.VideoTitles
): ElementVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ElementBaseType.Video,
            s3Url: "",
            subtitles: {},
        },
    };
}

export const VideoElementTemplate: SupportedElementBaseTemplate = {
    supported: true,
    createDefault: (type, required) => {
        assert(
            type === Content_ElementType_Enum.VideoBroadcast ||
                type === Content_ElementType_Enum.VideoCountdown ||
                type === Content_ElementType_Enum.VideoFile ||
                type === Content_ElementType_Enum.VideoFiller ||
                type === Content_ElementType_Enum.VideoPrepublish ||
                type === Content_ElementType_Enum.VideoSponsorsFiller ||
                type === Content_ElementType_Enum.VideoTitles,
            `Video Element Template mistakenly used for type ${type}.`
        );

        const name =
            type === Content_ElementType_Enum.VideoBroadcast
                ? "Livestream video"
                : type === Content_ElementType_Enum.VideoCountdown
                ? "Timer countdown video"
                : type === Content_ElementType_Enum.VideoFile
                ? "Video"
                : type === Content_ElementType_Enum.VideoFiller
                ? "Filler video"
                : type === Content_ElementType_Enum.VideoPrepublish
                ? "Pre-published video"
                : type === Content_ElementType_Enum.VideoSponsorsFiller
                ? "Sponsors video"
                : "Titles video";
        if (required) {
            return {
                type: "required-only",
                uploadableElement: {
                    isNew: true,
                    id: uuidv4(),
                    name,
                    isHidden: false,
                    typeName: type,
                    uploaders: [],
                    uploadsRemaining: 3,
                },
            };
        } else {
            return {
                type: "element-only",
                element: {
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
    renderEditor: function VideoElementEditor({ data, update }: RenderEditorProps) {
        if (data.type === "element-only" || data.type === "required-and-element") {
            if (
                !(
                    data.element.typeName === Content_ElementType_Enum.VideoBroadcast ||
                    data.element.typeName === Content_ElementType_Enum.VideoCountdown ||
                    data.element.typeName === Content_ElementType_Enum.VideoFile ||
                    data.element.typeName === Content_ElementType_Enum.VideoFiller ||
                    data.element.typeName === Content_ElementType_Enum.VideoPrepublish ||
                    data.element.typeName === Content_ElementType_Enum.VideoSponsorsFiller ||
                    data.element.typeName === Content_ElementType_Enum.VideoTitles
                )
            ) {
                return <>Video Element Template mistakenly used for type {data.type}.</>;
            }

            if (data.element.data.length === 0) {
                data = {
                    ...data,
                    element: {
                        ...data.element,
                        data: [createDefaultVideo(data.element.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.element.data[data.element.data.length - 1];
            if (latestVersion.data.baseType !== ElementBaseType.Video) {
                return <>Video Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            return (
                <>
                    <VideoElement
                        elementId={data.element.isNew ? "" : data.element.id}
                        title={data.element.name}
                        videoElementData={latestVersion.data}
                    />
                    <Heading as="h3" fontSize="lg" mb={4}>
                        Upload new video
                    </Heading>
                    <UploadFileForm_Element
                        allowedFileTypes={["video/mp4", "video/webm"]}
                        item={data.element}
                        onElementChange={(newElement) => {
                            const newData = {
                                ...data,
                                element: newElement,
                            };
                            update(newData);
                        }}
                        contentBaseType={ElementBaseType.Video}
                    />
                    <UploadFileForm_Subtitles
                        item={data.element}
                        onElementChange={(newElement) => {
                            const newData = {
                                ...data,
                                element: newElement,
                            };
                            update(newData);
                        }}
                        contentBaseType={ElementBaseType.Video}
                    />
                    <RefreshSubtitles
                        item={data.element}
                        onElementChange={(newElement) => {
                            const newData = {
                                ...data,
                                element: newElement,
                            };
                            update(newData);
                        }}
                    />
                </>
            );
        }
        return <>No video uploaded yet.</>;
    },
    renderEditorHeading: function VideoElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
