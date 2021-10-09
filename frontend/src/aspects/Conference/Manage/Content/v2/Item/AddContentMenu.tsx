import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import assert from "assert";
import React, { useMemo } from "react";
import { gql } from "urql";
import {
    Content_ElementType_Enum,
    Content_Element_Insert_Input,
    useAddContentMenu_CreateElementMutation,
} from "../../../../../../generated/graphql";
import { useConference } from "../../../../useConference";
import { ElementBaseTemplates } from "../Element/Kinds/Templates";

gql`
    mutation AddContentMenu_CreateElement($object: content_Element_insert_input!) {
        insert_content_Element_one(object: $object) {
            ...ManageContent_Element
        }
    }
`;

export function AddContentMenu({
    itemId,
    onCreate,
}: {
    itemId: string;
    onCreate: (newId: string) => void;
}): JSX.Element {
    const toast = useToast();
    const conference = useConference();

    const [createElement] = useAddContentMenu_CreateElementMutation();

    const contentTypeOptions: { label: string; value: Content_ElementType_Enum }[] = useMemo(
        () =>
            Object.keys(Content_ElementType_Enum)
                .filter((key) => {
                    if (typeof (Content_ElementType_Enum as any)[key] === "string") {
                        const t = (Content_ElementType_Enum as any)[key] as Content_ElementType_Enum;
                        const baseT = ElementBaseTemplates[ElementBaseTypes[t]];
                        return baseT.supported && baseT.allowCreate.includes(t);
                    }
                    return false;
                })
                .map((key) => {
                    const v = (Content_ElementType_Enum as any)[key] as string;
                    return {
                        label: v
                            .split("_")
                            .map((x) => x[0] + x.substr(1).toLowerCase())
                            .reduce((acc, x) => `${acc} ${x}`),
                        value: v as Content_ElementType_Enum,
                    };
                }),
        []
    );

    return (
        <Menu size="sm">
            <MenuButton size="sm" m={1} mb={2} flex="0 0 auto" as={Button} rightIcon={<ChevronDownIcon />}>
                Add element
            </MenuButton>
            <MenuList maxH="30vh" overflowY="auto">
                {contentTypeOptions.map((typeOpt) => (
                    <MenuItem
                        key={typeOpt.value}
                        onClick={async () => {
                            try {
                                const template = ElementBaseTemplates[ElementBaseTypes[typeOpt.value]];
                                assert(template.supported);
                                const newContent = template.createDefault(typeOpt.value, conference.id, itemId);
                                const obj: Content_Element_Insert_Input = {
                                    conferenceId: conference.id,
                                    itemId,
                                    data: newContent.data,
                                    typeName: newContent.typeName,
                                    name: newContent.name,
                                    isHidden: newContent.isHidden,
                                    uploadsRemaining: newContent.uploadsRemaining,
                                    layoutData: {
                                        contentType: newContent.typeName,
                                        wide: false,
                                        hidden: false,
                                    } as LayoutDataBlob,
                                };
                                const result = await createElement({
                                    variables: {
                                        object: obj,
                                    },
                                });
                                if (result.data?.insert_content_Element_one?.id) {
                                    onCreate(result.data?.insert_content_Element_one?.id);
                                }
                            } catch (e) {
                                console.error("Could not create new ContenItem", e);
                                toast({
                                    status: "error",
                                    title: "Could not create new content",
                                    description: e.message,
                                });
                            }
                        }}
                    >
                        {typeOpt.label}
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
}
