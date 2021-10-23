import { HStack, Link, List, ListItem, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import type { SearchPanel_PersonFragment } from "../../../../generated/graphql";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { FAIcon } from "../../../Icons/FAIcon";

export default function SearchResult_Person({ person }: { person: SearchPanel_PersonFragment }): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const shadow = useColorModeValue("md", "light-md");
    const bgColor = useColorModeValue("gray.200", "gray.600");

    return (
        <VStack
            w="100%"
            py={2}
            h="auto"
            shadow={shadow}
            bgColor={bgColor}
            justifyContent="flex-start"
            alignItems="flex-start"
            pl={4}
        >
            <Text whiteSpace="normal">
                <FAIcon iconStyle="s" icon="user" mr={2} mb={1} />
                {person.registrantId ? (
                    <>
                        <Link as={ReactLink} to={`${conferencePath}/profile/view/${person.registrantId}`}>
                            {person.name}
                            {person.affiliation ? ` (${person.affiliation})` : ""}
                        </Link>
                        <FAIcon iconStyle="s" icon="hand-pointer" ml={2} mb={1} fontSize="xs" />
                    </>
                ) : (
                    <>
                        {person.name}
                        {person.affiliation ? ` (${person.affiliation})` : ""}
                    </>
                )}
            </Text>
            {person.itemPeople.length ? (
                <List w="100%" pl={9}>
                    {person.itemPeople.map((itemPerson) => (
                        <ListItem key={itemPerson.id}>
                            <HStack alignItems="flex-start">
                                <FAIcon iconStyle="s" icon="tag" fontSize="xs" mt={1} />
                                <Link as={ReactLink} to={`${conferencePath}/item/${itemPerson.item.id}`}>
                                    {itemPerson.item.title.trim()}
                                </Link>
                            </HStack>
                        </ListItem>
                    ))}
                </List>
            ) : undefined}
        </VStack>
    );
}
