import { FormControl, FormLabel, Input, useToast } from "@chakra-ui/react";
import {
    ContentBaseType,
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
import { ElementType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate, RenderEditorProps } from "./Types";

function createDefaultURL(
    type:
        | ElementType_Enum.ImageUrl
        | ElementType_Enum.PaperUrl
        | ElementType_Enum.VideoUrl
        | ElementType_Enum.PosterUrl
        | ElementType_Enum.Zoom
): ElementVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ContentBaseType.URL,
            url: "",
        },
    };
}

interface UrlItemVersionData {
    createdAt: number;
    createdBy: string;
    data: ImageUrlBlob | PaperUrlBlob | VideoUrlBlob | PosterUrlBlob | ZoomBlob;
}

export const URLItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (type, required) => {
        assert(
            type === ElementType_Enum.ImageUrl ||
                type === ElementType_Enum.PaperUrl ||
                type === ElementType_Enum.VideoUrl ||
                type === ElementType_Enum.PosterUrl ||
                type === ElementType_Enum.Zoom,
            `URL Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ElementType_Enum.ImageUrl
                ? "URL to an image file (PNG, JPG/JPEG, GIF or SVG only)"
                : type === ElementType_Enum.PaperUrl
                ? "URL to a paper file (PDF, Text or Markdown only)"
                : type === ElementType_Enum.VideoUrl
                ? "URL to a video file (MP4 or OGG only)"
                : type === ElementType_Enum.Zoom
                ? "URL to a Zoom Meeting"
                : "URL to a poster image or file (PNG, JPG/JPEG, GIF, SVG or PDF only)";
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
    renderEditor: function URLItemEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [url, setUrl] = useState<string | null>(null);

        if (data.type === "item-only" || data.type === "required-and-item") {
            if (
                !(
                    data.item.typeName === ElementType_Enum.ImageUrl ||
                    data.item.typeName === ElementType_Enum.PaperUrl ||
                    data.item.typeName === ElementType_Enum.VideoUrl ||
                    data.item.typeName === ElementType_Enum.PosterUrl ||
                    data.item.typeName === ElementType_Enum.Zoom
                )
            ) {
                return <>URL Item Template mistakenly used for type {data.type}.</>;
            }

            const urlLabel = "URL";
            const urlPlaceholder =
                data.item.typeName === ElementType_Enum.ImageUrl
                    ? "https://www.example.org/an-image.png"
                    : data.item.typeName === ElementType_Enum.PaperUrl
                    ? "https://ia800600.us.archive.org/7/items/archive_IHGC/Thesis.pdf"
                    : data.item.typeName === ElementType_Enum.VideoUrl
                    ? "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    : data.item.typeName === ElementType_Enum.Zoom
                    ? "https://zoom.us/j/12345678901?pwd=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    : "https://www.example.org/a-poster.pdf";

            if (data.item.data.length === 0) {
                data = {
                    ...data,
                    item: {
                        ...data.item,
                        data: [createDefaultURL(data.item.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.item.data[data.item.data.length - 1] as UrlItemVersionData;
            if (latestVersion.data.baseType !== ContentBaseType.URL) {
                return <>URL Item Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            return (
                <>
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
                                    const oldItemIdx = data.item.data.indexOf(latestVersion);
                                    const newData = {
                                        ...data,
                                        item: {
                                            ...data.item,
                                            data: data.item.data.map((version, idx) => {
                                                return idx === oldItemIdx
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
        return <></>;
    },
    renderEditorHeading: function URLItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.uploadableItem.name}</>;
    },
};
