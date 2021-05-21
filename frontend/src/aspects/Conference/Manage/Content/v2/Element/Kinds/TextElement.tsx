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
    createDefault: (type, required, conferenceId, itemId) => {
        assert(
            type === Content_ElementType_Enum.Abstract || type === Content_ElementType_Enum.Text,
            `Text Element Template mistakenly used for type ${type}.`
        );

        const name = type[0] + type.toLowerCase().substr(1);
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
    renderEditor: function TextElementEditor({ data, update }: RenderEditorProps) {
        const toast = useToast();
        const [text, setText] = useState<string | null>(null);

        if (data.type === "element-only" || data.type === "required-and-element") {
            if (
                !(
                    data.element.typeName === Content_ElementType_Enum.Abstract ||
                    data.element.typeName === Content_ElementType_Enum.Text
                )
            ) {
                return <>Text Element Template mistakenly used for type {data.type}.</>;
            }

            const placeholder = data.element.typeName === Content_ElementType_Enum.Abstract ? "Abstract" : "Text";

            if (data.element.data.length === 0) {
                data = {
                    ...data,
                    element: {
                        ...data.element,
                        data: [createDefaultText(data.element.typeName)],
                    },
                };
                setTimeout(() => update(data), 0);
            }

            const latestVersion = data.element.data[data.element.data.length - 1] as TextElementVersionData;
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
        return data.uploadableElement.hasBeenUploaded ? (
            <>Text has been uploaded but you do not have permission to view it.</>
        ) : (
            <>No text uploaded yet.</>
        );
    },
    renderEditorHeading: function TextElementEditorHeading(data) {
        return <>{data.type === "element-only" ? data.element.name : data.uploadableElement.name}</>;
    },
};
