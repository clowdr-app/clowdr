import { Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import type { SearchPanel_ItemFragment } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useConference } from "../../useConference";
import TagList from "../Content/TagList";

export default function SearchResult_Item({ item }: { item: SearchPanel_ItemFragment }): JSX.Element {
    const conference = useConference();
    const shadow = useColorModeValue("md", "light-md");

    return (
        <LinkButton
            w="100%"
            linkProps={{
                w: "100%",
            }}
            py={2}
            h="auto"
            to={`/conference/${conference.slug}/item/${item.id}`}
            shadow={shadow}
            size="md"
        >
            <VStack w="100%" justifyContent="flex-start" alignItems="flex-start">
                <Text whiteSpace="normal" w="100%">
                    {item.title}
                </Text>
                {item.itemPeople.length ? (
                    <Text pl={4} fontSize="xs" whiteSpace="normal" w="100%">
                        {item.itemPeople
                            .reduce<string>(
                                (acc, itemPerson) =>
                                    `${acc}, ${itemPerson.person.name} ${
                                        itemPerson.person.affiliation ? ` (${itemPerson.person.affiliation})` : ""
                                    }`,
                                ""
                            )
                            .substr(2)}
                    </Text>
                ) : undefined}
                <TagList pl={4} tags={item.itemTags} noClick />
            </VStack>
        </LinkButton>
    );
}
