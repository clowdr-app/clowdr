import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import React, { useMemo } from "react";
import {
    Content_ElementType_Enum,
    Content_Element_Insert_Input,
    useAddSponsorContentMenu_CreateElementMutation,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { CreateRoomButton } from "../Content/CreateRoomButton";
import { ElementBaseTemplates } from "../Content/Templates";

gql`
    mutation AddSponsorContentMenu_CreateElement($object: content_Element_insert_input!) {
        insert_content_Element_one(object: $object) {
            id
        }
    }
`;

export function AddSponsorContentMenu({
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

    const [createItem] = useAddSponsorContentMenu_CreateElementMutation();

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
        <Flex flexWrap="wrap">
            <LinkButton
                to={
                    roomId
                        ? `/conference/${conference.slug}/room/${roomId}`
                        : `/conference/${conference.slug}/item/${itemId}`
                }
                colorScheme="green"
                mb={4}
                isExternal={true}
                aria-label={"View sponsor"}
                title={"View sponsor"}
                linkProps={{ flex: "0 0 auto", margin: 1 }}
            >
                <FAIcon icon="link" iconStyle="s" mr={3} />
                View sponsor {roomId ? "booth" : "(no booth)"}
            </LinkButton>
            {!roomId ? (
                <Box mt={1}>
                    <CreateRoomButton itemId={itemId} buttonText="Create booth (room)" />
                </Box>
            ) : undefined}
            {menu}
        </Flex>
    );
}
