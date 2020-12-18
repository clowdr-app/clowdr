import { Textarea } from "@chakra-ui/react";
import { ContentBaseType, ContentItemVersionData } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate } from "./Types";

// TODO: Use Markdown editor instead of textarea

function createDefaultText(
    type: ContentType_Enum.Abstract | ContentType_Enum.Text
): ContentItemVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ContentBaseType.Text,
            text: "",
        },
    };
}

export const TextItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (group, type, required) => {
        assert(
            type === ContentType_Enum.Abstract || type === ContentType_Enum.Text,
            `Text Item Template mistakenly used for type ${type}.`
        );

        const name = type[0] + type.toLowerCase().substr(1);
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
    renderEditor: function TextItemEditor(data, update) {
        if (data.type === "item-only" || data.type === "required-and-item") {
            assert(
                data.item.typeName === ContentType_Enum.Abstract || data.item.typeName === ContentType_Enum.Text,
                `Text Item Template mistakenly used for type ${data.type}.`
            );

            const placeholder = data.item.typeName === ContentType_Enum.Abstract ? "Abstract" : "Text";

            if (data.item.data.length === 0) {
                data = {
                    ...data,
                    item: {
                        ...data.item,
                        data: [createDefaultText(data.item.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.item.data[data.item.data.length - 1];
            assert(
                latestVersion.data.baseType === ContentBaseType.Text,
                `Text Item Template mistakenly used for base type ${latestVersion.data.baseType}.`
            );
            return (
                <Textarea
                    placeholder={placeholder}
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
            );
        }
        return <></>;
    },
    renderEditorHeading: function TextItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.requiredItem.name}</>;
    },
};
