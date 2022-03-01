import {
    Box,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Spinner,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FAIcon from "../Chakra/FAIcon";
import { LinkButton } from "../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import { useConference } from "../Conference/useConference";
import { useAuthParameters } from "../GQL/AuthParameters";
import HeaderBarButton from "../HeaderBar/HeaderBarButton";
import { useRestorableState } from "../Hooks/useRestorableState";
import SearchResults from "./SearchResults";

export default function SearchPopover({
    isActive,
    setIsActive,
}: {
    isActive: boolean;
    setIsActive: (value: boolean | ((old: boolean) => boolean)) => void;
}): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();

    const { isOpen, onOpen, onClose } = useDisclosure();

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

    const [searchTerm, setSearchTerm] = useRestorableState<string>(
        `SearchTerm:${conference.id}`,
        "",
        (x) => x,
        (x) => x
    );
    const [numResults, setNumResults] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    useEffect(() => {
        if (!isActive) {
            onClose();
            if (searchTerm.length === 0) {
                setNumResults(null);
            }
        } else if (numResults !== null) {
            onOpen();
        }
    }, [isActive, numResults, onClose, onOpen, searchTerm.length]);

    const location = useLocation();
    useEffect(() => {
        setIsActive(false);
    }, [location, setIsActive]);

    return (
        <Popover
            isLazy
            isOpen={isOpen}
            onClose={onClose}
            placement="bottom-start"
            offset={[0, 6]}
            autoFocus={false}
            matchWidth
        >
            <PopoverTrigger>
                {isActive ? (
                    <InputGroup ml="auto" mr={2} maxW="30em">
                        <Input
                            w="100%"
                            autoFocus
                            aria-label="Search"
                            placeholder="Search events, people and more"
                            value={searchTerm}
                            onChange={(ev) => {
                                setSearchTerm(ev.target.value);
                                onOpen();
                            }}
                            onKeyUp={(ev) => {
                                if (ev.key === "Escape") {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    if (searchTerm.length > 0) {
                                        setSearchTerm("");
                                    } else {
                                        setIsActive(false);
                                    }
                                } else if (ev.key === "Enter" && searchTerm.length > 0) {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    onOpen();
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
                                icon={!isSearching ? <FAIcon iconStyle="s" icon="times" /> : <Spinner />}
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
                maxH="min(500px, calc(100vh - 6ex - 6px - 9px))"
                h="100%"
                w="inherit"
            >
                <PopoverHeader bgColor={bgColor} color={textColor} flex="0 0 auto">
                    {numResults !== null ? `${numResults} results` : "Searching…"}
                </PopoverHeader>
                <PopoverBody flex="1 1 100%" overflowX="hidden" overflowY="auto" display="flex" flexDir="column" p={0}>
                    <SearchResults
                        search={searchTerm}
                        setNumberOfResults={setNumResults}
                        isActive={isActive}
                        setIsActive={setIsActive}
                        setIsSearching={setIsSearching}
                    />
                </PopoverBody>
                <PopoverFooter flex="0 0 auto">
                    <LinkButton to={`${conferencePath}/search/${encodeURIComponent(searchTerm)}`} size="xs">
                        See more results
                    </LinkButton>
                </PopoverFooter>
            </PopoverContent>
        </Popover>
    );
}
