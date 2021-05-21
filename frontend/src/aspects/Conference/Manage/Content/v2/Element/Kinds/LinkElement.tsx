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
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

function createDefaultLink(
    type:
        | Content_ElementType_Enum.Link
        | Content_ElementType_Enum.LinkButton
        | Content_ElementType_Enum.PaperLink
        | Content_ElementType_Enum.VideoLink
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

interface LinkElementVersionData {
    createdAt: number;
    createdBy: string;
    data: LinkBlob | LinkButtonBlob | PaperLinkBlob | VideoLinkBlob;
}

export const LinkElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [
        Content_ElementType_Enum.LinkButton,
        Content_ElementType_Enum.PaperLink,
        Content_ElementType_Enum.VideoLink,
    ],
    createDefault: (type, required, conferenceId, itemId) => {
        assert(
            type === Content_ElementType_Enum.Link ||
                type === Content_ElementType_Enum.LinkButton ||
                type === Content_ElementType_Enum.PaperLink ||
                type === Content_ElementType_Enum.VideoLink,
            `Link Element Template mistakenly used for type ${type}.`
        );

        const name =
            type === Content_ElementType_Enum.LinkButton
                ? "Link Button"
                : type === Content_ElementType_Enum.PaperLink
                ? "Link to paper"
                : type === Content_ElementType_Enum.VideoLink
                ? "Link to video"
                : "Link";
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
    renderEditor: function LinkElementEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [text, setText] = useState<string | null>(null);
        const [url, setUrl] = useState<string | null>(null);

        if (data.type === "element-only" || data.type === "required-and-element") {
            if (
                !(
                    data.element.typeName === Content_ElementType_Enum.Link ||
                    data.element.typeName === Content_ElementType_Enum.LinkButton ||
                    data.element.typeName === Content_ElementType_Enum.PaperLink ||
                    data.element.typeName === Content_ElementType_Enum.VideoLink
                )
            ) {
                return <>Link Element Template mistakenly used for type {data.type}.</>;
            }

            const textPlaceholder =
                data.element.typeName === Content_ElementType_Enum.LinkButton
                    ? "Button text"
                    : data.element.typeName === Content_ElementType_Enum.PaperLink
                    ? "Paper title"
                    : data.element.typeName === Content_ElementType_Enum.VideoLink
                    ? "Video title"
                    : "Link title";
            const textLabel = textPlaceholder;

            const urlLabel = "URL";
            const urlPlaceholder =
                data.element.typeName === Content_ElementType_Enum.LinkButton
                    ? "https://www.example.org"
                    : data.element.typeName === Content_ElementType_Enum.PaperLink
                    ? "https://archive.org/..."
                    : data.element.typeName === Content_ElementType_Enum.VideoLink
                    ? "https://youtube.com/..."
                    : "https://www.example.org";

            if (data.element.data.length === 0) {
                data = {
                    ...data,
                    element: {
                        ...data.element,
                        data: [createDefaultLink(data.element.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.element.data[data.element.data.length - 1] as LinkElementVersionData;
            if (latestVersion.data.baseType !== ElementBaseType.Link) {
                return <>Link Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
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
        return data.uploadableElement.hasBeenUploaded ? (
            <>A link has been uploaded but you do not have permission to view it.</>
        ) : (
            <>No link uploaded yet.</>
        );
    },
    renderEditorHeading: function LinkElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
