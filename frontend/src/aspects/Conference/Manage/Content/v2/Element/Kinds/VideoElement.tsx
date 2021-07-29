import { Heading } from "@chakra-ui/react";
import { ElementBaseType } from "@clowdr-app/shared-types/build/content";
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

function s3UrlToHttpUrl(s3Url: string): string {
    const { bucket, key } = AmazonS3Uri(s3Url);
    return `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`;
}

export const VideoElementTemplate: SupportedElementBaseTemplate = {
    supported: true,
    allowCreate: [Content_ElementType_Enum.VideoBroadcast, Content_ElementType_Enum.VideoFile],
    createDefault: (type, conferenceId, itemId) => {
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

        return {
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
            uploadsRemaining: 3,
        };
    },
    renderEditor: function VideoElementEditor({ data, update }: RenderEditorProps) {
        if (
            !(
                data.typeName === Content_ElementType_Enum.VideoBroadcast ||
                data.typeName === Content_ElementType_Enum.VideoCountdown ||
                data.typeName === Content_ElementType_Enum.VideoFile ||
                data.typeName === Content_ElementType_Enum.VideoFiller ||
                data.typeName === Content_ElementType_Enum.VideoPrepublish ||
                data.typeName === Content_ElementType_Enum.VideoSponsorsFiller ||
                data.typeName === Content_ElementType_Enum.VideoTitles
            )
        ) {
            return <>Video Element Template mistakenly used for type {data.typeName}.</>;
        }

        if (data.data.length === 0) {
            data = {
                ...data,
                data: [],
            };
            setTimeout(() => update(data), 0);
        }

        const latestVersion = data.data[data.data.length - 1];
        if (latestVersion.data.baseType !== ElementBaseType.Video) {
            return <>Video Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
        }
        return (
            <>
                <VideoElement elementId={data.id} videoElementData={latestVersion.data} />
                <Heading as="h3" fontSize="lg" pt={8} mb={4}>
                    Upload new video
                </Heading>
                <UploadFileForm_Element
                    allowedFileTypes={["video/mp4", "video/webm"]}
                    item={data}
                    onElementChange={(newElement) => {
                        const newData = {
                            ...data,
                            ...newElement,
                        };
                        update(newData);
                    }}
                    contentBaseType={ElementBaseType.Video}
                />
                <UploadFileForm_Subtitles
                    item={data}
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
                    item={data}
                    onElementChange={(newElement) => {
                        const newData = {
                            ...data,
                            element: newElement,
                        };
                        update(newData);
                    }}
                />
                {latestVersion.data.subtitles["en_US"]?.s3Url ? (
                    <DownloadButton to={s3UrlToHttpUrl(latestVersion.data.subtitles["en_US"].s3Url)} size="sm" ml={2}>
                        Download .SRT file
                    </DownloadButton>
                ) : undefined}
            </>
        );
    },
    renderEditorHeading: function VideoElementEditorHeading(data) {
        return <>{data.name}</>;
    },
};
