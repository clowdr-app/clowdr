import { Textarea, useToast } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import type { AbstractBlob, TextBlob } from "@midspace/shared-types/content";
import { ElementBaseType } from "@midspace/shared-types/content";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Content_ElementType_Enum } from "../../../../../../../generated/graphql";
import type { ElementBaseTemplate, RenderEditorProps } from "./Types";

// TODO: Use Markdown editor instead of textarea

interface TextElementVersionData {
    createdAt: number;
    createdBy: string;
    data: AbstractBlob | TextBlob;
}

export const TextElementTemplate: ElementBaseTemplate = {
    supported: true,
    allowCreate: [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Text],
    createDefault: (type, conferenceId, subconferenceId, itemId) => {
        assert.truthy(
            type === Content_ElementType_Enum.Abstract || type === Content_ElementType_Enum.Text,
            `Text Element Template mistakenly used for type ${type}.`
        );

        const name = type[0] + type.toLowerCase().substr(1);
        return {
            __typename: "content_Element",
            updatedAt: new Date().toISOString(),
            conferenceId,
            subconferenceId,
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

        const latestVersion = data.data[data.data.length - 1] as TextElementVersionData;
        if (latestVersion && latestVersion.data.baseType !== ElementBaseType.Text) {
            return <>Text Element Template mistakenly used for base type {latestVersion.data.baseType}.</>;
        }

        return (
            <Textarea
                transition="none"
                placeholder={placeholder}
                value={text ?? latestVersion?.data.text ?? ""}
                onChange={(ev) => {
                    setText(ev.target.value);
                }}
                onBlur={(ev) => {
                    try {
                        if (ev.target.value === latestVersion?.data.text) {
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
                                                  baseType: ElementBaseType.Text,
                                                  type: data.typeName,
                                                  text: ev.target.value,
                                              },
                                          } as TextElementVersionData,
                                      ]
                                    : data.data.map((version, idx) => {
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
                    } catch (e: any) {
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
