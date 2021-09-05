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

export const AudioElementTemplate: SupportedElementBaseTemplate = {
    supported: true,
    allowCreate: [Content_ElementType_Enum.AudioFile],
    createDefault: (type, conferenceId, itemId) => {
        assert(type === Content_ElementType_Enum.AudioFile, `Audio Element Template mistakenly used for type ${type}.`);

        const name = "Audio";

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
    renderEditor: function AudioElementEditor({ data, update }: RenderEditorProps) {
        if (data.typeName !== Content_ElementType_Enum.AudioFile) {
            return <>Audio Element Template mistakenly used for type {data.typeName}.</>;
        }

        const latestVersion = data.data[data.data.length - 1];
        if (latestVersion && latestVersion.data.baseType !== ElementBaseType.Audio) {
            return <>Audio Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
        }

        return (
            <>
                {latestVersion?.data.baseType === ElementBaseType.Audio ? (
                    <VideoElement elementId={data.id} elementData={latestVersion.data} />
                ) : undefined}
                <Heading as="h3" fontSize="lg" pt={8} mb={4}>
                    Upload new audio
                </Heading>
                <UploadFileForm_Element
                    allowedFileTypes={["audio/mp3", "audio/ogg", "audio/flac", "audio/wav"]}
                    item={data}
                    onElementChange={(newElement) => {
                        const newData = {
                            ...data,
                            ...newElement,
                        };
                        update(newData);
                    }}
                    contentBaseType={ElementBaseType.Audio}
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
                    contentBaseType={ElementBaseType.Audio}
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
                {latestVersion?.data.baseType === ElementBaseType.Audio &&
                latestVersion.data.subtitles["en_US"]?.s3Url ? (
                    <DownloadButton to={s3UrlToHttpUrl(latestVersion.data.subtitles["en_US"].s3Url)} size="sm" ml={2}>
                        Download .SRT file
                    </DownloadButton>
                ) : undefined}
            </>
        );
    },
    renderEditorHeading: function AudioElementEditorHeading(data) {
        return <>{data.name}</>;
    },
};
