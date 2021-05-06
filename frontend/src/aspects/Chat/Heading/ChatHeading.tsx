import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    BoxProps,
    Button,
    ButtonGroup,
    HStack,
    Menu,
    MenuButton,
    MenuItem,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    Portal,
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
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    size="xs"
                                    fontSize="1em"
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
                                >
                                    <FAIcon iconStyle="s" icon="arrows-alt-v" />
                                </MenuButton>
                                <Portal>
                                    <MenuList minW="unset">
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
                                    </MenuList>
                                </Portal>
                            </Menu>
                            <Menu closeOnSelect={false}>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    size="xs"
                                    fontSize="1em"
                                    aria-label="Adjust font size"
                                    opacity={0.8}
                                    _hover={{
                                        opacity: 1,
                                    }}
                                    _focus={{
                                        opacity: 1,
                                    }}
                                    transition="opacity 0.2s ease-in-out"
                                    pb="4px"
                                >
                                    <FAIcon iconStyle="s" icon="font" />
                                </MenuButton>
                                <Portal>
                                    <MenuList minW="unset">
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
                                    </MenuList>
                                </Portal>
                            </Menu>
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
                                    colorScheme="purple"
                                    fontSize="1em"
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
                                    colorScheme="orange"
                                    fontSize="1em"
                                    m={0}
                                />
                            </ChatSubscribedQueryProvider>
                        </ButtonGroup>
                    </>
                ) : undefined}
            </HStack>
        </Box>
    );
}
