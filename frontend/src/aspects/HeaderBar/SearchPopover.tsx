import {
    Box,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Popover,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import FAIcon from "../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import { useGlobalChatState } from "../Chat/GlobalChatStateProvider";
import HeaderBarButton from "./HeaderBarButton";

export default function NotificationsPopover({
    isActive,
    setIsActive,
}: {
    isActive: boolean;
    setIsActive: (value: boolean | ((old: boolean) => boolean)) => void;
}): JSX.Element {
    // const conference = useConference();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const globalChatState = useGlobalChatState();
    globalChatState.openAnnouncements = onOpen;

    const bgColor = useColorModeValue(
        "MainMenuHeaderBar.backgroundColor-light",
        "MainMenuHeaderBar.backgroundColor-dark"
    );
    const buttonHoverBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonHoverBackgroundColor-light",
        "MainMenuHeaderBar.buttonHoverBackgroundColor-dark"
    );
    const buttonFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonFocusBackgroundColor-light",
        "MainMenuHeaderBar.buttonFocusBackgroundColor-dark"
    );
    const textColor = useColorModeValue("MainMenuHeaderBar.textColor-light", "MainMenuHeaderBar.textColor-dark");
    const menuTextColor = useColorModeValue("black", "white");

    const toggleIsActive = useCallback(() => setIsActive((old) => !old), [setIsActive]);

    const [_searchTerm, setSearchTerm] = useState<string>("");

    return (
        <Popover isLazy isOpen={isOpen} onClose={onClose} placement="bottom" offset={[0, 6]}>
            <PopoverTrigger>
                {isActive ? (
                    <InputGroup ml="auto" mr={2} maxW="30em">
                        <Input
                            w="100%"
                            autoFocus
                            aria-label="Search"
                            placeholder="Search events, people and more"
                            onChange={(ev) => {
                                setSearchTerm(ev.target.value);
                            }}
                            onKeyUp={(ev) => {
                                if (ev.key === "Escape") {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    setIsActive(false);
                                }
                            }}
                        />
                        <InputRightElement>
                            <IconButton
                                h="calc(100% - 2px)"
                                minH={0}
                                w="auto"
                                mr="1px"
                                variant="ghost"
                                aria-label="Clear search"
                                onClick={toggleIsActive}
                                icon={<FAIcon iconStyle="s" icon="times" />}
                                _hover={{
                                    bgColor: buttonHoverBgColor,
                                }}
                                _focus={{
                                    bgColor: buttonFocusBgColor,
                                    boxShadow: defaultOutline_AsBoxShadow,
                                }}
                                _active={{
                                    bgColor: buttonFocusBgColor,
                                    boxShadow: defaultOutline_AsBoxShadow,
                                }}
                            />
                        </InputRightElement>
                    </InputGroup>
                ) : (
                    <HeaderBarButton
                        label="Search"
                        iconStyle="s"
                        icon="search"
                        onClick={toggleIsActive}
                        mb={0}
                        bgColor={isOpen ? buttonFocusBgColor : undefined}
                    >
                        {isOpen ? (
                            <Box pos="absolute" bottom={0} left={0} w="100%">
                                <svg height="7" width="100%" viewBox="0 0 10 7">
                                    <polygon points="5,0 0,8 10,8" fill="white" />
                                </svg>
                            </Box>
                        ) : undefined}
                    </HeaderBarButton>
                )}
            </PopoverTrigger>
            <PopoverContent
                color={menuTextColor}
                borderColor={bgColor}
                borderRadius="2xl"
                overflow="hidden"
                minH="min(80vh - 6ex - 6px - 9px, 400px)"
                maxH="min(700px, calc(100vh - 6ex - 6px - 9px))"
                h="100%"
            >
                <PopoverHeader bgColor={bgColor} color={textColor} flex="0 0 auto">
                    100 results {/*TODO*/}
                </PopoverHeader>
                <PopoverCloseButton color={textColor} />
                <PopoverBody flex="1 1 100%" overflowX="hidden" overflowY="auto" display="flex" flexDir="column" p={0}>
                    TODO
                </PopoverBody>
                <PopoverFooter flex="0 0 auto">See more results {/*TODO*/}</PopoverFooter>
            </PopoverContent>
        </Popover>
    );
}
