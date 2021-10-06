import { gql } from "@apollo/client";
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
import React, { MutableRefObject } from "react";
import {
    useSearchPanel_EventsLazyQuery,
    useSearchPanel_ItemsLazyQuery,
    useSearchPanel_PeopleLazyQuery,
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
        exhibition {
            id
            name
            items {
                id
                item {
                    ...SearchPanel_Item
                }
            }
        }
        intendedRoomModeName
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

    const [fetchEventsQuery, eventsResponse] = useSearchPanel_EventsLazyQuery();
    const [fetchItemsQuery, itemsResponse] = useSearchPanel_ItemsLazyQuery();
    const [fetchPeopleQuery, peopleResponse] = useSearchPanel_PeopleLazyQuery();

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
                            isLoading={eventsResponse.loading || itemsResponse.loading || peopleResponse.loading}
                            isDisabled={search.length < 3 || true}
                            onClick={() => {
                                switch (searchType) {
                                    case "events":
                                        fetchEventsQuery({
                                            variables: {
                                                conferenceId: conference.id,
                                                search: `${search}`,
                                            },
                                        });
                                        break;
                                    case "items":
                                        fetchItemsQuery({
                                            variables: {
                                                conferenceId: conference.id,
                                                search: `${search}`,
                                            },
                                        });
                                        break;
                                    case "people":
                                        fetchPeopleQuery({
                                            variables: {
                                                conferenceId: conference.id,
                                                search: `${search}`,
                                            },
                                        });
                                        break;
                                }
                            }}
                        >
                            <FAIcon iconStyle="s" icon="search" />
                            &nbsp;&nbsp;
                            {eventsResponse.data || itemsResponse.data || peopleResponse.data
                                ? "Search again"
                                : "Search"}
                        </Button>
                    </div>
                </Tooltip>
            </VStack>

            {searchType === "events" && eventsResponse.data ? (
                <>
                    <Divider my={4} />
                    <Text w="auto" textAlign="left" p={0} mb={4}>
                        <FAIcon iconStyle="s" icon="clock" mr={2} mb={1} />
                        Times are shown in your local timezone.
                    </Text>
                    <List spacing={3} w="100%" px={2}>
                        {eventsResponse.data.schedule_searchEvents.map((event) => (
                            <ListItem key={event.id} w="100%">
                                <SearchResult_Event event={event} />
                            </ListItem>
                        ))}
                        {eventsResponse.data.schedule_searchEvents.length === 0 ? (
                            <ListItem>No results</ListItem>
                        ) : undefined}
                    </List>
                </>
            ) : undefined}
            {searchType === "items" && itemsResponse.data ? (
                <>
                    <Divider my={2} />
                    <List spacing={3} w="100%" px={2}>
                        {itemsResponse.data.content_searchItems.map((item) => (
                            <ListItem key={item.id} w="100%">
                                <SearchResult_Item item={item} />
                            </ListItem>
                        ))}
                        {itemsResponse.data.content_searchItems.length === 0 ? (
                            <ListItem>No results</ListItem>
                        ) : undefined}
                    </List>
                </>
            ) : undefined}
            {searchType === "people" && peopleResponse.data ? (
                <>
                    <Divider my={2} />
                    <List spacing={3} w="100%" overflowY="auto" flex="0 1 100%" px={2}>
                        {peopleResponse.data.collection_searchProgramPerson.map((person) => (
                            <ListItem key={person.id} w="100%">
                                <SearchResult_Person person={person} />
                            </ListItem>
                        ))}
                        {peopleResponse.data.collection_searchProgramPerson.length === 0 ? (
                            <ListItem>No results</ListItem>
                        ) : undefined}
                    </List>
                </>
            ) : undefined}
        </Flex>
    );
}
