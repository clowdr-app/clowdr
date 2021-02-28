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
} from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../Icons/FAIcon";
import { ChatSpacing, findSpacing, useChatConfiguration } from "../Configuration";

export function ChatConfigurationControls({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();
    return (
        <Box {...rest}>
            <HStack spacing={config.spacing} justifyContent="flex-end">
                <ButtonGroup isAttached>
                    <Menu>
                        <MenuButton
                            colorScheme="purple"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            h="auto"
                            fontSize={config.fontSizeRange.value}
                            aria-label="Adjust spacing around chat content"
                            borderTopRadius={0}
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
                        <MenuList minW="unset">
                            <MenuOptionGroup
                                defaultValue={ChatSpacing[config.spacing]}
                                type="radio"
                                onChange={(val) => {
                                    const newVal = typeof val === "string" ? findSpacing(val) : findSpacing(val[0]);
                                    if (newVal) {
                                        config.setSpacing(newVal);
                                    }
                                }}
                            >
                                <MenuItemOption value={ChatSpacing[ChatSpacing.COMPACT]}>Compact</MenuItemOption>
                                <MenuItemOption value={ChatSpacing[ChatSpacing.COMFORTABLE]}>
                                    Comfortable
                                </MenuItemOption>
                                <MenuItemOption value={ChatSpacing[ChatSpacing.RELAXED]}>Relaxed</MenuItemOption>
                            </MenuOptionGroup>
                        </MenuList>
                    </Menu>
                    <Menu closeOnSelect={false}>
                        <MenuButton
                            colorScheme="orange"
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            h="auto"
                            fontSize={config.fontSizeRange.value}
                            aria-label="Adjust font size"
                            borderTopRadius={0}
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
                    </Menu>
                </ButtonGroup>
            </HStack>
        </Box>
    );
}
