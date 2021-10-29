import {
    Box,
    FormControl,
    FormHelperText,
    Heading,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    List,
    ListItem,
    Text,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import { useClient } from "urql";
import type {
    MenuSchedule_EventFragment,
    MenuSchedule_SearchEventsQuery,
    MenuSchedule_SearchEventsQueryVariables,
} from "../../../../generated/graphql";
import { MenuSchedule_SearchEventsDocument, useMenuScheduleQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useConference } from "../../../Conference/useConference";
import useDebouncedState from "../../../CRUDTable/useDebouncedState";
import usePolling from "../../../Generic/usePolling";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";

gql`
    query MenuSchedule($now: timestamptz!, $inOneHour: timestamptz!, $conferenceId: uuid!) {
        schedule_Event(
            where: {
                startTime: { _lte: $inOneHour }
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                room: {}
            }
        ) {
            ...MenuSchedule_Event
        }
    }

    query MenuSchedule_SearchEvents($conferenceId: uuid!, $search: String!) {
        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                room: {}
                _or: [
                    { name: { _ilike: $search } }
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
                    {
                        eventPeople: {
                            person: { _or: [{ name: { _ilike: $search } }, { affiliation: { _ilike: $search } }] }
                        }
                    }
                ]
            }
            limit: 10
            order_by: { startTime: asc }
        ) {
            ...MenuSchedule_Event
        }
    }

    fragment MenuSchedule_Event on schedule_Event {
        id
        conferenceId
        name
        startTime
        roomId
        room {
            id
            name
        }
        itemId
        item {
            id
            title
        }
    }
`;

type FilterTimes = {
    now: Date;
    inThreeMinutes: Date;
    in30Minutes: Date;
    inOneHour: Date;
};

type Times = {
    now: Date;
    inOneHour: Date;
};

function makeFilterTimes(): FilterTimes {
    return {
        now: new Date(),
        inThreeMinutes: new Date(Date.now() + 3 * 60 * 1000),
        in30Minutes: new Date(Date.now() + 30 * 60 * 1000),
        inOneHour: new Date(Date.now() + 60 * 60 * 1000),
    };
}

function makeTimes(): Times {
    return {
        now: new Date(Date.now()),
        inOneHour: new Date(Date.now() + 60 * 60 * 1000),
    };
}

export function MainMenuProgram(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();

    const [times, setTimes] = useState<Times>(makeTimes());
    const updateTimes = useCallback(() => setTimes(makeTimes()), [setTimes]);
    usePolling(updateTimes, 180000, true);

    const [scheduleResult] = useMenuScheduleQuery({
        variables: {
            conferenceId: conference.id,
            now: times.now,
            inOneHour: times.inOneHour,
        },
    });

    const [filterTimes, setFilterTimes] = useState<FilterTimes>(makeFilterTimes());
    const updateFilterTimes = useCallback(() => {
        setFilterTimes(makeFilterTimes());
    }, [setFilterTimes]);
    usePolling(updateFilterTimes, 10000, true);

    const [search, debouncedSearch, setSearch] = useDebouncedState<string>("", 1000);

    const [searchResult, setSearchResult] = useState<MenuSchedule_SearchEventsQuery | null>(null);

    const client = useClient();
    useEffect(() => {
        if (debouncedSearch.length) {
            (async () => {
                const result = await client
                    .query<MenuSchedule_SearchEventsQuery, MenuSchedule_SearchEventsQueryVariables>(
                        MenuSchedule_SearchEventsDocument,
                        {
                            conferenceId: conference.id,
                            search: `%${debouncedSearch}%`,
                        }
                    )
                    .toPromise();
                setSearchResult(result.data ?? null);
            })();
        }
    }, [debouncedSearch, client, conference.id]);

    const resultCountStr = `Showing ${
        debouncedSearch.length > 0 ? searchResult?.schedule_Event.length ?? 0 : "upcoming"
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
                <FormHelperText>Search by title, author, affiliation, etc.</FormHelperText>
            </FormControl>
            {debouncedSearch.length > 0 ? (
                searchResult?.schedule_Event.length ? (
                    <MainMenuProgramInner
                        linkToRoom={false}
                        events={searchResult.schedule_Event}
                        fromMillis={0}
                        toMillis={Number.MAX_SAFE_INTEGER}
                        title="Search results"
                        showTime={true}
                    />
                ) : (
                    <Text mb={2}>No results</Text>
                )
            ) : (
                <>
                    <QueryWrapper getter={(data) => data.schedule_Event} queryResult={scheduleResult}>
                        {(events: readonly MenuSchedule_EventFragment[]) => (
                            <>
                                <MainMenuProgramInner
                                    linkToRoom={true}
                                    fromMillis={0}
                                    toMillis={filterTimes.inThreeMinutes.getTime()}
                                    events={events}
                                    title="Happening now"
                                />
                                <MainMenuProgramInner
                                    linkToRoom={true}
                                    fromMillis={filterTimes.inThreeMinutes.getTime()}
                                    toMillis={filterTimes.in30Minutes.getTime()}
                                    events={events}
                                    title="In the next 30 minutes"
                                />
                                <MainMenuProgramInner
                                    linkToRoom={true}
                                    fromMillis={filterTimes.in30Minutes.getTime()}
                                    toMillis={filterTimes.inOneHour.getTime()}
                                    events={events}
                                    title="In the next hour"
                                />
                            </>
                        )}
                    </QueryWrapper>
                </>
            )}
            <LinkButton
                linkProps={{ w: "100%", mt: 2 }}
                size="sm"
                to={`${conferencePath}/schedule`}
                width="100%"
                colorScheme="pink"
            >
                <FAIcon icon="calendar" iconStyle="r" mr={3} />
                Whole Schedule
            </LinkButton>
        </>
    );
}

export function MainMenuProgramInner({
    events,
    title,
    fromMillis,
    toMillis,
    showTime,
    linkToRoom,
}: {
    events: readonly MenuSchedule_EventFragment[];
    title: string;
    showTime?: boolean;
    linkToRoom: boolean;
    fromMillis: number;
    toMillis: number;
}): JSX.Element {
    const filteredEvents = useMemo(
        () =>
            R.sortBy((e) => e.startTime, events).filter((event) => {
                const startTime = Date.parse(event.startTime);
                return startTime >= fromMillis && startTime < toMillis;
            }),
        [events, fromMillis, toMillis]
    );
    const { conferencePath } = useAuthParameters();

    return filteredEvents.length > 0 ? (
        <Box width="100%">
            <Heading as="h4" size="sm" mt={4} mb={2} textAlign="left" fontSize="sm">
                {title}
            </Heading>
            <List>
                {filteredEvents.map((event) => {
                    const eventName =
                        event.name.length > 0 && event.item
                            ? event.name + ": " + event.item.title
                            : event.item
                            ? event.item.title
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
                                        ? `${conferencePath}/room/${event.room.id}`
                                        : event.item
                                        ? `${conferencePath}/item/${event.item.id}`
                                        : `${conferencePath}/room/${event.room.id}`
                                }
                                width="100%"
                                linkProps={{ width: "100%" }}
                                h="auto"
                                py={2}
                                size="sm"
                            >
                                <Text flex="0 1 1" overflow="hidden" title={eventName} whiteSpace="normal">
                                    <Twemoji className="twemoji" text={eventName} />
                                </Text>
                            </LinkButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    ) : (
        <></>
    );
}
