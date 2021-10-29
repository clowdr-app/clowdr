import {
    Button,
    Divider,
    Flex,
    FormControl,
    Heading,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    List,
    ListItem,
    Select,
    Text,
    Tooltip,
    VStack,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import type { MutableRefObject } from "react";
import React, { useState } from "react";
import { useClient } from "urql";
import type {
    SearchPanel_EventsQuery,
    SearchPanel_EventsQueryVariables,
    SearchPanel_ItemsQuery,
    SearchPanel_ItemsQueryVariables,
    SearchPanel_PeopleQuery,
    SearchPanel_PeopleQueryVariables,
} from "../../../../generated/graphql";
import {
    SearchPanel_EventsDocument,
    SearchPanel_ItemsDocument,
    SearchPanel_PeopleDocument,
} from "../../../../generated/graphql";
import { useRestorableState } from "../../../Generic/useRestorableState";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import SearchResult_Event from "./SearchResult_Event";
import SearchResult_Item from "./SearchResult_Item";
import SearchResult_Person from "./SearchResult_Person";

gql`
    fragment SearchPanel_Item on content_Item {
        id
        title
        conferenceId
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            ...ProgramPersonData
        }
        itemTags {
            ...ItemTagData
        }
    }

    query SearchPanel_Items($conferenceId: uuid!, $search: String!) {
        content_searchItems(args: { conferenceId: $conferenceId, search: $search }) {
            ...SearchPanel_Item
        }
    }

    fragment SearchPanel_Event on schedule_Event {
        id
        startTime
        endTime
        conferenceId
        exhibitionId
        exhibition {
            id
            name
            items {
                id
                itemId
                exhibitionId
                item {
                    ...SearchPanel_Item
                }
            }
        }
        intendedRoomModeName
        itemId
        item {
            ...SearchPanel_Item
        }
        name
        roomId
        room {
            id
            name
        }
    }

    query SearchPanel_Events($conferenceId: uuid!, $search: String!) {
        schedule_searchEvents(
            args: { conferenceId: $conferenceId, search: $search }
            order_by: [{ startTime: asc }, { endTime: asc }, { room: { name: asc } }]
        ) {
            ...SearchPanel_Event
        }
    }

    fragment SearchPanel_Person on collection_ProgramPerson {
        id
        name
        affiliation
        registrantId
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
            id
            item {
                id
                title
            }
        }
    }

    query SearchPanel_People($conferenceId: uuid!, $search: String!) {
        collection_searchProgramPerson(args: { search: $search, conferenceid: $conferenceId }) {
            ...SearchPanel_Person
        }
    }
`;

export default function SearchPanel({
    changeSearch,
}: {
    changeSearch?: MutableRefObject<null | ((term: string) => void)>;
}): JSX.Element {
    const conference = useConference();

    const [search, setSearch] = useRestorableState<string>(
        "SearchPanel_Search" + conference.id,
        "",
        (x) => x,
        (x) => x
    );
    const [searchType, setSearchType] = useRestorableState<"events" | "items" | "people">(
        "SearchPanel_SearchType" + conference.id,
        "events",
        (x) => x,
        (x) => x as any
    );
    if (changeSearch) {
        changeSearch.current = setSearch;
    }

    const [eventsResponse, setEventsResponse] = useState<SearchPanel_EventsQuery | null>(null);
    const [itemsResponse, setItemsResponse] = useState<SearchPanel_ItemsQuery | null>(null);
    const [peopleResponse, setPeopleResponse] = useState<SearchPanel_PeopleQuery | null>(null);

    const [eventsResponseLoading, setEventsResponseLoading] = useState<boolean>(false);
    const [itemsResponseLoading, setItemsResponseLoading] = useState<boolean>(false);
    const [peopleResponseLoading, setPeopleResponseLoading] = useState<boolean>(false);

    const client = useClient();

    return (
        <Flex flexDir="column" spacing={4} w="100%" h="100%" alignItems="center">
            <VStack maxW={400} spacing={3}>
                <Heading as="h3" fontSize="xl">
                    Search
                </Heading>
                <Text whiteSpace="normal">
                    Search the schedule, content and people by name, title, affiliation, tag, exhibition or badge.
                </Text>
                <FormControl>
                    <InputGroup>
                        <InputLeftAddon>Search</InputLeftAddon>
                        <Input
                            value={search}
                            onChange={(ev) => {
                                setSearch(ev.target.value);
                            }}
                        />
                        <InputRightElement
                            as={Button}
                            variant="ghost"
                            ml={1}
                            fontSize="sm"
                            onClick={() => {
                                setSearch("");
                            }}
                            isDisabled={search === ""}
                        >
                            <FAIcon iconStyle="s" icon="times-circle" />
                        </InputRightElement>
                    </InputGroup>
                </FormControl>
                <FormControl>
                    <InputGroup>
                        <InputLeftAddon>Type</InputLeftAddon>
                        <Select
                            value={searchType}
                            onChange={(ev) => {
                                setSearchType(ev.target.value as any);
                            }}
                        >
                            <option value="events">Events</option>
                            <option value="items">Content (papers, posters, etc)</option>
                            <option value="people">People (authors / presenters)</option>
                        </Select>
                    </InputGroup>
                </FormControl>
                <Tooltip label={search.length < 3 ? "Minimum length 3" : ""}>
                    <div>
                        <Button
                            colorScheme="PrimaryActionButton"
                            aria-label="Search"
                            isLoading={eventsResponseLoading || itemsResponseLoading || peopleResponseLoading}
                            isDisabled={search.length < 3}
                            onClick={async () => {
                                switch (searchType) {
                                    case "events":
                                        {
                                            setEventsResponseLoading(true);
                                            const result =
                                                (
                                                    await client
                                                        .query<
                                                            SearchPanel_EventsQuery,
                                                            SearchPanel_EventsQueryVariables
                                                        >(SearchPanel_EventsDocument, {
                                                            conferenceId: conference.id,
                                                            search: `${search}`,
                                                        })
                                                        .toPromise()
                                                )?.data ?? null;
                                            setEventsResponse(result);
                                            setEventsResponseLoading(false);
                                        }
                                        break;
                                    case "items":
                                        {
                                            setItemsResponseLoading(true);
                                            const result =
                                                (
                                                    await client
                                                        .query<SearchPanel_ItemsQuery, SearchPanel_ItemsQueryVariables>(
                                                            SearchPanel_ItemsDocument,
                                                            {
                                                                conferenceId: conference.id,
                                                                search: `${search}`,
                                                            }
                                                        )
                                                        .toPromise()
                                                )?.data ?? null;
                                            setItemsResponse(result);
                                            setItemsResponseLoading(false);
                                        }
                                        break;
                                    case "people":
                                        {
                                            setPeopleResponseLoading(true);
                                            const result =
                                                (
                                                    await client
                                                        .query<
                                                            SearchPanel_PeopleQuery,
                                                            SearchPanel_PeopleQueryVariables
                                                        >(SearchPanel_PeopleDocument, {
                                                            conferenceId: conference.id,
                                                            search: `${search}`,
                                                        })
                                                        .toPromise()
                                                )?.data ?? null;
                                            setPeopleResponse(result);
                                            setPeopleResponseLoading(false);
                                        }
                                        break;
                                }
                            }}
                        >
                            <FAIcon iconStyle="s" icon="search" />
                            &nbsp;&nbsp;
                            {eventsResponse || itemsResponse || peopleResponse ? "Search again" : "Search"}
                        </Button>
                    </div>
                </Tooltip>
            </VStack>

            {searchType === "events" && eventsResponse ? (
                <>
                    <Divider my={4} />
                    <Text w="auto" textAlign="left" p={0} mb={4}>
                        <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                        Times are shown in your local timezone.
                    </Text>
                    <List spacing={3} w="100%" px={2}>
                        {eventsResponse.schedule_searchEvents.map((event) => (
                            <ListItem key={event.id} w="100%">
                                <SearchResult_Event event={event} />
                            </ListItem>
                        ))}
                        {eventsResponse.schedule_searchEvents.length === 0 ? (
                            <ListItem>No results</ListItem>
                        ) : undefined}
                    </List>
                </>
            ) : undefined}
            {searchType === "items" && itemsResponse ? (
                <>
                    <Divider my={2} />
                    <List spacing={3} w="100%" px={2}>
                        {itemsResponse.content_searchItems.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <SearchResult_Item item={item} />
                            </ListItem>
                        ))}
                        {itemsResponse.content_searchItems.length === 0 ? <ListItem>No results</ListItem> : undefined}
                    </List>
                </>
            ) : undefined}
            {searchType === "people" && peopleResponse ? (
                <>
                    <Divider my={2} />
                    <List spacing={3} w="100%" overflowY="auto" flex="0 1 100%" px={2}>
                        {peopleResponse.collection_searchProgramPerson.map((person) => (
                            <ListItem key={person.id} w="100%">
                                <SearchResult_Person person={person} />
                            </ListItem>
                        ))}
                        {peopleResponse.collection_searchProgramPerson.length === 0 ? (
                            <ListItem>No results</ListItem>
                        ) : undefined}
                    </List>
                </>
            ) : undefined}
        </Flex>
    );
}
