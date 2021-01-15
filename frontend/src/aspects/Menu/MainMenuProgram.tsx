import { gql } from "@apollo/client";
import {
    Badge,
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    List,
    ListItem,
    Text,
} from "@chakra-ui/react";
import { formatRFC7231 } from "date-fns";
import React, { useEffect, useState } from "react";
import {
    MenuSchedule_EventFragment,
    useMenuSchedule_CurrentEventsQuery,
    useMenuSchedule_EventsIn30MinutesQuery,
    useMenuSchedule_EventsInOneHourQuery,
    useMenuSchedule_SearchEventsLazyQuery,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { useConference } from "../Conference/useConference";
import useDebouncedState from "../CRUDTable/useDebouncedState";
import usePolling from "../Generic/usePolling";
import ApolloQueryWrapper from "../GQL/ApolloQueryWrapper";
import { FAIcon } from "../Icons/FAIcon";

gql`
    query MenuSchedule_CurrentEvents($now: timestamptz!, $conferenceId: uuid!) {
        Event(where: { startTime: { _lte: $now }, endTime: { _gte: $now }, conferenceId: { _eq: $conferenceId } }) {
            ...MenuSchedule_Event
        }
    }

    query MenuSchedule_EventsIn30Minutes($now: timestamptz!, $in30Minutes: timestamptz!, $conferenceId: uuid!) {
        Event(where: { startTime: { _gt: $now, _lte: $in30Minutes }, conferenceId: { _eq: $conferenceId } }) {
            ...MenuSchedule_Event
        }
    }

    query MenuSchedule_EventsInOneHour($in30Minutes: timestamptz!, $inOneHour: timestamptz!, $conferenceId: uuid!) {
        Event(where: { startTime: { _gt: $in30Minutes, _lte: $inOneHour }, conferenceId: { _eq: $conferenceId } }) {
            ...MenuSchedule_Event
        }
    }

    query MenuSchedule_SearchEvents($conferenceId: uuid!, $search: String!) {
        Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                _or: [
                    { name: { _ilike: $search } }
                    {
                        contentGroup: {
                            _or: [
                                { title: { _like: $search } }
                                {
                                    people: {
                                        person: {
                                            _or: [{ name: { _ilike: $search } }, { affiliation: { _ilike: $search } }]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                    { eventPeople: { attendee: { displayName: { _ilike: $search } } } }
                    { eventTags: { tag: { name: { _ilike: $search } } } }
                ]
            }
            limit: 10
            order_by: { startTime: asc }
        ) {
            ...MenuSchedule_Event
        }
    }

    fragment MenuSchedule_Event on Event {
        id
        name
        startTime
        room {
            id
            name
        }
        eventTags {
            tag {
                id
                colour
                name
            }
        }
    }
`;

export function MainMenuProgram(): JSX.Element {
    const conference = useConference();
    const [now, setNow] = useState<Date>(new Date());
    const [in30Minutes, setIn30Minutes] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
    const [inOneHour, setInOneHour] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
    usePolling(
        () => {
            setNow(new Date());
            setIn30Minutes(new Date(Date.now() + 30 * 60 * 1000));
            setInOneHour(new Date(Date.now() + 60 * 60 * 1000));
        },
        60000,
        true
    );

    const currentResult = useMenuSchedule_CurrentEventsQuery({
        variables: {
            conferenceId: conference.id,
            now,
        },
    });

    const in30MinutesResult = useMenuSchedule_EventsIn30MinutesQuery({
        variables: {
            conferenceId: conference.id,
            now,
            in30Minutes,
        },
    });

    const inOneHourResult = useMenuSchedule_EventsInOneHourQuery({
        variables: {
            conferenceId: conference.id,
            in30Minutes,
            inOneHour,
        },
    });

    const [search, debouncedSearch, setSearch] = useDebouncedState<string>("", 1000);

    const [performSearch, searchResult] = useMenuSchedule_SearchEventsLazyQuery({
        variables: {
            conferenceId: conference.id,
            search: `%${debouncedSearch}%`,
        },
    });

    useEffect(() => {
        if (debouncedSearch.length) performSearch();
    }, [debouncedSearch, performSearch]);

    const resultCountStr = `showing ${
        debouncedSearch.length > 0 ? searchResult.data?.Event.length ?? 0 : "upcoming"
    } events`;
    const [ariaSearchResultStr, setAriaSearchResultStr] = useState<string>(resultCountStr);
    useEffect(() => {
        const tId = setTimeout(() => {
            setAriaSearchResultStr(resultCountStr);
        }, 250);
        return () => {
            clearTimeout(tId);
        };
    }, [resultCountStr]);

    return (
        <>
            <FormControl mb={4} maxW={400}>
                <FormLabel mt={4} textAlign="center">
                    {resultCountStr}
                </FormLabel>
                <InputGroup>
                    <InputLeftAddon aria-hidden>Search</InputLeftAddon>
                    <Input
                        aria-label={"Search found " + ariaSearchResultStr}
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(ev) => {
                            setSearch(ev.target.value);
                        }}
                    />
                    <InputRightElement>
                        <FAIcon iconStyle="s" icon="search" />
                    </InputRightElement>
                </InputGroup>
                <FormHelperText>Search for an event.</FormHelperText>
            </FormControl>
            {debouncedSearch.length > 0 ? (
                <>
                    <ApolloQueryWrapper getter={(data) => data.Event} queryResult={searchResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner events={events} title="Search results" showTime={true} />
                        )}
                    </ApolloQueryWrapper>
                </>
            ) : (
                <>
                    <ApolloQueryWrapper getter={(data) => data.Event} queryResult={currentResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner events={events} title="Happening now" />
                        )}
                    </ApolloQueryWrapper>
                    <ApolloQueryWrapper getter={(data) => data.Event} queryResult={in30MinutesResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner events={events} title="Starting in the next 30 minutes" />
                        )}
                    </ApolloQueryWrapper>
                    <ApolloQueryWrapper getter={(data) => data.Event} queryResult={inOneHourResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner events={events} title="Starting in the next hour" />
                        )}
                    </ApolloQueryWrapper>
                </>
            )}
        </>
    );
}

export function MainMenuProgramInner({
    events,
    title,
    showTime,
}: {
    events: readonly MenuSchedule_EventFragment[];
    title: string;
    showTime?: boolean;
}): JSX.Element {
    const conference = useConference();

    return (
        <Box width="100%">
            <Heading as="h4" size="sm" mt={4} mb={2} textAlign="left">
                {title}
            </Heading>
            {events.length > 0 ? (
                <List>
                    {events.map((event) => (
                        <ListItem key={event.id} width="100%" my={2}>
                            {showTime ? (
                                <Text fontSize="sm" mb={1} mt={2}>
                                    {formatRFC7231(Date.parse(event.startTime))}
                                </Text>
                            ) : undefined}
                            <LinkButton
                                to={`/conference/${conference.slug}/room/${event.room.id}`}
                                width="100%"
                                linkProps={{ width: "100%" }}
                            >
                                <HStack width="100%" justifyContent="space-between">
                                    <Text
                                        flex="0 1 1"
                                        overflow="hidden"
                                        title={event.name}
                                        whiteSpace="nowrap"
                                        textOverflow="ellipsis"
                                    >
                                        {event.name}
                                    </Text>
                                    <Text flex="0 1 1">
                                        {event.eventTags.map((tag) => (
                                            <Badge
                                                key={tag.tag.id}
                                                color="gray.50"
                                                backgroundColor={tag.tag.colour}
                                                ml={1}
                                                p={1}
                                                borderRadius={4}
                                            >
                                                {tag.tag.name}
                                            </Badge>
                                        ))}
                                    </Text>
                                </HStack>
                            </LinkButton>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <>No events.</>
            )}
        </Box>
    );
}
