import { FormControl, FormLabel, Input, Text, useToast } from "@chakra-ui/react";
import {
    ElementBaseType,
    ElementVersionData,
    ImageUrlBlob,
    PaperUrlBlob,
    PosterUrlBlob,
    VideoUrlBlob,
    ZoomBlob,
} from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

function createDefaultURL(
    type:
        | Content_ElementType_Enum.ImageUrl
        | Content_ElementType_Enum.PaperUrl
        | Content_ElementType_Enum.VideoUrl
        | Content_ElementType_Enum.PosterUrl
        | Content_ElementType_Enum.Zoom
): ElementVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ElementBaseType.URL,
            url: "",
        },
    };
}

interface UrlElementVersionData {
    createdAt: number;
    createdBy: string;
    data: ImageUrlBlob | PaperUrlBlob | VideoUrlBlob | PosterUrlBlob | ZoomBlob;
}

export const URLElementTemplate: ElementBaseTemplate = {
    supported: true,
    createDefault: (type, required, conferenceId, itemId) => {
        assert(
            type === Content_ElementType_Enum.ImageUrl ||
                type === Content_ElementType_Enum.PaperUrl ||
                type === Content_ElementType_Enum.VideoUrl ||
                type === Content_ElementType_Enum.PosterUrl ||
                type === Content_ElementType_Enum.Zoom,
            `URL Element Template mistakenly used for type ${type}.`
        );

        const name =
            type === Content_ElementType_Enum.ImageUrl
                ? "Image"
                : type === Content_ElementType_Enum.PaperUrl
                ? "Paper"
                : type === Content_ElementType_Enum.VideoUrl
                ? "Video"
                : type === Content_ElementType_Enum.Zoom
                ? "Zoom"
                : "Poster";
        if (required) {
            return {
                type: "required-only",
                uploadableElement: {
                    __typename: "content_UploadableElement",
                    conferenceId,
                    itemId,
                    id: uuidv4(),
                    name,
                    isHidden: type === Content_ElementType_Enum.Zoom,
                    typeName: type,
                    uploaders: [],
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
                    isHidden: type === Content_ElementType_Enum.Zoom,
                    data: [],
                    layoutData: null,
                },
            };
        }
    },
    renderEditor: function URLElementEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [url, setUrl] = useState<string | null>(null);

        const notice = (
            data.type === "element-only" || data.type === "required-and-element"
                ? data.element.typeName === Content_ElementType_Enum.Zoom
                : data.uploadableElement.typeName === Content_ElementType_Enum.Zoom
        ) ? (
            <>
                <Text pb={4}>
                    Zoom links should normally be hidden from attendees. They will be automatically revealed during
                    events.
                </Text>
                <Text pb={4}>
                    Zoom links should be the ordinary link obtained using &ldquo;Copy link&rdquo; within Zoom. This will
                    include the password field, enabling attendees to join with a single click.
                </Text>
            </>
        ) : undefined;

        if (data.type === "element-only" || data.type === "required-and-element") {
            if (
                !(
                    data.element.typeName === Content_ElementType_Enum.ImageUrl ||
                    data.element.typeName === Content_ElementType_Enum.PaperUrl ||
                    data.element.typeName === Content_ElementType_Enum.VideoUrl ||
                    data.element.typeName === Content_ElementType_Enum.PosterUrl ||
                    data.element.typeName === Content_ElementType_Enum.Zoom
                )
            ) {
                return <>URL Element Template mistakenly used for type {data.type}.</>;
            }

            const urlLabel = "URL";
            const urlPlaceholder =
                data.element.typeName === Content_ElementType_Enum.ImageUrl
                    ? "https://www.example.org/an-image.png"
                    : data.element.typeName === Content_ElementType_Enum.PaperUrl
                    ? "https://ia800600.us.archive.org/7/items/archive_IHGC/Thesis.pdf"
                    : data.element.typeName === Content_ElementType_Enum.VideoUrl
                    ? "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    : data.element.typeName === Content_ElementType_Enum.Zoom
                    ? "https://zoom.us/j/12345678901?pwd=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    : "https://www.example.org/a-poster.pdf";

            if (data.element.data.length === 0) {
                data = {
                    ...data,
                    element: {
                        ...data.element,
                        data: [createDefaultURL(data.element.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.element.data[data.element.data.length - 1] as UrlElementVersionData;
            if (latestVersion.data.baseType !== ElementBaseType.URL) {
                return <>URL Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            return (
                <>
                    {notice}
                    <FormControl>
                        <FormLabel>{urlLabel}</FormLabel>
                        <Input
                            type="url"
                            placeholder={urlPlaceholder}
                            value={url ?? latestVersion.data.url}
                            onChange={(ev) => {
                                setUrl(ev.target.value);
                            }}
                            onBlur={(ev) => {
                                try {
                                    assert(data.type !== "required-only");
                                    if (ev.target.value === latestVersion.data.url) {
                                        return;
                                    }
                                    const oldElementIdx = data.element.data.indexOf(latestVersion);
                                    const newData = {
                                        ...data,
                                        element: {
                                            ...data.element,
                                            data: data.element.data.map((version, idx) => {
                                                return idx === oldElementIdx
                                                    ? {
                                                          ...version,
                                                          data: {
                                                              ...version.data,
                                                              url: ev.target.value,
                                                          },
                                                      }
                                                    : version;
                                            }),
                                        },
                                    };
                                    update(newData);
                                    setUrl(null);
                                } catch (e) {
                                    console.error("Error saving URL", e);
                                    toast({
                                        status: "error",
                                        title: "Error saving URL",
                                        description: e.message,
                                    });
                                }
                            }}
                        />
                    </FormControl>
                </>
            );
        }
        return (
            <>
                {notice}
                {data.uploadableElement.hasBeenUploaded ? (
                    <Text>A URL has been uploaded but you do not have permission to view it.</Text>
                ) : (
                    <Text>No URL uploaded yet.</Text>
                )}
            </>
        );
    },
    renderEditorHeading: function URLElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
