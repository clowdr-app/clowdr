import { FormControl, FormLabel, Input, Text, useToast } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import type { ImageUrlBlob, PaperUrlBlob, PosterUrlBlob, VideoUrlBlob, ZoomBlob } from "@midspace/shared-types/content";
import { ElementBaseType } from "@midspace/shared-types/content";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

interface UrlElementVersionData {
    createdAt: number;
    createdBy: string;
    data: ImageUrlBlob | PaperUrlBlob | VideoUrlBlob | PosterUrlBlob | ZoomBlob;
}

export const URLElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [
        Content_ElementType_Enum.ImageUrl,
        Content_ElementType_Enum.PaperUrl,
        Content_ElementType_Enum.VideoUrl,
        Content_ElementType_Enum.PosterUrl,
        Content_ElementType_Enum.Zoom,
    ],
    createDefault: (type, conferenceId, itemId) => {
        assert.truthy(
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

        return {
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
            uploadsRemaining: 3,
        };
    },
    renderEditor: function URLElementEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [url, setUrl] = useState<string | null>(null);
        const [title, setTitle] = useState<string | null>(null);

        const notice =
            data.typeName === Content_ElementType_Enum.Zoom ? (
                <>
                    <Text pb={4}>
                        Zoom links should normally be hidden from attendees. They will be automatically revealed during
                        events.
                    </Text>
                    <Text pb={4}>
                        Zoom links should be the ordinary link obtained using &ldquo;Copy link&rdquo; within Zoom. This
                        will include the password field, enabling attendees to join with a single click.
                    </Text>
                </>
            ) : undefined;

        if (
            !(
                data.typeName === Content_ElementType_Enum.ImageUrl ||
                data.typeName === Content_ElementType_Enum.PaperUrl ||
                data.typeName === Content_ElementType_Enum.VideoUrl ||
                data.typeName === Content_ElementType_Enum.PosterUrl ||
                data.typeName === Content_ElementType_Enum.Zoom
            )
        ) {
            return <>URL Element Template mistakenly used for type {data.typeName}.</>;
        }

        const urlLabel = "URL";
        const urlPlaceholder =
            data.typeName === Content_ElementType_Enum.ImageUrl
                ? "https://www.example.org/an-image.png"
                : data.typeName === Content_ElementType_Enum.PaperUrl
                ? "https://ia800600.us.archive.org/7/items/archive_IHGC/Thesis.pdf"
                : data.typeName === Content_ElementType_Enum.VideoUrl
                ? "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                : data.typeName === Content_ElementType_Enum.Zoom
                ? "https://zoom.us/j/12345678901?pwd=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                : "https://www.example.org/a-poster.pdf";
        const textPlaceholder = "";

        const latestVersion = data.data[data.data.length - 1] as UrlElementVersionData;
        if (latestVersion && latestVersion.data.baseType !== ElementBaseType.URL) {
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
                        value={url ?? latestVersion?.data.url ?? ""}
                        onChange={(ev) => {
                            setUrl(ev.target.value);
                        }}
                        onBlur={(ev) => {
                            try {
                                if (ev.target.value === latestVersion?.data.url) {
                                    return;
                                }
                                const oldElementIdx = data.data.indexOf(latestVersion);
                                const newData = {
                                    ...data,
                                    data:
                                        oldElementIdx === -1
                                            ? [
                                                  ...data.data,
                                                  {
                                                      createdAt: Date.now(),
                                                      createdBy: "user",
                                                      data: {
                                                          baseType: ElementBaseType.URL,
                                                          type: data.typeName,
                                                          url: ev.target.value,
                                                      },
                                                  } as UrlElementVersionData,
                                              ]
                                            : data.data.map((version, idx) => {
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
                                };
                                update(newData);
                                setUrl(null);
                            } catch (e: any) {
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
                <FormControl mt={2}>
                    <FormLabel>URL title (for accessibility)</FormLabel>
                    <Input
                        type="text"
                        placeholder={textPlaceholder}
                        value={title ?? latestVersion?.data.title ?? ""}
                        onChange={(ev) => {
                            setTitle(ev.target.value);
                        }}
                        onBlur={(ev) => {
                            try {
                                if (ev.target.value === latestVersion?.data.title) {
                                    return;
                                }
                                const oldElementIdx = data.data.indexOf(latestVersion);
                                const newData = {
                                    ...data,
                                    data:
                                        oldElementIdx === -1
                                            ? [
                                                  ...data.data,
                                                  {
                                                      createdAt: Date.now(),
                                                      createdBy: "user",
                                                      data: {
                                                          baseType: ElementBaseType.URL,
                                                          type: data.typeName,
                                                          title: ev.target.value,
                                                      },
                                                  } as UrlElementVersionData,
                                              ]
                                            : data.data.map((version, idx) => {
                                                  return idx === oldElementIdx
                                                      ? {
                                                            ...version,
                                                            data: {
                                                                ...version.data,
                                                                title: ev.target.value,
                                                            },
                                                        }
                                                      : version;
                                              }),
                                };
                                update(newData);
                                setUrl(null);
                            } catch (e: any) {
                                console.error("Error saving URL title", e);
                                toast({
                                    status: "error",
                                    title: "Error saving URL title",
                                    description: e.message,
                                });
                            }
                        }}
                    />
                </FormControl>
            </>
        );
    },
    renderEditorHeading: function URLElementEditorHeading(data) {
        return <>{data.name}</>;
    },
};
