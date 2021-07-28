import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import assert from "assert";
import React, { useMemo } from "react";
import {
    Content_ElementType_Enum,
    Content_Element_Insert_Input,
    Content_UploadableElement_Insert_Input,
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

    const menu = useMemo(
        () => (
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
                                    const newContent = template.createDefault(
                                        typeOpt.value,
                                        false,
                                        conference.id,
                                        itemId
                                    );
                                    assert(newContent.type === "element-only");
                                    const obj: Content_Element_Insert_Input = {
                                        conferenceId: conference.id,
                                        itemId,
                                        data: newContent.element.data,
                                        typeName: newContent.element.typeName,
                                        name: newContent.element.name,
                                        isHidden: newContent.element.isHidden,
                                        layoutData: {
                                            contentType: newContent.element.typeName,
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
        ),
        [contentTypeOptions, conference.id, itemId, createElement, onCreate, toast]
    );

    const uploadableMenu = useMemo(
        () => (
            <Menu size="sm">
                <MenuButton size="sm" m={1} mb={2} flex="0 0 auto" as={Button} rightIcon={<ChevronDownIcon />}>
                    Add uploadable
                </MenuButton>
                <MenuList maxH="30vh" overflowY="auto">
                    {contentTypeOptions
                        .filter(
                            (x) =>
                                x.value !== Content_ElementType_Enum.ContentGroupList &&
                                x.value !== Content_ElementType_Enum.WholeSchedule &&
                                x.value !== Content_ElementType_Enum.LiveProgramRooms &&
                                x.value !== Content_ElementType_Enum.ActiveSocialRooms &&
                                x.value !== Content_ElementType_Enum.Divider &&
                                x.value !== Content_ElementType_Enum.SponsorBooths &&
                                x.value !== Content_ElementType_Enum.ExploreProgramButton &&
                                x.value !== Content_ElementType_Enum.ExploreScheduleButton
                        )
                        .map((typeOpt) => (
                            <MenuItem
                                key={typeOpt.value}
                                onClick={async () => {
                                    try {
                                        const template = ElementBaseTemplates[ElementBaseTypes[typeOpt.value]];
                                        assert(template.supported);
                                        const newContent = template.createDefault(
                                            typeOpt.value,
                                            true,
                                            conference.id,
                                            itemId
                                        );
                                        assert(newContent.type === "required-only");
                                        const obj: Content_UploadableElement_Insert_Input = {
                                            conferenceId: conference.id,
                                            itemId,
                                            isHidden: newContent.uploadableElement.isHidden,
                                            typeName: newContent.uploadableElement.typeName,
                                            name: newContent.uploadableElement.name,
                                            uploadsRemaining: newContent.uploadableElement.uploadsRemaining,
                                        };
                                        const result = await createUploadableElement({
                                            variables: {
                                                object: obj,
                                            },
                                        });
                                        if (result.data?.insert_content_UploadableElement_one?.id) {
                                            onCreate(result.data?.insert_content_UploadableElement_one?.id);
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
        ),
        [contentTypeOptions, conference.id, itemId, onCreate, toast]
    );

    return (
        <>
            {menu}
            {uploadableMenu}
        </>
    );
}
