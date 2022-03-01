import { Heading, IconButton, Input, InputGroup, InputRightElement, Spinner, Text, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import FAIcon from "../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import { useConference } from "../Conference/useConference";
import { useRestorableState } from "../Hooks/useRestorableState";
import { useTitle } from "../Hooks/useTitle";
import SearchResults from "./SearchResults";

export default function SearchPage({ searchTerm: overrideSearchTerm }: { searchTerm?: string }): JSX.Element {
    const conference = useConference();

    const [searchTerm, setSearchTerm] = useRestorableState<string>(
        `SearchTerm:${conference.id}`,
        "",
        (x) => x,
        (x) => x
    );
    const [numResults, setNumResults] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    useEffect(() => {
        if (overrideSearchTerm?.length) {
            setSearchTerm(overrideSearchTerm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overrideSearchTerm]);

    const title = useTitle("Search");

    return (
        <VStack spacing={4} w="100%" px={[2, 2, 4]} py={[0, 0, 2]} alignItems="flex-start">
            {title}
            <Heading as="h1">Search</Heading>
            <InputGroup ml="auto" mr={2} maxW="30em">
                <Input
                    w="100%"
                    autoFocus
                    aria-label="Search"
                    placeholder="Search events, people and more"
                    value={searchTerm}
                    onChange={(ev) => {
                        setSearchTerm(ev.target.value);
                    }}
                    onKeyUp={(ev) => {
                        if (ev.key === "Escape") {
                            ev.preventDefault();
                            ev.stopPropagation();
                            setSearchTerm("");
                        }
                    }}
                />
                <InputRightElement>
                    <IconButton
                        h="calc(100% - 1px)"
                        minH={0}
                        w="auto"
                        mr="1px"
                        variant="ghost"
                        aria-label="Clear search"
                        onClick={() => {
                            setSearchTerm("");
                        }}
                        icon={!isSearching ? <FAIcon iconStyle="s" icon="times" /> : <Spinner />}
                        color="inherit"
                        _hover={{
                            bgColor: "PrimaryActionButton.700",
                            color: "PrimaryActionButton.textColor",
                        }}
                        _focus={{
                            bgColor: "PrimaryActionButton.600",
                            color: "PrimaryActionButton.textColor",
                            boxShadow: defaultOutline_AsBoxShadow,
                        }}
                        _active={{
                            bgColor: "PrimaryActionButton.500",
                            color: "PrimaryActionButton.textColor",
                            boxShadow: defaultOutline_AsBoxShadow,
                        }}
                    />
                </InputRightElement>
            </InputGroup>
            <Text>{numResults !== null ? `${numResults} results` : "Searching…"}</Text>
            <SearchResults
                search={searchTerm}
                setNumberOfResults={setNumResults}
                isActive
                setIsSearching={setIsSearching}
                limit={10}
            />
        </VStack>
    );
}
