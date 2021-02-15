import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Flex, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useMemo } from "react";
import {
    ContentItem_Insert_Input,
    ContentType_Enum,
    useAddSponsorContentMenu_CreateContentItemMutation,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { ItemBaseTemplates } from "../Content/Templates";

gql`
    mutation AddSponsorContentMenu_CreateContentItem($object: ContentItem_insert_input!) {
        insert_ContentItem_one(object: $object) {
            id
        }
    }
`;

export function AddSponsorContentMenu({
    contentGroupId,
    refetch,
}: {
    contentGroupId: string;
    refetch: () => void;
}): JSX.Element {
    const toast = useToast();
    const conference = useConference();

    const [createItem] = useAddSponsorContentMenu_CreateContentItemMutation();

    const contentTypeOptions: { label: string; value: ContentType_Enum }[] = useMemo(
        () =>
            Object.keys(ContentType_Enum)
                .filter(
                    (key) =>
                        typeof (ContentType_Enum as any)[key] === "string" &&
                        ItemBaseTemplates[ItemBaseTypes[(ContentType_Enum as any)[key] as ContentType_Enum]].supported
                )
                .map((key) => {
                    const v = (ContentType_Enum as any)[key] as string;
                    return {
                        label: v
                            .split("_")
                            .map((x) => x[0] + x.substr(1).toLowerCase())
                            .reduce((acc, x) => `${acc} ${x}`),
                        value: v as ContentType_Enum,
                    };
                }),
        []
    );

    const menu = useMemo(
        () => (
            <Menu size="sm">
                <MenuButton m={1} flex="0 0 auto" as={Button} rightIcon={<ChevronDownIcon />}>
                    Add content
                </MenuButton>
                <MenuList maxH="20vh" overflowY="auto">
                    {contentTypeOptions.map((typeOpt) => (
                        <MenuItem
                            key={typeOpt.value}
                            onClick={async () => {
                                try {
                                    const template = ItemBaseTemplates[ItemBaseTypes[typeOpt.value]];
                                    assert(template.supported);
                                    const newContent = template.createDefault(typeOpt.value, false);
                                    assert(newContent.type === "item-only");
                                    const obj: ContentItem_Insert_Input = {
                                        conferenceId: conference.id,
                                        contentGroupId,
                                        data: newContent.item.data,
                                        contentTypeName: newContent.item.typeName,
                                        name: newContent.item.name,
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
        [conference.id, contentGroupId, contentTypeOptions, createItem, refetch, toast]
    );

    return (
        <Flex flexWrap="wrap">
            <LinkButton
                to={"todo"}
                colorScheme="green"
                mb={4}
                isExternal={true}
                aria-label={"todo"}
                title={"todo"}
                linkProps={{ flex: "0 0 auto", margin: 1 }}
            >
                <FAIcon icon="link" iconStyle="s" mr={3} />
                View sponsor
            </LinkButton>
            {menu}
        </Flex>
    );
}
