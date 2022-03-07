import {
    Button,
    FormControl,
    FormHelperText,
    Heading,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    Spinner,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useClient } from "urql";
import type { SearchRegistrantsQuery, SearchRegistrantsQueryVariables } from "../../../../generated/graphql";
import { SearchRegistrantsDocument, useSelectRegistrantsQuery } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import type { Registrant } from "../../useCurrentRegistrant";
import RegistrantsList from "./RegistrantsList";

gql`
    query SelectRegistrants($conferenceId: uuid!) @cached {
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId } }, order_by: { displayName: asc }) {
            ...RegistrantData
        }
    }

    query SearchRegistrants($conferenceId: uuid!, $search: String!) @cached {
        registrant_searchRegistrants(args: { conferenceid: $conferenceId, search: $search }, limit: 10) {
            ...RegistrantData
        }
    }
`;

export function AllRegistrantsList(): JSX.Element {
    const [search, setSearch] = useState<string>("");

    const conference = useConference();

    const [{ fetching: loadingRegistrants, error: errorRegistrants, data: dataRegistrants }] =
        useSelectRegistrantsQuery({
            variables: {
                conferenceId: conference.id,
            },
        });
    useQueryErrorToast(errorRegistrants, false, "RegistrantListPage.tsx -- registrants");

    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(true);
    const [loadedCount, setLoadedCount] = useState<number>(30);

    const allRegistrants = useMemo(() => {
        if ((loadingRegistrants && !dataRegistrants) || errorRegistrants) {
            return undefined;
        }

        if (!dataRegistrants) {
            return [];
        }

        return dataRegistrants?.registrant_Registrant.filter((x) => !!x.profile && !!x.userId) as Registrant[];
    }, [dataRegistrants, errorRegistrants, loadingRegistrants]);

    const [registrants, setRegistrants] = useState<Registrant[] | null>(null);
    const [searched, setSearched] = useState<Registrant[] | null>(null);
    const [allSearched, setAllSearched] = useState<Registrant[] | null>(null);

    useEffect(() => {
        setRegistrants(allRegistrants?.slice(0, loadedCount) ?? null);
        setIsLoadingMore(false);
    }, [allRegistrants, loadedCount]);

    useEffect(() => {
        setSearched(allSearched?.slice(0, loadedCount) ?? null);
        setIsLoadingMore(false);
    }, [allSearched, loadedCount]);

    const client = useClient();
    const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
    useEffect(() => {
        const tId = setTimeout(async () => {
            if (search.length >= 3) {
                const doSearch = async () => {
                    setLoadingSearch(true);
                    const { data: dataSearch, error: errorSearch } = await client
                        .query<SearchRegistrantsQuery, SearchRegistrantsQueryVariables>(SearchRegistrantsDocument, {
                            conferenceId: conference.id,
                            search: `%${search}%`,
                        })
                        .toPromise();
                    setLoadingSearch(false);

                    if (!dataSearch || errorSearch) {
                        return undefined;
                    }

                    if (!dataSearch) {
                        return undefined;
                    }

                    return dataSearch.registrant_searchRegistrants.filter(
                        (x) => !!x.profile && !!x.userId
                    ) as Registrant[];
                };

                setLoadedCount(30);
                const results = await doSearch();
                setAllSearched((oldSearched) => results ?? oldSearched ?? null);
            } else {
                setAllSearched(null);
            }
        }, 750);
        return () => {
            clearTimeout(tId);
        };
    }, [conference.id, search, client]);

    const loadMore = useCallback(() => {
        setIsLoadingMore(true);
        setLoadedCount(loadedCount + 30);
    }, [loadedCount]);

    return (
        <>
            <FormControl maxW={400}>
                <InputGroup>
                    <InputLeftAddon as="label" id="registrants-search">
                        Search
                    </InputLeftAddon>
                    <Input
                        aria-labelledby="registrants-search"
                        value={search}
                        onChange={(ev) => setSearch(ev.target.value)}
                        placeholder="Type to search"
                    />
                    <InputRightElement>
                        {loadingSearch ? <Spinner /> : <FAIcon iconStyle="s" icon="search" />}
                    </InputRightElement>
                </InputGroup>
                <FormHelperText>Search badges, names, affiliations and bios. (Min length 3)</FormHelperText>
            </FormControl>
            <RegistrantsList
                allRegistrants={registrants ?? undefined}
                searchedRegistrants={searched && search.length > 0 ? searched : undefined}
                loadMore={loadMore}
                moreAvailable={
                    !!allRegistrants &&
                    loadedCount < ((search.length > 0 ? searched?.length : undefined) ?? allRegistrants.length)
                }
            />
            {allRegistrants &&
            loadedCount < ((search.length > 0 ? searched?.length : undefined) ?? allRegistrants.length) ? (
                <Button isLoading={isLoadingMore} onClick={loadMore} py={2}>
                    <FAIcon iconStyle="s" icon="chevron-down" mr={2} />
                    Load more
                </Button>
            ) : (
                <></>
            )}
        </>
    );
}

export default function RegistrantListPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`People at ${conference.shortName}`);

    return (
        <>
            {title}
            <Heading as="h1" id="page-heading">
                People
            </Heading>
            <AllRegistrantsList />
        </>
    );
}
