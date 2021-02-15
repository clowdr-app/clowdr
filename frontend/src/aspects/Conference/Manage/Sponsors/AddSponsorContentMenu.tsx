import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Flex, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import { ContentType_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { ItemBaseTemplates } from "../Content/Templates";

export function AddSponsorContentMenu(): JSX.Element {
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
                            onClick={() => {
                                //todo
                            }}
                        >
                            {typeOpt.label}
                        </MenuItem>
                    ))}
                </MenuList>
            </Menu>
        ),
        [contentTypeOptions]
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
