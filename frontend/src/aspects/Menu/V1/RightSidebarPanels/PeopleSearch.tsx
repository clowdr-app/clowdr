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
import { useSearchRegistrantsLazyQuery } from "../../../../generated/graphql";
import { useConference } from "../../../Conference/useConference";
import { Registrant, useMaybeCurrentRegistrant } from "../../../Conference/useCurrentRegistrant";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import { RegistrantsList } from "./RegistrantsList";

export function PeopleSearch({ createDM }: { createDM: (registrantId: string) => void }): JSX.Element {
    const [search, setSearch] = useState<string>("");

    const conference = useConference();
    const registrant = useMaybeCurrentRegistrant();

    const [
        searchQuery,
        { loading: loadingSearch, error: errorSearch, data: dataSearch },
    ] = useSearchRegistrantsLazyQuery();
    useQueryErrorToast(errorSearch, false, "RightSidebarConferenceSections.tsx -- search registrants");

    const [loadedCount, setLoadedCount] = useState<number>(30);

    const [searched, setSearched] = useState<Registrant[] | null>(null);
    const [allSearched, setAllSearched] = useState<Registrant[] | null>(null);

    useEffect(() => {
        setSearched(allSearched?.slice(0, loadedCount) ?? null);
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
        // the cache of the last run of the search query
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
