import { gql } from "@apollo/client";
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
    Text,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchRegistrantsLazyQuery, useSelectRegistrantsQuery } from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import type { Registrant } from "../../useCurrentRegistrant";
import RegistrantsList from "./RegistrantsList";

gql`
    query SelectRegistrants($conferenceId: uuid!) {
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId } }, order_by: { displayName: asc }) {
            ...RegistrantData
        }
    }

    query SearchRegistrants($conferenceId: uuid!, $search: String!) {
        registrant_Registrant(
            where: {
                _and: [
                    { conferenceId: { _eq: $conferenceId } }
                    {
                        _or: [
                            { displayName: { _ilike: $search } }
                            { profile: { _or: [{ affiliation: { _ilike: $search } }, { bio: { _ilike: $search } }] } }
                            { badges: { name: { _ilike: $search } } }
                        ]
                    }
                ]
            }
            order_by: { displayName: asc }
        ) {
            ...RegistrantData
        }
    }
`;

export default function RegistrantListPage(): JSX.Element {
    const [search, setSearch] = useState<string>("");

    const conference = useConference();
    const title = useTitle(`Registrants at ${conference.shortName}`);

    const [
        searchQuery,
        { loading: loadingSearch, error: errorSearch, data: dataSearch },
    ] = useSearchRegistrantsLazyQuery();
    useQueryErrorToast(errorSearch, false, "RegistrantListPage.tsx -- search");

    const { loading: loadingRegistrants, error: errorRegistrants, data: dataRegistrants } = useSelectRegistrantsQuery({
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

    useEffect(() => {
        function doSearch() {
            if ((loadingSearch && !dataSearch) || errorSearch) {
                return undefined;
            }

            if (!dataSearch) {
                return undefined;
            }

            return dataSearch?.registrant_Registrant.filter((x) => !!x.profile && !!x.userId) as Registrant[];
        }

        setLoadedCount(30);
        setAllSearched((oldSearched) => doSearch() ?? oldSearched ?? null);
        // We need `search` in the sensitivity list because Apollo cache may not
        // change the data/error/loading state if the result comes straight from
        // the cache of the last run the search query
    }, [dataSearch, errorSearch, loadingSearch, search]);

    useEffect(() => {
        const tId = setTimeout(() => {
            if (search.length >= 3) {
                searchQuery({
                    variables: {
                        conferenceId: conference.id,
                        search: `%${search}%`,
                    },
                });
            } else {
                setAllSearched(null);
            }
        }, 750);
        return () => {
            clearTimeout(tId);
        };
    }, [conference.id, search, searchQuery]);

    return (
        <>
            {title}
            <Heading as="h1">Registrants</Heading>
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
            />
            {allRegistrants && loadedCount < allRegistrants.length ? (
                <Button
                    isLoading={isLoadingMore}
                    onClick={() => {
                        setIsLoadingMore(true);
                        setLoadedCount(loadedCount + 30);
                    }}
                >
                    <FAIcon iconStyle="s" icon="chevron-down" mr={2} />
                    Load more
                </Button>
            ) : (
                <Text fontStyle="italic">(End of list)</Text>
            )}
        </>
    );
}
