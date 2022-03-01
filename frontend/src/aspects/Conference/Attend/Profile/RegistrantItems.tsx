import { Divider, Heading, List, ListItem, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { ProfilePage_ItemFragment } from "../../../../generated/graphql";
import { useProfilePage_ItemsQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import TagList from "../Content/TagList";

export default function RegistrantItems({ registrantId }: { registrantId: string }): JSX.Element {
    const [itemsResponse] = useProfilePage_ItemsQuery({
        variables: {
            registrantId: registrantId,
        },
    });
    const items = useMemo(
        () =>
            itemsResponse.data?.content_Item.length
                ? R.groupBy<ProfilePage_ItemFragment>(
                      (x) =>
                          x.itemPeople.find((y) => y.person.registrantId === registrantId)?.roleName.toUpperCase() ??
                          "UNKNOWN",
                      R.sortBy((x) => x.title, itemsResponse.data?.content_Item)
                  )
                : undefined,
        [itemsResponse.data?.content_Item, registrantId]
    );

    return (
        <>
            {items?.PRESENTER?.length ? (
                <>
                    <Divider pt={4} />
                    <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                        Presenter of:
                    </Heading>
                    <List pt={4} spacing={3} w="100%" px={2}>
                        {items.PRESENTER.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
            {items?.AUTHOR?.length ? (
                <>
                    <Divider pt={4} />
                    <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                        Author of:
                    </Heading>
                    <List pt={4} spacing={3} w="100%" px={2}>
                        {items.AUTHOR.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
            {items?.DISCUSSANT?.length ? (
                <>
                    <Divider pt={4} />
                    <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                        Discussant of:
                    </Heading>
                    <List pt={4} spacing={3} w="100%" px={2}>
                        {items.DISCUSSANT.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
            {items?.CHAIR?.length ? (
                <>
                    <Divider pt={4} />
                    <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                        Chair of:
                    </Heading>
                    <List pt={4} spacing={3} w="100%" px={2}>
                        {items.CHAIR.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
            {items?.["SESSION ORGANIZER"]?.length ? (
                <>
                    <Divider pt={4} />
                    <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                        Session organizer of:
                    </Heading>
                    <List pt={4} spacing={3} w="100%" px={2}>
                        {items["SESSION ORGANIZER"].map((item) => (
                            <ListItem key={item.id} w="100%">
                                <Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
            {items?.UNKNOWN?.length ? (
                <>
                    <Divider pt={4} />
                    <List pt={4} spacing={3} w="100%" px={2}>
                        {items.UNKNOWN.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
        </>
    );
}

function Item({ item }: { item: ProfilePage_ItemFragment }): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const shadow = useColorModeValue("md", "light-md");

    return (
        <LinkButton
            w="100%"
            linkProps={{
                w: "100%",
            }}
            py={2}
            h="auto"
            to={`${conferencePath}/item/${item.id}`}
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
