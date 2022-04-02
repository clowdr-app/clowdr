import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    InputRightElement,
    List,
    ListItem,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useClient } from "urql";
import type { SearchRegistrantsQuery, SearchRegistrantsQueryVariables } from "../../../../../generated/graphql";
import { SearchRegistrantsDocument } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import useDebouncedState from "../../../../Hooks/useDebouncedState";
import { useConference } from "../../../useConference";

export function RegistrantSearch({
    excludeRegistrantIds,
    onSelect,
}: {
    excludeRegistrantIds: string[];
    onSelect: (registrantId: string) => Promise<void>;
}): JSX.Element {
    const [search, searchDebounced, setSearch] = useDebouncedState<string>("");
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const ariaSearchResultStr = `${options.length} people`;
    const conference = useConference();

    const client = useClient();
    const getSelectOptions = useCallback(
        async (searchTerm) => {
            if (searchTerm.length < 3) {
                return [];
            }
            const result = await client
                .query<SearchRegistrantsQuery, SearchRegistrantsQueryVariables>(SearchRegistrantsDocument, {
                    conferenceId: conference.id,
                    search: `%${searchTerm}%`,
                })
                .toPromise();
            return (
                result.data?.registrant_searchRegistrants
                    .filter((item) => Boolean(item.userId) && !excludeRegistrantIds.includes(item.id as string))
                    .map((item) => ({
                        value: item.id,
                        label: item.displayName,
                    })) ?? []
            );
        },
        [conference.id, client, excludeRegistrantIds]
    );
    useEffect(() => {
        async function fn() {
            const newOptions = await getSelectOptions(searchDebounced);
            setOptions(newOptions);
        }

        fn();
    }, [getSelectOptions, searchDebounced]);

    return (
        <>
            <FormControl>
                <FormLabel>Registrant</FormLabel>
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
                <FormHelperText>Search for an registrant by name</FormHelperText>
            </FormControl>
            <List>
                {options.map((option) => (
                    <ListItem key={option.value} my={2}>
                        <Button
                            onClick={async () => await onSelect(option.value)}
                            aria-label={`Choose ${option.label}`}
                            size="sm"
                            colorScheme="SecondaryActionButton"
                            leftIcon={<FAIcon icon="user" iconStyle="s" />}
                        >
                            {option.label}
                        </Button>
                    </ListItem>
                ))}
            </List>
        </>
    );
}
