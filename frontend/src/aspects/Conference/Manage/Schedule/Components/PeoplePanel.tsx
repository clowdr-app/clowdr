import {
    chakra,
    Flex,
    Heading,
    IconButton,
    InputGroup,
    InputLeftAddon,
    List,
    ListItem,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ManageSchedule_EventPersonFragment,
    ManageSchedule_ItemPersonFragment,
    ManageSchedule_PersonFragment,
    ManageSchedule_RegistrantFragment,
    ManageSchedule_SearchPeopleQuery,
    ManageSchedule_SearchPeopleQueryVariables,
    ManageSchedule_SessionFragment,
} from "../../../../../generated/graphql";
import {
    ManageSchedule_SearchPeopleDocument,
    Schedule_EventProgramPersonRole_Enum,
    useManageSchedule_GetPeopleQuery,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { SingleSelect } from "../../../../Chakra/MultiSelect";
import type { DeepPartial, PanelProps } from "../../../../CRUDCards/Types";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";

gql`
    fragment ManageSchedule_Person on collection_ProgramPerson {
        id
        name
        affiliation
        email
        registrantId
    }

    fragment ManageSchedule_Registrant on registrant_Registrant {
        id
        displayName
        invitation {
            invitedEmailAddress
        }
    }

    query ManageSchedule_SearchPeople($conferenceId: uuid!, $search: String!) {
        registrant_searchRegistrants(args: { conferenceid: $conferenceId, search: $search }, limit: 10) {
            ...ManageSchedule_Registrant
        }
        collection_searchProgramPerson(args: { conferenceid: $conferenceId, search: $search }, limit: 10) {
            ...ManageSchedule_Person
        }
    }

    query ManageSchedule_GetPeople($ids: [uuid!]!) {
        collection_ProgramPerson(where: { id: { _in: $ids } }) {
            ...ManageSchedule_Person
        }
    }
`;

interface PersonRoleOption {
    readonly label: string;
    readonly value: string;
}

function mapItemPersonRoleToEventPersonRole(roleName?: string): Schedule_EventProgramPersonRole_Enum | undefined {
    if (!roleName) {
        return undefined;
    }

    switch (roleName) {
        case "PRESENTER":
            return Schedule_EventProgramPersonRole_Enum.Presenter;
        case "AUTHOR":
            return Schedule_EventProgramPersonRole_Enum.Presenter;
        case "DISCUSSANT":
            return Schedule_EventProgramPersonRole_Enum.Presenter;
        case "CHAIR":
            return Schedule_EventProgramPersonRole_Enum.Chair;
        case "SESSION ORGANIZER":
            return Schedule_EventProgramPersonRole_Enum.Chair;
        case "REVIEWER":
            return Schedule_EventProgramPersonRole_Enum.Chair;
    }

    return undefined;
}

export default function PeoplePanel(props: PanelProps<ManageSchedule_SessionFragment>): JSX.Element {
    const speakerRoleOptions = useMemo<ReadonlyArray<PersonRoleOption>>(
        () => [
            {
                label: "Presenter",
                value: "PRESENTER",
            },
            {
                label: "Author",
                value: "AUTHOR",
            },
            {
                label: "Discussant",
                value: "DISCUSSANT",
            },
        ],
        []
    );
    const moderatorRoleOptions = useMemo<ReadonlyArray<PersonRoleOption>>(
        () => [
            {
                label: "Chair",
                value: "CHAIR",
            },
            {
                label: "Session Organizer",
                value: "SESSION ORGANIZER",
            },
            {
                label: "Reviewer",
                value: "REVIEWER",
            },
        ],
        []
    );

    useEffect(() => {
        props.onValid();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <VStack spacing={8}>
            <VStack spacing={4} alignItems="flex-start">
                <Heading as="h2" textAlign="left" fontSize="lg">
                    Speakers
                </Heading>
                <Text>
                    Speakers have permission to present during the session and may be listed on the public schedule.
                    They have upload permissions for any content associated with this event.
                </Text>
                <PeopleEditor roleOptions={speakerRoleOptions} defaultRole="PRESENTER" {...props} />
            </VStack>
            <VStack spacing={4} alignItems="flex-start">
                <Heading as="h2" textAlign="left" fontSize="lg">
                    Moderators / chairs
                </Heading>
                <Text>
                    Moderators have permission to administer the event, and may be listed on the public schedule.
                </Text>
                <PeopleEditor roleOptions={moderatorRoleOptions} defaultRole="CHAIR" hideRole {...props} />
            </VStack>
        </VStack>
    );
}

function PeopleEditor({
    record,
    updateRecord,
    roleOptions,
    defaultRole,
    hideRole = false,
    onAnyChange,
}: PanelProps<ManageSchedule_SessionFragment> & {
    readonly roleOptions: ReadonlyArray<PersonRoleOption>;
    defaultRole: string;
    hideRole?: boolean;
}): JSX.Element {
    const eventPersonRoles = useMemo(
        () => R.uniq(roleOptions.map((x) => mapItemPersonRoleToEventPersonRole(x.value))),
        [roleOptions]
    );
    const itemPersonRoles = useMemo(() => R.uniq(roleOptions.map((x) => x.value)), [roleOptions]);

    const eventPeople = useMemo(
        () => record.eventPeople?.filter((x) => x.roleName && eventPersonRoles.includes(x.roleName)) ?? [],
        [eventPersonRoles, record.eventPeople]
    );
    const itemPeople = useMemo(
        () => record.item?.itemPeople?.filter((x) => x.roleName && itemPersonRoles.includes(x.roleName)) ?? [],
        [itemPersonRoles, record.item?.itemPeople]
    );
    const mergedPeople = useMemo(() => {
        const result: Array<
            DeepPartial<
                | {
                      itemPerson: ManageSchedule_ItemPersonFragment;
                      eventPerson: undefined;
                  }
                | {
                      itemPerson?: ManageSchedule_ItemPersonFragment;
                      eventPerson: ManageSchedule_EventPersonFragment;
                  }
            >
        > = [];

        const foundItemPersonIds = new Set<string>();
        for (const eventPerson of eventPeople) {
            const itemPerson = itemPeople.find(
                (x) =>
                    x.personId === eventPerson.personId &&
                    eventPerson.roleName === mapItemPersonRoleToEventPersonRole(x.roleName)
            );
            if (itemPerson?.personId) {
                foundItemPersonIds.add(itemPerson.personId);
            }
            result.push({
                eventPerson,
                itemPerson,
            });
        }

        for (const itemPerson of itemPeople) {
            if (itemPerson.personId) {
                if (!foundItemPersonIds.has(itemPerson.personId)) {
                    result.push({ itemPerson, eventPerson: undefined });
                }
            }
        }

        return result;
    }, [eventPeople, itemPeople]);
    // TODO: Sort mergedPeople into:
    //      Not Hidden: priority then alphabetical order
    //      Hidden: alphabetical order

    const uniquePersonIds = useMemo(
        () =>
            R.uniq([
                ...eventPeople.map((x) => x.personId).filter((x) => !!x),
                ...itemPeople.map((x) => x.personId).filter((x) => !!x),
            ]) as string[],
        [eventPeople, itemPeople]
    );

    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [peopleResponse] = useManageSchedule_GetPeopleQuery({
        variables: {
            ids: uniquePersonIds,
        },
        context,
    });

    const client = useClient();

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<{
        registrants: ReadonlyArray<ManageSchedule_RegistrantFragment>;
        people: ReadonlyArray<ManageSchedule_PersonFragment>;
    }>({ registrants: [], people: [] });
    const [isSearching, setIsSearching] = useState<boolean>(false);
    useEffect(() => {
        const tId = setTimeout(async () => {
            if (searchTerm.length >= 3) {
                setIsSearching(true);
                try {
                    const result = await client
                        .query<ManageSchedule_SearchPeopleQuery, ManageSchedule_SearchPeopleQueryVariables>(
                            ManageSchedule_SearchPeopleDocument,
                            {
                                conferenceId: conference.id,
                                search: searchTerm,
                            },
                            context
                        )
                        .toPromise();
                    if (result.data) {
                        setSearchResults({
                            registrants: result.data.registrant_searchRegistrants.filter(
                                (x) => !result.data?.collection_searchProgramPerson.some((y) => y.registrantId === x.id)
                            ),
                            people: result.data.collection_searchProgramPerson,
                        });
                    }
                } finally {
                    setIsSearching(false);
                }
            }
        }, 500);

        return () => {
            clearTimeout(tId);
        };
    }, [client, conference.id, context, searchTerm, subconferenceId]);
    const searchedOptions = useMemo(
        () =>
            searchTerm.length >= 3
                ? [
                      ...searchResults.people.map((x) => ({
                          label: x.name + (x.email || x.affiliation ? ` (${x.email ?? x.affiliation})` : ""),
                          value: "person¬" + x.id,
                      })),
                      ...searchResults.registrants.map((x) => ({
                          label:
                              x.displayName +
                              (x.invitation?.invitedEmailAddress.length
                                  ? ` (${x.invitation?.invitedEmailAddress})`
                                  : ""),
                          value: "registrant¬" + x.id,
                      })),
                      {
                          label: "Add a person",
                          value: "create¬",
                      },
                  ]
                : [
                      {
                          label: "Add a person",
                          value: "create¬",
                      },
                  ],
        [searchResults.people, searchResults.registrants, searchTerm.length]
    );

    return (
        <>
            <InputGroup w="100%">
                <InputLeftAddon>{isSearching ? <Spinner /> : <FAIcon iconStyle="s" icon="search" />}</InputLeftAddon>
                <SingleSelect
                    placeholder="Start typing to search people"
                    onInputChange={(value) => {
                        setSearchTerm(value);
                    }}
                    value={null}
                    onChange={(value, action) => {
                        if (value && (action.action === "create-option" || action.action === "select-option")) {
                            const optionType = value.value.split("¬")[0];
                            const id = value.value.split("¬")[1];
                            if (optionType === "create") {
                                // TODO: Create a person modal from blank
                            } else if (optionType === "registrant") {
                                // TODO: Create a person modal from name and maybe email
                            } else if (optionType === "person") {
                                if (
                                    !itemPeople.some((x) => x.personId === id) &&
                                    !eventPeople.some((x) => x.personId === id)
                                ) {
                                    onAnyChange();

                                    // TODO: Insert an item person
                                    // TODO: Insert an event person
                                    updateRecord((old) => ({
                                        ...old,
                                        eventPeople: [
                                            ...(old.eventPeople ?? []),
                                            {
                                                personId: id,
                                                roleName: mapItemPersonRoleToEventPersonRole(defaultRole),
                                            },
                                        ],
                                        item: old.item
                                            ? {
                                                  ...old.item,
                                                  itemPeople: [
                                                      ...(old.item.itemPeople ?? []),
                                                      {
                                                          personId: id,
                                                          priority: old.item.itemPeople?.length ?? 1,
                                                          roleName: defaultRole,
                                                      },
                                                  ],
                                              }
                                            : undefined,
                                    }));
                                }
                            }
                        }
                    }}
                    options={searchedOptions}
                    styles={{
                        container: (base) => ({
                            ...base,
                            width: "100%",
                        }),
                    }}
                />
            </InputGroup>
            <List spacing={2} w="100%">
                {mergedPeople.map((person, idx) => (
                    <ListItem
                        key={
                            "person-" + idx + "-" + (person.eventPerson?.personId ?? person.itemPerson?.id ?? "unknown")
                        }
                    >
                        <Flex w="100%">
                            {/* TODO: Only show these buttons if the person is not "hidden" (i.e. item person exists) */}
                            <IconButton
                                aria-label="Move person up"
                                icon={<FAIcon iconStyle="s" icon="arrow-circle-up" />}
                                variant="ghost"
                                size="sm"
                                // TODO: Re-assign priorities
                            />
                            <IconButton
                                aria-label="Move person down"
                                icon={<FAIcon iconStyle="s" icon="arrow-circle-down" />}
                                variant="ghost"
                                size="sm"
                                // TODO: Re-assign priorities
                            />
                            {/* TODO: Correct aria label and icon based on hidden/not hidden */}
                            <IconButton
                                aria-label={person.itemPerson ? "Hide person" : "Unhide person"}
                                icon={
                                    person.itemPerson ? (
                                        <FAIcon iconStyle="s" icon="eye" />
                                    ) : (
                                        <FAIcon iconStyle="s" icon="eye-slash" />
                                    )
                                }
                                variant="ghost"
                                size="sm"
                                // TODO: Add/remove item person
                            />

                            <Flex w="100%" alignItems="center" pb="2px" px={2}>
                                <chakra.span mr={2}>
                                    {peopleResponse.data?.collection_ProgramPerson
                                        ? peopleResponse.data.collection_ProgramPerson.find(
                                              (x) =>
                                                  x.id === person.eventPerson?.personId ||
                                                  x.id === person.itemPerson?.personId
                                          )?.name ?? "<Unknown>"
                                        : "<Loading...>"}
                                </chakra.span>
                                {/* TODO: Role selector, if visible: item person role, else if hidden: event person role */}
                                {!hideRole ? (
                                    <chakra.span ml="auto">
                                        {person.itemPerson?.roleName ?? person.eventPerson?.roleName}
                                    </chakra.span>
                                ) : undefined}
                            </Flex>

                            <IconButton
                                aria-label="Remove person"
                                icon={<FAIcon iconStyle="s" icon="times" />}
                                variant="ghost"
                                size="sm"
                            />
                        </Flex>
                    </ListItem>
                ))}
            </List>
        </>
    );
}
