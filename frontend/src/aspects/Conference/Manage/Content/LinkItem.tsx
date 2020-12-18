import { FormControl, FormLabel, Input } from "@chakra-ui/react";
import { ContentBaseType, ContentItemVersionData } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate } from "./Types";

function createDefaultLink(
    type: ContentType_Enum.Link | ContentType_Enum.LinkButton | ContentType_Enum.PaperLink | ContentType_Enum.VideoLink
): ContentItemVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ContentBaseType.Link,
            text: "",
            url: "",
        },
    };
}

export const LinkItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (group, type, required) => {
        assert(
            type === ContentType_Enum.Link ||
                type === ContentType_Enum.LinkButton ||
                type === ContentType_Enum.PaperLink ||
                type === ContentType_Enum.VideoLink,
            `Link Item Template mistakenly used for type ${type}.`
        );

        const name =
            type === ContentType_Enum.LinkButton
                ? "Link Button"
                : type === ContentType_Enum.PaperLink
                ? "Link to paper"
                : type === ContentType_Enum.VideoLink
                ? "Link to video"
                : "Link";
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
    renderEditor: function LinkItemEditor(data, update) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            assert(
                data.item.typeName === ContentType_Enum.Link ||
                    data.item.typeName === ContentType_Enum.LinkButton ||
                    data.item.typeName === ContentType_Enum.PaperLink ||
                    data.item.typeName === ContentType_Enum.VideoLink,
                `Link Item Template mistakenly used for type ${data.type}.`
            );

            const textPlaceholder =
                data.item.typeName === ContentType_Enum.LinkButton
                    ? "Button text"
                    : data.item.typeName === ContentType_Enum.PaperLink
                    ? "Paper title"
                    : data.item.typeName === ContentType_Enum.VideoLink
                    ? "Video title"
                    : "Link title";
            const textLabel = textPlaceholder;

            const urlLabel = "URL";
            const urlPlaceholder =
                data.item.typeName === ContentType_Enum.LinkButton
                    ? "https://www.example.org"
                    : data.item.typeName === ContentType_Enum.PaperLink
                    ? "https://archive.org/..."
                    : data.item.typeName === ContentType_Enum.VideoLink
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

            const latestVersion = data.item.data.sort((x, y) => y.createdAt - x.createdAt)[0];
            assert(
                latestVersion.data.baseType === ContentBaseType.Link,
                `Link Item Template mistakenly used for base type ${latestVersion.data.baseType}.`
            );
            return (
                <>
                    <FormControl>
                        <FormLabel>{textLabel}</FormLabel>
                        <Input
                            type="text"
                            placeholder={textPlaceholder}
                            value={latestVersion.data.text}
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
                                                          text: ev.target.value,
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
    renderEditorHeading: function LinkItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.requiredItem.name}</>;
    },
};
