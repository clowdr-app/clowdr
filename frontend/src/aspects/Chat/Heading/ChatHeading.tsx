import type {
    BoxProps} from "@chakra-ui/react";
import {
    Box,
    Button,
    ButtonGroup,
    HStack,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
} from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../Icons/FAIcon";
import { ChatSpacing, findSpacing, useChatConfiguration } from "../Configuration";
import { PinnedButton } from "../Pin/PinnedButton";
import { ChatPinnedQueryProvider } from "../Pin/PinnedQuery";
import { SubscribedButton } from "../Subscribe/SubscribedButton";
import { ChatSubscribedQueryProvider } from "../Subscribe/SubscribedQuery";
import { HeadingText } from "./HeadingText";

export function ChatHeading({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();

    return (
        <Box p="5px" {...rest}>
            <HStack spacing={config.spacing} overflow="hidden" alignItems="flex-start">
                {config.customHeadingElements}
                <HeadingText />
                {config.currentRegistrantId ? (
                    <>
                        <ButtonGroup isAttached borderRadius={5} overflow="hidden">
                            <ChatPinnedQueryProvider>
                                <PinnedButton
                                    opacity={0.8}
                                    _hover={{
                                        opacity: 1,
                                    }}
                                    _focus={{
                                        opacity: 1,
                                    }}
                                    transition="opacity 0.2s ease-in-out"
                                    size="xs"
                                    w="auto"
                                    h="auto"
                                    minH="100%"
                                    borderRadius="0"
                                    colorScheme="ChatPinButton"
                                    fontSize="0.8em"
                                    m={0}
                                />
                            </ChatPinnedQueryProvider>
                            <ChatSubscribedQueryProvider>
                                <SubscribedButton
                                    opacity={0.8}
                                    _hover={{
                                        opacity: 1,
                                    }}
                                    _focus={{
                                        opacity: 1,
                                    }}
                                    transition="opacity 0.2s ease-in-out"
                                    size="xs"
                                    w="auto"
                                    h="auto"
                                    minH="100%"
                                    borderRadius="0"
                                    colorScheme="ChatSubscribeButton"
                                    fontSize="0.8em"
                                    m={0}
                                />
                            </ChatSubscribedQueryProvider>
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    size="xs"
                                    fontSize="0.8em"
                                    aria-label="Adjust spacing around chat content"
                                    pb="4px"
                                    opacity={0.8}
                                    _hover={{
                                        opacity: 1,
                                    }}
                                    _focus={{
                                        opacity: 1,
                                    }}
                                    transition="opacity 0.2s ease-in-out"
                                    colorScheme="ChatSettingsButton"
                                >
                                    <FAIcon iconStyle="s" icon="cog" mt={1} />
                                </MenuButton>
                                <MenuList fontSize="sm" minW="unset" zIndex={1000}>
                                    <MenuOptionGroup
                                        defaultValue={ChatSpacing[config.spacing]}
                                        type="radio"
                                        onChange={(val) => {
                                            const newVal =
                                                typeof val === "string" ? findSpacing(val) : findSpacing(val[0]);
                                            if (newVal) {
                                                config.setSpacing(newVal);
                                            }
                                        }}
                                        title="Spacing"
                                    >
                                        <MenuItemOption value={ChatSpacing[ChatSpacing.COMPACT]}>
                                            Compact
                                        </MenuItemOption>
                                        <MenuItemOption value={ChatSpacing[ChatSpacing.COMFORTABLE]}>
                                            Comfortable
                                        </MenuItemOption>
                                        <MenuItemOption value={ChatSpacing[ChatSpacing.RELAXED]}>
                                            Relaxed
                                        </MenuItemOption>
                                    </MenuOptionGroup>
                                    <MenuDivider />
                                    <MenuOptionGroup title="Font size">
                                        <MenuItem
                                            onClick={() => {
                                                config.setFontSize((old) => old + 2);
                                            }}
                                            isDisabled={config.fontSizeRange.value >= (config.fontSizeRange.max ?? 16)}
                                        >
                                            <FAIcon iconStyle="s" icon="plus" mr={2} />
                                            Increase
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                config.setFontSize((old) => old - 2);
                                            }}
                                            isDisabled={config.fontSizeRange.value <= (config.fontSizeRange.min ?? 16)}
                                        >
                                            <FAIcon iconStyle="s" icon="minus" mr={2} />
                                            Decrease
                                        </MenuItem>
                                    </MenuOptionGroup>
                                </MenuList>
                            </Menu>
                        </ButtonGroup>
                    </>
                ) : undefined}
            </HStack>
        </Box>
    );
}
