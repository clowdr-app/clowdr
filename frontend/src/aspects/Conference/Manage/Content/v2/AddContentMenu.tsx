import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useMemo } from "react";
import {
    Content_ElementType_Enum,
    Content_Element_Insert_Input,
    useAddContentMenu_CreateElementMutation,
} from "../../../../../generated/graphql";
import { useConference } from "../../../useConference";
import { CreateRoomButton } from "../CreateRoomButton";
import { ElementBaseTemplates } from "../Templates";

gql`
    mutation AddContentMenu_CreateElement($object: content_Element_insert_input!) {
        insert_content_Element_one(object: $object) {
            id
        }
    }
`;

export function AddContentMenu({
    itemId,
    roomId,
    refetch,
}: {
    itemId: string;
    roomId: string | null;
    refetch: () => void;
}): JSX.Element {
    const toast = useToast();
    const conference = useConference();

    const [createItem] = useAddContentMenu_CreateElementMutation();

    const contentTypeOptions: { label: string; value: Content_ElementType_Enum }[] = useMemo(
        () =>
            Object.keys(Content_ElementType_Enum)
                .filter(
                    (key) =>
                        typeof (Content_ElementType_Enum as any)[key] === "string" &&
                        ElementBaseTemplates[
                            ElementBaseTypes[(Content_ElementType_Enum as any)[key] as Content_ElementType_Enum]
                        ].supported
                )
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

    // TODO: Add uploadable menu
    const menu = useMemo(
        () => (
            <Menu size="sm">
                <MenuButton size="sm" m={1} mb={2} flex="0 0 auto" as={Button} rightIcon={<ChevronDownIcon />}>
                    Add content
                </MenuButton>
                <MenuList maxH="20vh" overflowY="auto">
                    {contentTypeOptions.map((typeOpt) => (
                        <MenuItem
                            key={typeOpt.value}
                            onClick={async () => {
                                try {
                                    const template = ElementBaseTemplates[ElementBaseTypes[typeOpt.value]];
                                    assert(template.supported);
                                    const newContent = template.createDefault(typeOpt.value, false);
                                    assert(newContent.type === "element-only");
                                    const obj: Content_Element_Insert_Input = {
                                        conferenceId: conference.id,
                                        itemId,
                                        data: newContent.element.data,
                                        typeName: newContent.element.typeName,
                                        name: newContent.element.name,
                                    };
                                    await createItem({
                                        variables: {
                                            object: obj,
                                        },
                                    });
                                    refetch();
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
        ),
        [conference.id, itemId, contentTypeOptions, createItem, refetch, toast]
    );

    return (
        <>
            {!roomId ? <CreateRoomButton size="sm" itemId={itemId} refetch={refetch} /> : undefined}
            {menu}
        </>
    );
}
