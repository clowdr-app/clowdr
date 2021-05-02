import { FormControl, FormLabel, Input, useToast } from "@chakra-ui/react";
import {
    ElementBaseType,
    ElementVersionData,
    LinkBlob,
    LinkButtonBlob,
    PaperLinkBlob,
    VideoLinkBlob,
} from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ElementType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate, RenderEditorProps } from "./Types";

function createDefaultLink(
    type: ElementType_Enum.Link | ElementType_Enum.LinkButton | ElementType_Enum.PaperLink | ElementType_Enum.VideoLink
): ElementVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ElementBaseType.Link,
            text: "",
            url: "",
        },
    };
}

interface LinkItemVersionData {
    createdAt: number;
    createdBy: string;
    data: LinkBlob | LinkButtonBlob | PaperLinkBlob | VideoLinkBlob;
}

export const LinkItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (type, required) => {
        assert(
            type === ElementType_Enum.Link ||
                type === ElementType_Enum.LinkButton ||
                type === ElementType_Enum.PaperLink ||
                type === ElementType_Enum.VideoLink,
            `Link Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ElementType_Enum.LinkButton
                ? "Link Button"
                : type === ElementType_Enum.PaperLink
                ? "Link to paper"
                : type === ElementType_Enum.VideoLink
                ? "Link to video"
                : "Link";
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
    renderEditor: function LinkItemEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [text, setText] = useState<string | null>(null);
        const [url, setUrl] = useState<string | null>(null);

        if (data.type === "item-only" || data.type === "required-and-item") {
            if (
                !(
                    data.item.typeName === ElementType_Enum.Link ||
                    data.item.typeName === ElementType_Enum.LinkButton ||
                    data.item.typeName === ElementType_Enum.PaperLink ||
                    data.item.typeName === ElementType_Enum.VideoLink
                )
            ) {
                return <>Link Item Template mistakenly used for type {data.type}.</>;
            }

            const textPlaceholder =
                data.item.typeName === ElementType_Enum.LinkButton
                    ? "Button text"
                    : data.item.typeName === ElementType_Enum.PaperLink
                    ? "Paper title"
                    : data.item.typeName === ElementType_Enum.VideoLink
                    ? "Video title"
                    : "Link title";
            const textLabel = textPlaceholder;

            const urlLabel = "URL";
            const urlPlaceholder =
                data.item.typeName === ElementType_Enum.LinkButton
                    ? "https://www.example.org"
                    : data.item.typeName === ElementType_Enum.PaperLink
                    ? "https://archive.org/..."
                    : data.item.typeName === ElementType_Enum.VideoLink
                    ? "https://youtube.com/..."
                    : "https://www.example.org";

            if (data.item.data.length === 0) {
                data = {
                    ...data,
                    item: {
                        ...data.item,
                        data: [createDefaultLink(data.item.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.item.data[data.item.data.length - 1] as LinkItemVersionData;
            if (latestVersion.data.baseType !== ElementBaseType.Link) {
                return <>Link Item Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            return (
                <>
                    <FormControl>
                        <FormLabel>{textLabel}</FormLabel>
                        <Input
                            type="text"
                            placeholder={textPlaceholder}
                            value={text ?? latestVersion.data.text}
                            onChange={(ev) => {
                                setText(ev.target.value);
                            }}
                            onBlur={(ev) => {
                                try {
                                    assert(data.type !== "required-only");
                                    if (ev.target.value === latestVersion.data.text) {
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
                                                              text: ev.target.value,
                                                          },
                                                      }
                                                    : version;
                                            }),
                                        },
                                    };
                                    update(newData);
                                    setText(null);
                                } catch (e) {
                                    console.error("Error saving link text", e);
                                    toast({
                                        status: "error",
                                        title: "Error saving link text",
                                        description: e.message,
                                    });
                                }
                            }}
                        />
                    </FormControl>
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
                                    console.error("Error saving link URL", e);
                                    toast({
                                        status: "error",
                                        title: "Error saving link URL",
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
    renderEditorHeading: function LinkItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.uploadableItem.name}</>;
    },
};
