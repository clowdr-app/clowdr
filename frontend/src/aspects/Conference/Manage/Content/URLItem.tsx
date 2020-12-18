import { FormControl, FormLabel, Input } from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentBaseType, ContentItemVersionData } from "../../../../../../shared/types/content";
import { ContentType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate } from "./Types";

function createDefaultURL(
    currentUserId: string,
    type: ContentType_Enum.ImageUrl | ContentType_Enum.PaperUrl | ContentType_Enum.VideoUrl | ContentType_Enum.PosterUrl
): ContentItemVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: currentUserId,
        data: {
            type,
            baseType: ContentBaseType.URL,
            url: "",
        },
    };
}

export const URLItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (currentUserId, group, type, required) => {
        assert(
            type === ContentType_Enum.ImageUrl ||
            type === ContentType_Enum.PaperUrl ||
            type === ContentType_Enum.VideoUrl ||
            type === ContentType_Enum.PosterUrl,
            `URL Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ContentType_Enum.ImageUrl
                ? "URL to an image file (PNG, JPG/JPEG, GIF or SVG only)"
                : type === ContentType_Enum.PaperUrl
                ? "URL to a paper file (PDF, Text or Markdown only)"
                : type === ContentType_Enum.VideoUrl
                ? "URL to a video file (MP4 or OGG only)"
                : "URL to a poster image or file (PNG, JPG/JPEG, GIF, SVG or PDF only)";
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
    renderEditor: function URLItemEditor(currentUserId, data, update) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            assert(
                data.item.typeName === ContentType_Enum.ImageUrl ||
                data.item.typeName === ContentType_Enum.PaperUrl ||
                data.item.typeName === ContentType_Enum.VideoUrl ||
                data.item.typeName === ContentType_Enum.PosterUrl,
                `URL Item Template mistakenly used for type ${data.type}.`
            );

            const urlLabel = "URL";
            const urlPlaceholder =
                data.item.typeName === ContentType_Enum.ImageUrl
                    ? "https://www.example.org/an-image.png"
                    : data.item.typeName === ContentType_Enum.PaperUrl
                    ? "https://ia800600.us.archive.org/7/items/archive_IHGC/Thesis.pdf"
                    : data.item.typeName === ContentType_Enum.VideoUrl
                    ? "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    : "https://www.example.org/a-poster.pdf";

            if (data.item.data.length === 0) {
                data = {
                    ...data,
                    item: {
                        ...data.item,
                        data: [createDefaultURL(currentUserId, data.item.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.item.data.sort((x, y) => y.createdAt - x.createdAt)[0];
            assert(
                latestVersion.data.baseType === ContentBaseType.URL,
                `URL Item Template mistakenly used for base type ${latestVersion.data.baseType}.`
            );
            return (
                <>
                    <FormControl>
                        <FormLabel>{urlLabel}</FormLabel>
                        <Input
                            type="url"
                            placeholder={urlPlaceholder}
                            value={latestVersion.data.url}
                            onChange={(ev) => {
                                assert(data.type !== "required-only");
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
                            }}
                        />
                    </FormControl>
                </>
            );
        }
        return <></>;
    },
    renderEditorHeading: function URLItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.requiredItem.name}</>;
    },
};
