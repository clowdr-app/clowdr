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
import type { SearchRegistrantsQuery, SearchRegistrantsQueryVariables } from "../../../../generated/graphql";
import { SearchRegistrantsDocument } from "../../../../generated/graphql";
import useDebouncedState from "../../../CRUDTable/useDebouncedState";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

export function RegistrantSearch({
    selectedRegistrantIds,
    onSelect,
}: {
    selectedRegistrantIds: string[];
    onSelect: (registrantId: string) => Promise<void>;
}): JSX.Element {
    const [search, searchDebounced, setSearch] = useDebouncedState<string>("");
    const [options, setOptions] = useState<{ label: string; value: string; inRoom: boolean }[]>([]);
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
                result.data?.registrant_Registrant
                    .filter((item) => !!item.userId)
                    .map((item) => ({
                        value: item.id,
                        label: item.displayName,
                        inRoom: selectedRegistrantIds.includes(item.id as string),
                    })) ?? []
            );
        },
        [conference.id, client, selectedRegistrantIds]
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
                <FormLabel htmlFor="registrant_id">Registrant</FormLabel>
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
                            aria-label={
                                option.inRoom ? `${option.label} already in room` : `Add ${option.label} to room`
                            }
                            p={0}
                            mr={3}
                            size="sm"
                            colorScheme="PrimaryActionButton"
                            isDisabled={option.inRoom}
                        >
                            <FAIcon icon={option.inRoom ? "check-circle" : "plus-circle"} iconStyle="s" />
                        </Button>
                        {option.label}
                    </ListItem>
                ))}
            </List>
        </>
    );
}
