import {
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    Spinner,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import type { CombinedError } from "urql";
import { useClient } from "urql";
import type { SearchRegistrantsQuery, SearchRegistrantsQueryVariables } from "../../../../generated/graphql";
import { SearchRegistrantsDocument } from "../../../../generated/graphql";
import { useConference } from "../../../Conference/useConference";
import type { Registrant } from "../../../Conference/useCurrentRegistrant";
import { useMaybeCurrentRegistrant } from "../../../Conference/useCurrentRegistrant";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import { RegistrantsList } from "./RegistrantsList";

export function PeopleSearch({ createDM }: { createDM: (registrantId: string) => void }): JSX.Element {
    const [search, setSearch] = useState<string>("");

    const conference = useConference();
    const registrant = useMaybeCurrentRegistrant();

    const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
    const [errorSearch, setErrorSearch] = useState<CombinedError | null>(null);
    useQueryErrorToast(errorSearch, false, "RightSidebarConferenceSections.tsx -- search registrants");

    const [loadedCount, setLoadedCount] = useState<number>(30);

    const [searched, setSearched] = useState<Registrant[] | null>(null);
    const [allSearched, setAllSearched] = useState<Registrant[] | null>(null);

    useEffect(() => {
        setSearched(allSearched?.slice(0, loadedCount) ?? null);
    }, [allSearched, loadedCount]);

    const client = useClient();

    useEffect(() => {
        const tId = setTimeout(async () => {
            if (search.length >= 3) {
                const doSearch = async () => {
                    setLoadingSearch(true);
                    const response = await client
                        .query<SearchRegistrantsQuery, SearchRegistrantsQueryVariables>(SearchRegistrantsDocument, {
                            conferenceId: conference.id,
                            search: `%${search}%`,
                        })
                        .toPromise();
                    setLoadingSearch(false);

                    if (!response.data || response.error) {
                        setErrorSearch(response.error ?? null);
                        return undefined;
                    }

                    return response.data?.registrant_Registrant.filter(
                        (x) => !!x.profile && !!x.userId
                    ) as Registrant[];
                };

                setLoadedCount(30);
                const result = await doSearch();
                setAllSearched((oldSearched) => result ?? oldSearched ?? null);
            } else {
                setAllSearched(null);
            }
        }, 750);
        return () => {
            clearTimeout(tId);
        };
    }, [client, conference.id, search]);

    return (
        <>
            <FormControl my={2} px={2}>
                <FormLabel fontSize="sm">Search for people to start a chat</FormLabel>
                <InputGroup size="sm">
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
                action={createDM}
                searchedRegistrants={
                    searched && search.length > 0 ? searched.filter((x) => x.id !== registrant?.id) : undefined
                }
            />
        </>
    );
}
