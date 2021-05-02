import { Textarea, useToast } from "@chakra-ui/react";
import { AbstractBlob, ElementBaseType, ElementVersionData, TextBlob } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ElementType_Enum } from "../../../../generated/graphql";
import type { ItemBaseTemplate, RenderEditorProps } from "./Types";

// TODO: Use Markdown editor instead of textarea

function createDefaultText(type: ElementType_Enum.Abstract | ElementType_Enum.Text): ElementVersionData {
    return {
        createdAt: new Date().getTime(),
        createdBy: "user",
        data: {
            type,
            baseType: ElementBaseType.Text,
            text: "",
        },
    };
}

interface TextItemVersionData {
    createdAt: number;
    createdBy: string;
    data: AbstractBlob | TextBlob;
}

export const TextItemTemplate: ItemBaseTemplate = {
    supported: true,
    createDefault: (type, required) => {
        assert(
            type === ElementType_Enum.Abstract || type === ElementType_Enum.Text,
            `Text Item Template mistakenly used for type ${type}.`
        );

        const name = type[0] + type.toLowerCase().substr(1);
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
    renderEditor: function TextItemEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [text, setText] = useState<string | null>(null);

        if (data.type === "item-only" || data.type === "required-and-item") {
            if (!(data.item.typeName === ElementType_Enum.Abstract || data.item.typeName === ElementType_Enum.Text)) {
                return <>Text Item Template mistakenly used for type {data.type}.</>;
            }

            const placeholder = data.item.typeName === ElementType_Enum.Abstract ? "Abstract" : "Text";

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

            const latestVersion = data.item.data[data.item.data.length - 1] as TextItemVersionData;
            if (latestVersion.data.baseType !== ElementBaseType.Text) {
                return <>Text Item Template mistakenly used for base type {latestVersion.data.baseType}.</>;
            }
            return (
                <Textarea
                    transition="none"
                    placeholder={placeholder}
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
                            console.error("Error saving text", e);
                            toast({
                                status: "error",
                                title: "Error saving text",
                                description: e.message,
                            });
                        }
                    }}
                />
            );
        }
        return <></>;
    },
    renderEditorHeading: function TextItemEditorHeading(data) {
        return <>{data.type === "item-only" ? data.item.name : data.uploadableItem.name}</>;
    },
};
