import { Textarea, useToast } from "@chakra-ui/react";
import { AbstractBlob, ElementBaseType, ElementVersionData, TextBlob } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

// TODO: Use Markdown editor instead of textarea

function createDefaultText(
    type: Content_ElementType_Enum.Abstract | Content_ElementType_Enum.Text
): ElementVersionData {
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

interface TextElementVersionData {
    createdAt: number;
    createdBy: string;
    data: AbstractBlob | TextBlob;
}

export const TextElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Text],
    createDefault: (type, conferenceId, itemId) => {
        assert(
            type === Content_ElementType_Enum.Abstract || type === Content_ElementType_Enum.Text,
            `Text Element Template mistakenly used for type ${type}.`
        );

        const name = type[0] + type.toLowerCase().substr(1);
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
    renderEditor: function TextElementEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [text, setText] = useState<string | null>(null);

        if (!(data.typeName === Content_ElementType_Enum.Abstract || data.typeName === Content_ElementType_Enum.Text)) {
            return <>Text Element Template mistakenly used for type {data.typeName}.</>;
        }

        const placeholder = data.typeName === Content_ElementType_Enum.Abstract ? "Abstract" : "Text";

        if (data.data.length === 0) {
            data = {
                ...data,
                data: [createDefaultText(data.typeName)],
            };
            setTimeout(() => update(data), 0);
        }

        const latestVersion = data.data[data.data.length - 1] as TextElementVersionData;
        if (latestVersion.data.baseType !== ElementBaseType.Text) {
            return <>Text Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
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
                        if (ev.target.value === latestVersion.data.text) {
                            return;
                        }
                        const oldElementIdx = data.data.indexOf(latestVersion);
                        const newData = {
                            ...data,
                            data: data.data.map((version, idx) => {
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
    },
    renderEditorHeading: function TextElementEditorHeading(data) {
        return <>{data.name}</>;
    },
};
