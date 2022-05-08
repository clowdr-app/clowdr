import { Box, Divider, HStack, Image, List, ListItem, Text, VStack } from "@chakra-ui/react";
import { formatRelative } from "date-fns/esm";
import * as R from "ramda";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import type { OperationResult } from "urql";
import { gql, useClient } from "urql";
import type { SearchAllQuery, SearchAllQueryVariables } from "../../generated/graphql";
import { SearchAllDocument } from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import CreateDMButton from "../Conference/Attend/Registrant/CreateDMButton";
import { useConference } from "../Conference/useConference";
import { useAuthParameters } from "../GQL/AuthParameters";

gql`
    fragment SearchedItemPerson on content_ItemProgramPerson {
        id
        itemId
        personId
        priority
        roleName
        person {
            ...SearchedPerson_Reduced
        }
    }

    fragment SearchedItem on content_Item {
        id
        title
        conferenceId
        itemPeople(
            where: { roleName: { _neq: "REVIEWER" } }
            order_by: [{ priority: asc }, { person: { name: asc } }]
        ) {
            ...SearchedItemPerson
        }
    }

    fragment SearchedEvent on schedule_Event {
        id
        conferenceId
        name
        itemId
        scheduledStartTime
        scheduledEndTime
        roomId
        roomName
    }

    fragment SearchedPerson_Reduced on collection_ProgramPerson {
        id
        conferenceId
        name
    }

    fragment SearchedPerson on collection_ProgramPerson {
        id
        conferenceId
        name
        affiliation
        registrant {
            id
            profile {
                registrantId
                photoURL_50x50
            }
        }
    }

    fragment SearchedRegistrant on registrant_Registrant {
        id
        displayName
        profile {
            registrantId
            affiliation
            photoURL_50x50
        }
    }

    query SearchAll($conferenceId: uuid!, $search: String!, $limit: Int!, $offset: Int!) @cached {
        content_searchItems(args: { conferenceId: $conferenceId, search: $search }, limit: $limit, offset: $offset) {
            ...SearchedItem
        }
        schedule_searchEvents(args: { conferenceId: $conferenceId, search: $search }, limit: $limit, offset: $offset) {
            ...SearchedEvent
        }
        collection_searchProgramPerson(
            args: { conferenceid: $conferenceId, subconferenceid: null, search: $search }
            limit: $limit
            offset: $offset
            where: { registrantId: { _is_null: false } }
        ) {
            ...SearchedPerson
        }
        registrant_searchRegistrants(
            args: { conferenceid: $conferenceId, search: $search }
            limit: $limit
            offset: $offset
        ) {
            ...SearchedRegistrant
        }
    }
`;

export default function SearchResults({
    search: externalSearchTerm,
    limit = 3,
    offset = 0,
    setNumberOfResults,
    isActive,
    setIsActive,
    setIsSearching,
}: {
    search: string;
    limit?: number;
    offset?: number;
    setNumberOfResults: (count: number | null) => void;
    isActive: boolean;
    setIsActive?: (value: boolean | ((old: boolean) => boolean)) => void;
    setIsSearching: (value: boolean) => void;
}): JSX.Element {
    const [search, setSearch] = useState<string>(externalSearchTerm);
    useEffect(() => {
        const tId = setTimeout(() => {
            setSearch(externalSearchTerm);
        }, 500);
        return () => {
            clearTimeout(tId);
        };
    }, [externalSearchTerm]);

    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const [searchResponse, setSearchResponse] = useState<OperationResult<
        SearchAllQuery,
        SearchAllQueryVariables
    > | null>(null);
    const gqlClient = useClient();
    const [fetching, setFetching] = useState<boolean>(false);
    useEffect(() => {
        let cancelled = false;
        if (isActive && search.length >= 3) {
            setIsSearching(true);
            setFetching(true);

            (async () => {
                const response = await gqlClient
                    .query<SearchAllQuery, SearchAllQueryVariables>(SearchAllDocument, {
                        conferenceId: conference.id,
                        search,
                        limit,
                        offset,
                    })
                    .toPromise();
                if (!cancelled) {
                    setSearchResponse(response);
                    setFetching(false);
                    setIsSearching(false);
                }
            })();
        } else {
            setIsSearching(false);
            setFetching(false);
        }

        return () => {
            cancelled = true;
        };
    }, [conference.id, gqlClient, isActive, limit, offset, search, setIsSearching]);

    const data = searchResponse?.data;
    const error = searchResponse?.error;

    const events = useMemo(() => data?.schedule_searchEvents ?? [], [data?.schedule_searchEvents]);
    const items = useMemo(
        () => data?.content_searchItems.filter((x) => !events.some((y) => y.itemId === x.id)) ?? [],
        [data?.content_searchItems, events]
    );
    const people = useMemo(() => {
        const input = data?.collection_searchProgramPerson ?? [];
        return R.sortBy(
            (x) => input.indexOf(x),
            [
                ...input.filter((x) => !x.registrant),
                ...R.uniqBy(
                    (x) => x.registrant?.id,
                    input.filter((x) => !!x.registrant)
                ),
            ]
        );
    }, [data?.collection_searchProgramPerson]);
    const registrants = useMemo(() => {
        const input = data?.registrant_searchRegistrants ?? [];
        return input.filter((x) => !people.some((y) => x.id === y.registrant?.id));
    }, [data?.registrant_searchRegistrants, people]);

    useEffect(() => {
        setNumberOfResults(
            error || fetching || !data ? null : events.length + items.length + people.length + registrants.length
        );
    }, [data, error, events.length, fetching, items.length, people.length, registrants.length, setNumberOfResults]);

    // TODO: Display tags on stuff
    // TODO: Filter by tags

    return fetching ? (
        <></>
    ) : error ? (
        <Box>Sorry, an error has occurred. Please try again later.</Box>
    ) : (
        <List spacing={0}>
            {events.map((event) => {
                const now = Date.now();
                const start = event.scheduledStartTime ? Date.parse(event.scheduledStartTime) : undefined;
                const end = event.scheduledEndTime ? Date.parse(event.scheduledEndTime) : undefined;
                const inPast = end && end <= now;
                const ongoing = start && end && start <= now && now < end;
                return (
                    <Fragment key={event.id}>
                        <ListItem p="3px">
                            <LinkButton
                                to={
                                    ongoing || !event.itemId
                                        ? `${conferencePath}/room/${event.roomId}`
                                        : `${conferencePath}/item/${event.itemId}`
                                }
                                px={2}
                                py={2}
                                h="auto"
                                maxH="auto"
                                minH={0}
                                fontWeight="normal"
                                w="100%"
                                variant="ghost"
                                linkProps={{ w: "100%" }}
                            >
                                <VStack alignItems="flex-start" spacing={1} w="100%">
                                    <Text fontSize="sm" whiteSpace="normal">
                                        {start && end
                                            ? inPast
                                                ? `Ended ${formatRelative(end, now)}`
                                                : ongoing
                                                ? "Happening now"
                                                : `Starts ${formatRelative(start, now)}`
                                            : "Takes place"}{" "}
                                        in {event.roomName}
                                    </Text>
                                    <Text fontSize="lg" whiteSpace="normal">
                                        {event.name}
                                    </Text>
                                </VStack>
                            </LinkButton>
                        </ListItem>
                        <Divider />
                    </Fragment>
                );
            })}
            {items.map((item) => (
                <Fragment key={item.id}>
                    <ListItem p="3px">
                        <LinkButton
                            to={`${conferencePath}/item/${item.id}`}
                            px={2}
                            py={2}
                            h="auto"
                            maxH="auto"
                            minH={0}
                            fontWeight="normal"
                            w="100%"
                            variant="ghost"
                            linkProps={{ w: "100%" }}
                        >
                            <VStack alignItems="flex-start" spacing={1} w="100%">
                                <Text fontSize="lg" whiteSpace="normal">
                                    {item.title}
                                </Text>
                                <Text fontSize="sm" whiteSpace="normal">
                                    {item.itemPeople.reduce((acc, x) => acc + ", " + x.person.name, "").substring(2)}
                                </Text>
                            </VStack>
                        </LinkButton>
                    </ListItem>
                    <Divider />
                </Fragment>
            ))}
            {people.map((person) => (
                <ListItem key={person.id}>
                    <Fragment key={person.id}>
                        <ListItem p="3px">
                            <LinkButton
                                to={person.registrant ? `${conferencePath}/profile/view/${person.registrant?.id}` : ""}
                                px={2}
                                py={2}
                                h="auto"
                                maxH="auto"
                                minH={0}
                                fontWeight="normal"
                                w="100%"
                                variant="ghost"
                                linkProps={{ w: "100%" }}
                            >
                                <HStack alignItems="flex-start" spacing={3} w="100%">
                                    {person.registrant?.profile?.photoURL_50x50 ? (
                                        <Image
                                            title="Profile photo"
                                            src={person.registrant.profile.photoURL_50x50}
                                            w="50px"
                                            h="50px"
                                            borderRadius="2xl"
                                        />
                                    ) : undefined}
                                    <VStack alignItems="flex-start" spacing={1} w="100%" pt={1}>
                                        <Text fontSize="lg" whiteSpace="normal">
                                            {person.name}
                                        </Text>
                                        {person.affiliation ? (
                                            <Text fontSize="sm" whiteSpace="normal">
                                                {person.affiliation}
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                    {person.registrant ? (
                                        <CreateDMButton
                                            registrantId={person.registrant?.id}
                                            onCreate={() => setIsActive?.(false)}
                                        />
                                    ) : undefined}
                                </HStack>
                            </LinkButton>
                        </ListItem>
                        <Divider />
                    </Fragment>
                </ListItem>
            ))}
            {registrants.map((registrant) => (
                <ListItem key={registrant.id}>
                    <Fragment key={registrant.id}>
                        <ListItem p="3px">
                            <LinkButton
                                to={`${conferencePath}/profile/view/${registrant.id}`}
                                px={2}
                                py={2}
                                h="auto"
                                maxH="auto"
                                minH={0}
                                fontWeight="normal"
                                w="100%"
                                variant="ghost"
                                linkProps={{ w: "100%" }}
                            >
                                <HStack alignItems="flex-start" spacing={3} w="100%">
                                    {registrant?.profile?.photoURL_50x50 ? (
                                        <Image
                                            title="Profile photo"
                                            src={registrant.profile.photoURL_50x50}
                                            w="50px"
                                            h="50px"
                                            borderRadius="2xl"
                                        />
                                    ) : undefined}
                                    <VStack alignItems="flex-start" spacing={1} w="100%" pt={1}>
                                        <Text fontSize="lg" whiteSpace="normal">
                                            {registrant.displayName}
                                        </Text>
                                        {registrant.profile?.affiliation?.length ? (
                                            <Text fontSize="sm" whiteSpace="normal">
                                                {registrant.profile.affiliation}
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                    <CreateDMButton
                                        registrantId={registrant.id}
                                        onCreate={() => setIsActive?.(false)}
                                    />
                                </HStack>
                            </LinkButton>
                        </ListItem>
                        <Divider />
                    </Fragment>
                </ListItem>
            ))}
        </List>
    );
}
