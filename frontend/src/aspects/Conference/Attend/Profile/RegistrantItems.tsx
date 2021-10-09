import { Divider, Heading, List, ListItem } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { SearchPanel_ItemFragment, useProfilePage_ItemsQuery } from "../../../../generated/graphql";
import SearchResult_Item from "../Search/SearchResult_Item";

export default function RegistrantItems({ registrantId }: { registrantId: string }): JSX.Element {
    const [itemsResponse] = useProfilePage_ItemsQuery({
        variables: {
            registrantId: registrantId,
        },
    });
    const items = useMemo(
        () =>
            itemsResponse.data?.content_Item.length
                ? R.groupBy<SearchPanel_ItemFragment>(
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
                                <SearchResult_Item item={item} />
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
                                <SearchResult_Item item={item} />
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
                                <SearchResult_Item item={item} />
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
                                <SearchResult_Item item={item} />
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
                                <SearchResult_Item item={item} />
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
                                <SearchResult_Item item={item} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : undefined}
        </>
    );
}
