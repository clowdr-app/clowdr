import { gql } from "@apollo/client";
import {
    Button,
    Divider,
    Flex,
    FormControl,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftAddon,
    Link,
    List,
    ListItem,
    Select,
    Text,
    Tooltip,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useState } from "react";
import { Link as ReactLink } from "react-router-dom";
import {
    useSearchPanel_EventsLazyQuery,
    useSearchPanel_ItemsLazyQuery,
    useSearchPanel_PeopleLazyQuery,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { EventModeIcon } from "../Rooms/V2/EventHighlight";

gql`
    fragment SearchPanel_Item on content_Item {
        id
        itemPeople(order_by: { priority: asc }) {
            id
            person {
                id
                name
                affiliation
            }
        }
        title
    }

    query SearchPanel_Items($conferenceId: uuid!, $search: String!) {
        content_Item(
            where: {
                conferenceId: { _eq: $conferenceId }
                _or: [
                    { itemExhibitions: { exhibition: { name: { _ilike: $search } } } }
                    { itemTags: { tag: { name: { _ilike: $search } } } }
                    {
                        itemPeople: {
                            person: { _or: [{ name: { _ilike: $search } }, { affiliation: { _ilike: $search } }] }
                        }
                    }
                    { title: { _ilike: $search } }
                ]
            }
        ) {
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
        }
        intendedRoomModeName
        item {
            id
            title
        }
        name
        room {
            id
            name
        }
    }

    query SearchPanel_Events($conferenceId: uuid!, $search: String!) {
        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                _or: [
                    {
                        eventPeople: {
                            person: { _or: [{ name: { _ilike: $search } }, { affiliation: { _ilike: $search } }] }
                        }
                    }
                    { exhibition: { name: { _ilike: $search } } }
                    {
                        item: {
                            _or: [
                                { title: { _ilike: $search } }
                                {
                                    itemPeople: {
                                        person: {
                                            _or: [{ name: { _ilike: $search } }, { affiliation: { _ilike: $search } }]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                    { name: { _ilike: $search } }
                ]
            }
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
        itemPeople {
            id
            item {
                id
                title
            }
        }
    }

    query SearchPanel_People($conferenceId: uuid!, $search: String!) {
        collection_ProgramPerson(
            where: {
                conferenceId: { _eq: $conferenceId }
                _or: [{ affiliation: { _ilike: $search } }, { name: { _ilike: $search } }]
            }
        ) {
            ...SearchPanel_Person
        }
    }
`;

export default function SearchPanel(): JSX.Element {
    const conference = useConference();

    const [search, setSearch] = useState<string>("");
    const [searchType, setSearchType] = useState<"events" | "items" | "people">("events");

    const [fetchEventsQuery, eventsResponse] = useSearchPanel_EventsLazyQuery();
    const [fetchItemsQuery, itemsResponse] = useSearchPanel_ItemsLazyQuery();
    const [fetchPeopleQuery, peopleResponse] = useSearchPanel_PeopleLazyQuery();

    const shadow = useColorModeValue("md", "light-md");
    const bgColor = useColorModeValue("gray.200", "gray.600");
    const now = new Date(useRealTime(60 * 1000));
    return (
        <Flex flexDir="column" spacing={4} w="100%" h="100%" alignItems="center" overflow="hidden">
            <VStack maxW={400} spacing={3}>
                <Heading as="h3" fontSize="xl">
                    Search the program
                </Heading>
                <Text whiteSpace="normal">
                    Search events, items and people by name, title, affiliation, tag, exhibition or badge.
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
                            <option value="items">Items (papers, posters, etc)</option>
                            <option value="people">People (authors / speakers)</option>
                        </Select>
                    </InputGroup>
                </FormControl>
                <Tooltip label={search.length < 3 ? "Minimum length 3" : ""}>
                    <div>
                        <Button
                            colorScheme="purple"
                            aria-label="Search"
                            isLoading={eventsResponse.loading || itemsResponse.loading || peopleResponse.loading}
                            isDisabled={search.length < 3}
                            onClick={() => {
                                switch (searchType) {
                                    case "events":
                                        fetchEventsQuery({
                                            variables: {
                                                conferenceId: conference.id,
                                                search: `%${search}%`,
                                            },
                                        });
                                        break;
                                    case "items":
                                        fetchItemsQuery({
                                            variables: {
                                                conferenceId: conference.id,
                                                search: `%${search}%`,
                                            },
                                        });
                                        break;
                                    case "people":
                                        fetchPeopleQuery({
                                            variables: {
                                                conferenceId: conference.id,
                                                search: `%${search}%`,
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
                    <Divider my={2} />
                    <List spacing={3} w="100%" overflowY="auto" flex="0 1 100%" px={2}>
                        {eventsResponse.data.schedule_Event.map((event) => (
                            <ListItem key={event.id} w="100%">
                                <LinkButton
                                    w="100%"
                                    linkProps={{
                                        w: "100%",
                                    }}
                                    py={2}
                                    h="auto"
                                    to={
                                        event.item
                                            ? `/conference/${conference.slug}/item/${event.item.id}`
                                            : `/conference/${conference.slug}/room/${event.room.id}`
                                    }
                                    shadow={shadow}
                                    size="md"
                                >
                                    <HStack w="100%" justifyContent="flex-start" alignItems="flex-start">
                                        <EventModeIcon mode={event.intendedRoomModeName} fontSize="inherit" />
                                        <VStack w="100%" justifyContent="flex-start" alignItems="flex-start">
                                            <Text whiteSpace="normal" fontSize="sm">
                                                Starts {formatRelative(new Date(event.startTime), now)}
                                            </Text>
                                            <Text whiteSpace="normal" fontSize="xs">
                                                Ends {formatRelative(new Date(event.startTime), now)}
                                            </Text>
                                            <Text whiteSpace="normal" pl={4}>
                                                {event.name}
                                                {event.item ? `: ${event.item.title}` : ""}
                                            </Text>
                                            <Text whiteSpace="normal" pl={4} fontSize="sm">
                                                In {event.room.name}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </LinkButton>
                            </ListItem>
                        ))}
                        {eventsResponse.data.schedule_Event.length === 0 ? <ListItem>No results</ListItem> : undefined}
                    </List>
                </>
            ) : undefined}
            {searchType === "items" && itemsResponse.data ? (
                <>
                    <Divider my={2} />
                    <List spacing={3} w="100%" overflowY="auto" flex="0 1 100%" px={2}>
                        {itemsResponse.data.content_Item.map((item) => (
                            <ListItem key={item.id} w="100%">
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
                                                                itemPerson.person.affiliation
                                                                    ? ` (${itemPerson.person.affiliation})`
                                                                    : ""
                                                            }`,
                                                        ""
                                                    )
                                                    .substr(2)}
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                </LinkButton>
                            </ListItem>
                        ))}
                        {itemsResponse.data.content_Item.length === 0 ? <ListItem>No results</ListItem> : undefined}
                    </List>
                </>
            ) : undefined}
            {searchType === "people" && peopleResponse.data ? (
                <>
                    <Divider my={2} />
                    <List spacing={3} w="100%" overflowY="auto" flex="0 1 100%" px={2}>
                        {peopleResponse.data.collection_ProgramPerson.map((person) => (
                            <ListItem key={person.id} w="100%">
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
                                        {person.registrantId ? (
                                            <Link
                                                as={ReactLink}
                                                to={`/conference/${conference.slug}/profile/${person.registrantId}`}
                                            >
                                                {person.name}
                                                {person.affiliation ? ` (${person.affiliation})` : ""}
                                            </Link>
                                        ) : (
                                            <>
                                                {person.name}&nbsp;
                                                {person.affiliation ? `(${person.affiliation})` : ""}
                                            </>
                                        )}
                                    </Text>
                                    {person.itemPeople.length ? (
                                        <List w="100%" pl={4}>
                                            {person.itemPeople.map((itemPerson) => (
                                                <ListItem key={itemPerson.id}>
                                                    <Link
                                                        as={ReactLink}
                                                        to={`/conference/${conference.slug}/item/${itemPerson.item.id}`}
                                                    >
                                                        {itemPerson.item.title}
                                                    </Link>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : undefined}
                                </VStack>
                            </ListItem>
                        ))}
                        {peopleResponse.data.collection_ProgramPerson.length === 0 ? (
                            <ListItem>No results</ListItem>
                        ) : undefined}
                    </List>
                </>
            ) : undefined}
        </Flex>
    );
}
