import { Heading } from "@chakra-ui/react";
import { ElementBaseType, ElementVersionData } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import { DownloadButton } from "../../../../../../Chakra/LinkButton";
import { VideoElement } from "../../../../../Attend/Content/Element/VideoElement";
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

function s3UrlToHttpUrl(s3Url: string): string {
    const { bucket, key } = AmazonS3Uri(s3Url);
    return `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`;
}

export const VideoElementTemplate: SupportedElementBaseTemplate = {
    supported: true,
    allowCreate: [Content_ElementType_Enum.VideoBroadcast, Content_ElementType_Enum.VideoFile],
    createDefault: (type, required, conferenceId, itemId) => {
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
                ? "Video for live-stream"
                : type === Content_ElementType_Enum.VideoCountdown
                ? "Timer countdown video"
                : type === Content_ElementType_Enum.VideoFile
                ? "Video (cannot be live-streamed)"
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
                    __typename: "content_UploadableElement",
                    conferenceId,
                    itemId,
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
                    __typename: "content_Element",
                    updatedAt: new Date().toISOString(),
                    conferenceId,
                    itemId,
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
                        elementId={data.element.id}
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
                    {latestVersion.data.subtitles["en_US"]?.s3Url ? (
                        <DownloadButton
                            to={s3UrlToHttpUrl(latestVersion.data.subtitles["en_US"].s3Url)}
                            size="sm"
                            ml={2}
                        >
                            Download .SRT file
                        </DownloadButton>
                    ) : undefined}
                </>
            );
        }
        return data.uploadableElement.hasBeenUploaded ? (
            <>A video has been uploaded but you do not have permission to view it.</>
        ) : (
            <>No video uploaded yet.</>
        );
    },
    renderEditorHeading: function VideoElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
