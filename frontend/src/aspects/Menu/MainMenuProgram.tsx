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
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useState } from "react";
import { Twemoji } from "react-emoji-render";
import {
    MenuSchedule_EventFragment,
    useMenuScheduleQuery,
    useMenuSchedule_SearchEventsLazyQuery,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { useConference } from "../Conference/useConference";
import useDebouncedState from "../CRUDTable/useDebouncedState";
import usePolling from "../Generic/usePolling";
import ApolloQueryWrapper from "../GQL/ApolloQueryWrapper";
import { FAIcon } from "../Icons/FAIcon";

gql`
    query MenuSchedule(
        $now: timestamptz!
        $inThreeMinutes: timestamptz!
        $in30Minutes: timestamptz!
        $inOneHour: timestamptz!
        $conferenceId: uuid!
    ) {
        eventsNow: Event(
            where: {
                startTime: { _lte: $inThreeMinutes }
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
            }
        ) {
            ...MenuSchedule_Event
        }

        eventsIn30mins: Event(
            where: { startTime: { _gt: $inThreeMinutes, _lte: $in30Minutes }, conferenceId: { _eq: $conferenceId } }
        ) {
            ...MenuSchedule_Event
        }

        eventsIn1Hour: Event(
            where: { startTime: { _gt: $in30Minutes, _lte: $inOneHour }, conferenceId: { _eq: $conferenceId } }
        ) {
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
                                { title: { _ilike: $search } }
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
        contentGroup {
            id
            title
        }
    }
`;

export function MainMenuProgram(): JSX.Element {
    const conference = useConference();
    const [now, setNow] = useState<Date>(new Date());
    const [inThreeMinutes, setInThreeMinutes] = useState<Date>(new Date(Date.now() + 3 * 60 * 1000));
    const [in30Minutes, setIn30Minutes] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
    const [inOneHour, setInOneHour] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
    const updateTimes = useCallback(() => {
        setNow(new Date());
        setInThreeMinutes(new Date(Date.now() + 3 * 60 * 1000));
        setIn30Minutes(new Date(Date.now() + 30 * 60 * 1000));
        setInOneHour(new Date(Date.now() + 60 * 60 * 1000));
    }, []);
    usePolling(updateTimes, 60000, true);

    const scheduleResult = useMenuScheduleQuery({
        variables: {
            conferenceId: conference.id,
            now,
            inThreeMinutes,
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

    const resultCountStr = `Showing ${
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
                <FormLabel textAlign="center" fontSize="sm">
                    {resultCountStr}
                </FormLabel>
                <InputGroup size="sm">
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
                            <MainMenuProgramInner
                                linkToRoom={false}
                                events={events}
                                title="Search results"
                                showTime={true}
                            />
                        )}
                    </ApolloQueryWrapper>
                </>
            ) : (
                <>
                    <ApolloQueryWrapper getter={(data) => data.eventsNow} queryResult={scheduleResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner linkToRoom={true} events={events} title="Happening now" />
                        )}
                    </ApolloQueryWrapper>
                    <ApolloQueryWrapper getter={(data) => data.eventsIn30mins} queryResult={scheduleResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner
                                linkToRoom={false}
                                events={events}
                                title="Starting in the next 30 minutes"
                            />
                        )}
                    </ApolloQueryWrapper>
                    <ApolloQueryWrapper getter={(data) => data.eventsIn1Hour} queryResult={scheduleResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <MainMenuProgramInner
                                linkToRoom={false}
                                events={events}
                                title="Starting in the next hour"
                            />
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
    linkToRoom,
}: {
    events: readonly MenuSchedule_EventFragment[];
    title: string;
    showTime?: boolean;
    linkToRoom: boolean;
}): JSX.Element {
    const conference = useConference();

    return (
        <Box width="100%">
            <Heading as="h4" size="sm" mt={4} mb={2} textAlign="left" fontSize="sm">
                {title}
            </Heading>
            {events.length > 0 ? (
                <List>
                    {R.sortBy((e) => e.startTime, events).map((event) => {
                        const eventName =
                            event.name.length > 0 && event.contentGroup
                                ? event.name + ": " + event.contentGroup.title
                                : event.contentGroup
                                ? event.contentGroup.title
                                : event.name;

                        return (
                            <ListItem key={event.id} width="100%" my={2}>
                                {showTime ? (
                                    <Text fontSize="sm" mb={1} mt={2}>
                                        {formatRelative(Date.parse(event.startTime), new Date())}
                                    </Text>
                                ) : undefined}
                                <LinkButton
                                    to={
                                        linkToRoom
                                            ? `/conference/${conference.slug}/room/${event.room.id}`
                                            : event.contentGroup
                                            ? `/conference/${conference.slug}/item/${event.contentGroup.id}`
                                            : `/conference/${conference.slug}/room/${event.room.id}`
                                    }
                                    width="100%"
                                    linkProps={{ width: "100%" }}
                                    h="auto"
                                    py={2}
                                    size="sm"
                                >
                                    <HStack width="100%" justifyContent="space-between">
                                        <Text flex="0 1 1" overflow="hidden" title={eventName} whiteSpace="normal">
                                            <Twemoji className="twemoji" text={eventName} />
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
                        );
                    })}
                </List>
            ) : (
                <>No events.</>
            )}
        </Box>
    );
}
