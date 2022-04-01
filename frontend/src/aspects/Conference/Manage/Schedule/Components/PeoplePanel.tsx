import {
    chakra,
    Flex,
    Heading,
    IconButton,
    InputGroup,
    InputLeftAddon,
    List,
    ListItem,
    Select,
    Spinner,
    Text,
    Tooltip,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { maybeCompare } from "../../../../Utils/maybeCompare";
import { useConference } from "../../../useConference";
import CreatePersonModal from "./CreatePersonModal";
import type { ScheduleEditorRecord } from "./ScheduleEditorRecord";

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

    query ManageSchedule_SearchPeople($conferenceId: uuid!, $subconferenceId: uuid, $search: String!) {
        registrant_searchRegistrants(args: { conferenceid: $conferenceId, search: $search }, limit: 10) {
            ...ManageSchedule_Registrant
        }
        collection_searchProgramPerson(
            args: { conferenceid: $conferenceId, subconferenceid: $subconferenceId, search: $search }
            limit: 10
        ) {
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

export function mapItemPersonRoleToEventPersonRole(
    roleName?: string
): Schedule_EventProgramPersonRole_Enum | undefined {
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
            return undefined;
    }

    return undefined;
}

function eventPersonRoleToLabel(role: Schedule_EventProgramPersonRole_Enum | null | undefined): string {
    switch (role) {
        case Schedule_EventProgramPersonRole_Enum.Chair:
            return "Chair";
        case Schedule_EventProgramPersonRole_Enum.Presenter:
            return "Presenter";
        case Schedule_EventProgramPersonRole_Enum.Participant:
            return "Participant";
        default:
            return "None";
    }
}

export default function PeoplePanel(props: PanelProps<ScheduleEditorRecord>): JSX.Element {
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
        ],
        []
    );
    const reviewerRoleOptions = useMemo<ReadonlyArray<PersonRoleOption>>(
        () => [
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
                {!("sessionEventId" in props.record && props.record.sessionEventId) ? (
                    <Text>
                        Speakers of any presentations in this session are also given permissions and are listed on the
                        public schedule. They only have upload permissions for the content of their respective
                        presentations.
                    </Text>
                ) : undefined}
                <PeopleEditor roleOptions={speakerRoleOptions} defaultRole="PRESENTER" {...props} />
            </VStack>
            {"sessionEventId" in props.record && props.record.sessionEventId ? undefined : (
                <VStack spacing={4} alignItems="flex-start">
                    <Heading as="h2" textAlign="left" fontSize="lg">
                        Moderators / chairs
                    </Heading>
                    <Text>
                        Moderators have permission to administer the session, and may be listed on the public schedule.
                    </Text>
                    <PeopleEditor roleOptions={moderatorRoleOptions} defaultRole="CHAIR" {...props} />
                </VStack>
            )}
            <VStack spacing={4} alignItems="flex-start">
                <Heading as="h2" textAlign="left" fontSize="lg">
                    Reviewers
                </Heading>
                <Text>
                    Reviwers have permission to review uploaded content for the session, and are not listed on the
                    public schedule.
                </Text>
                <PeopleEditor roleOptions={reviewerRoleOptions} defaultRole="REVIEWER" hideRole {...props} />
            </VStack>
        </VStack>
    );
}

type MergedPeople = Array<
    | {
          itemPerson: DeepPartial<ManageSchedule_ItemPersonFragment>;
          eventPerson: undefined;
      }
    | {
          itemPerson?: DeepPartial<ManageSchedule_ItemPersonFragment>;
          eventPerson: DeepPartial<ManageSchedule_EventPersonFragment>;
      }
>;

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
    const [peopleResponse, refetchPeople] = useManageSchedule_GetPeopleQuery({
        variables: {
            ids: uniquePersonIds,
        },
        context,
        requestPolicy: "cache-and-network",
    });

    const mergedPeople = useMemo(() => {
        const result: MergedPeople = [];

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

        return R.sortWith(
            [
                (a, b) => maybeCompare(a.itemPerson?.priority, b.itemPerson?.priority, (x, y) => x - y),
                (a, b) =>
                    maybeCompare(
                        a.itemPerson?.personId
                            ? peopleResponse.data?.collection_ProgramPerson?.find(
                                  (x) => x.id === a.itemPerson?.personId
                              )?.name
                            : undefined,
                        b.itemPerson?.personId
                            ? peopleResponse.data?.collection_ProgramPerson?.find(
                                  (x) => x.id === b.itemPerson?.personId
                              )?.name
                            : undefined,
                        (x, y) => x.localeCompare(y)
                    ),
                (a, b) =>
                    maybeCompare(
                        a.eventPerson?.personId
                            ? peopleResponse.data?.collection_ProgramPerson?.find(
                                  (x) => x.id === a.eventPerson?.personId
                              )?.name
                            : undefined,
                        b.eventPerson?.personId
                            ? peopleResponse.data?.collection_ProgramPerson?.find(
                                  (x) => x.id === b.eventPerson?.personId
                              )?.name
                            : undefined,
                        (x, y) => x.localeCompare(y)
                    ),
            ],
            result
        );
    }, [eventPeople, itemPeople, peopleResponse.data?.collection_ProgramPerson]);

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
                                subconferenceId,
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
                              "+ " +
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

    const updateMergedPeople = useCallback(
        (newPeople: MergedPeople) => {
            onAnyChange();

            updateRecord((old) => ({
                ...old,
                eventPeople: [
                    ...(old.eventPeople?.filter((x) => !x.roleName || !eventPersonRoles.includes(x.roleName)) ?? []),
                    ...(newPeople
                        .filter(
                            (x) =>
                                x.eventPerson ||
                                (mapItemPersonRoleToEventPersonRole(x.itemPerson.roleName) ??
                                    mapItemPersonRoleToEventPersonRole(defaultRole))
                        )
                        .map(
                            (x) =>
                                x.eventPerson ?? {
                                    personId: x.itemPerson.id,
                                    roleName:
                                        mapItemPersonRoleToEventPersonRole(x.itemPerson.roleName) ??
                                        mapItemPersonRoleToEventPersonRole(defaultRole) ??
                                        Schedule_EventProgramPersonRole_Enum.Presenter,
                                }
                        ) as DeepPartial<ManageSchedule_EventPersonFragment>[]),
                ],
                item: old.item
                    ? {
                          ...old.item,
                          itemPeople: [
                              ...(old.item.itemPeople?.filter(
                                  (x) => !x.roleName || !itemPersonRoles.includes(x.roleName)
                              ) ?? []),
                              ...(newPeople
                                  .filter((x) => x.itemPerson)
                                  .map((x) => x.itemPerson) as DeepPartial<ManageSchedule_ItemPersonFragment>[]),
                          ],
                      }
                    : {
                          itemPeople: newPeople
                              .filter((x) => x.itemPerson)
                              .map((x) => x.itemPerson) as DeepPartial<ManageSchedule_ItemPersonFragment>[],
                      },
            }));
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [defaultRole, eventPersonRoles, itemPersonRoles]
    );

    const [createPersonName, setCreatePersonName] = useState<string>("");
    const [createPersonRegistrantId, setCreatePersonRegistrantId] = useState<string | null>(null);
    const createPersonDisclosure = useDisclosure();
    const onCreatePerson = useCallback(
        (personId: string) => {
            refetchPeople();
            onAnyChange();
            updateMergedPeople([
                ...mergedPeople,
                {
                    eventPerson: mapItemPersonRoleToEventPersonRole(defaultRole)
                        ? {
                              personId,
                              roleName: mapItemPersonRoleToEventPersonRole(defaultRole),
                          }
                        : undefined,
                    itemPerson: {
                        personId,
                        priority: R.findLastIndex((x) => !!x?.itemPerson, mergedPeople) + 1,
                        roleName: defaultRole,
                    },
                },
            ]);
        },
        [defaultRole, mergedPeople, onAnyChange, refetchPeople, updateMergedPeople]
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
                                setCreatePersonName("");
                                setCreatePersonRegistrantId(null);
                                createPersonDisclosure.onOpen();
                            } else if (optionType === "registrant") {
                                setCreatePersonName("");
                                setCreatePersonRegistrantId(id);
                                createPersonDisclosure.onOpen();
                            } else if (optionType === "person") {
                                if (
                                    !itemPeople.some((x) => x.personId === id) &&
                                    !eventPeople.some((x) => x.personId === id)
                                ) {
                                    updateMergedPeople([
                                        ...mergedPeople,
                                        {
                                            eventPerson: mapItemPersonRoleToEventPersonRole(defaultRole)
                                                ? {
                                                      personId: id,
                                                      roleName: mapItemPersonRoleToEventPersonRole(defaultRole),
                                                  }
                                                : undefined,
                                            itemPerson: {
                                                personId: id,
                                                priority: R.findLastIndex((x) => !!x?.itemPerson, mergedPeople) + 1,
                                                roleName: defaultRole,
                                            },
                                        },
                                    ]);
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
                            {person.itemPerson ? (
                                <>
                                    <IconButton
                                        aria-label="Move person up"
                                        icon={<FAIcon iconStyle="s" icon="arrow-circle-up" />}
                                        variant="ghost"
                                        size="sm"
                                        isDisabled={idx === 0}
                                        onClick={() => {
                                            const newPeople: MergedPeople = [];
                                            for (let i = 0; i < mergedPeople.length; i++) {
                                                const p = mergedPeople[i];
                                                if (p.itemPerson) {
                                                    if (i === idx) {
                                                        newPeople.push({
                                                            ...p,
                                                            itemPerson: {
                                                                ...p.itemPerson,
                                                                priority: i - 1,
                                                            },
                                                        });
                                                    } else if (i === idx - 1) {
                                                        newPeople.push({
                                                            ...p,
                                                            itemPerson: {
                                                                ...p.itemPerson,
                                                                priority: i + 1,
                                                            },
                                                        });
                                                    } else {
                                                        newPeople.push({
                                                            ...p,
                                                            itemPerson: {
                                                                ...p.itemPerson,
                                                                priority: i,
                                                            },
                                                        });
                                                    }
                                                } else {
                                                    newPeople.push(p);
                                                }
                                            }

                                            updateMergedPeople(newPeople);
                                        }}
                                    />
                                    <IconButton
                                        aria-label="Move person down"
                                        icon={<FAIcon iconStyle="s" icon="arrow-circle-down" />}
                                        variant="ghost"
                                        size="sm"
                                        isDisabled={idx === R.findLastIndex((x) => !!x?.itemPerson, mergedPeople)}
                                        onClick={() => {
                                            const newPeople: MergedPeople = [];
                                            for (let i = 0; i < mergedPeople.length; i++) {
                                                const p = mergedPeople[i];
                                                if (p.itemPerson) {
                                                    if (i === idx) {
                                                        newPeople.push({
                                                            ...p,
                                                            itemPerson: {
                                                                ...p.itemPerson,
                                                                priority: i + 1,
                                                            },
                                                        });
                                                    } else if (i === idx + 1) {
                                                        newPeople.push({
                                                            ...p,
                                                            itemPerson: {
                                                                ...p.itemPerson,
                                                                priority: i - 1,
                                                            },
                                                        });
                                                    } else {
                                                        newPeople.push({
                                                            ...p,
                                                            itemPerson: {
                                                                ...p.itemPerson,
                                                                priority: i,
                                                            },
                                                        });
                                                    }
                                                } else {
                                                    newPeople.push(p);
                                                }
                                            }

                                            updateMergedPeople(newPeople);
                                        }}
                                    />
                                </>
                            ) : undefined}
                            {person.eventPerson ? (
                                <Tooltip
                                    label={
                                        person.itemPerson
                                            ? "Click to hide person from public schedule"
                                            : "Click to show person in public schedule"
                                    }
                                >
                                    <IconButton
                                        aria-label={
                                            person.itemPerson
                                                ? "Click to hide person from public schedule"
                                                : "Click to show person in public schedule"
                                        }
                                        icon={
                                            person.itemPerson ? (
                                                <FAIcon iconStyle="s" icon="eye" />
                                            ) : (
                                                <FAIcon iconStyle="s" icon="eye-slash" />
                                            )
                                        }
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newPeople: MergedPeople = [];
                                            for (let i = 0; i < mergedPeople.length; i++) {
                                                const p = mergedPeople[i];
                                                if (idx === i) {
                                                    if (p.eventPerson) {
                                                        newPeople.push({
                                                            itemPerson: p.itemPerson
                                                                ? undefined
                                                                : {
                                                                      personId: p.eventPerson.personId,
                                                                      priority: i,
                                                                      roleName: defaultRole,
                                                                  },
                                                            eventPerson: p.eventPerson,
                                                        });
                                                    } else {
                                                        newPeople.push({
                                                            itemPerson: undefined,
                                                            eventPerson: {
                                                                personId: p.itemPerson.personId,
                                                                roleName: mapItemPersonRoleToEventPersonRole(
                                                                    p.itemPerson.roleName
                                                                ),
                                                            },
                                                        });
                                                    }
                                                } else {
                                                    newPeople.push(p);
                                                }
                                            }

                                            updateMergedPeople(newPeople);
                                        }}
                                    />
                                </Tooltip>
                            ) : undefined}

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
                                {!hideRole ? (
                                    <Tooltip
                                        label={
                                            person.itemPerson
                                                ? "Role name shown to attendees to aid understanding. Does not affect permissions."
                                                : ""
                                        }
                                    >
                                        {person.itemPerson && roleOptions.length <= 1 ? (
                                            <Text ml="auto" fontSize="sm">
                                                {person.itemPerson.roleName ?? "<Role unknown>"}
                                            </Text>
                                        ) : !person.itemPerson && eventPersonRoles.length <= 1 ? (
                                            <></>
                                        ) : (
                                            <Select
                                                w="max-content"
                                                minW={0}
                                                size="sm"
                                                ml="auto"
                                                value={
                                                    person.itemPerson?.roleName ?? person.eventPerson?.roleName ?? ""
                                                }
                                                onChange={(ev) => {
                                                    updateMergedPeople(
                                                        mergedPeople.map((x, i) =>
                                                            i === idx
                                                                ? x.eventPerson
                                                                    ? {
                                                                          itemPerson: x.itemPerson
                                                                              ? {
                                                                                    ...x.itemPerson,
                                                                                    roleName: ev.target.value,
                                                                                }
                                                                              : undefined,
                                                                          eventPerson: {
                                                                              ...x.eventPerson,
                                                                              roleName: !person.itemPerson
                                                                                  ? (ev.target
                                                                                        .value as Schedule_EventProgramPersonRole_Enum)
                                                                                  : mapItemPersonRoleToEventPersonRole(
                                                                                        ev.target.value
                                                                                    ) ??
                                                                                    mapItemPersonRoleToEventPersonRole(
                                                                                        defaultRole
                                                                                    ) ??
                                                                                    Schedule_EventProgramPersonRole_Enum.Presenter,
                                                                          },
                                                                      }
                                                                    : {
                                                                          itemPerson: {
                                                                              ...x.itemPerson,
                                                                              roleName: ev.target.value,
                                                                          },
                                                                          eventPerson: undefined,
                                                                      }
                                                                : x
                                                        )
                                                    );
                                                }}
                                            >
                                                {person.itemPerson ? (
                                                    <>
                                                        {roleOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <>
                                                        {eventPersonRoles.map((opt) => (
                                                            <option key={opt} value={opt}>
                                                                {eventPersonRoleToLabel(opt)}
                                                            </option>
                                                        ))}
                                                    </>
                                                )}
                                            </Select>
                                        )}
                                    </Tooltip>
                                ) : undefined}
                            </Flex>

                            <IconButton
                                aria-label="Remove person"
                                icon={<FAIcon iconStyle="s" icon="times" />}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    updateMergedPeople(mergedPeople.filter((_, i) => i !== idx));
                                }}
                            />
                        </Flex>
                    </ListItem>
                ))}
            </List>
            <CreatePersonModal
                initialName={createPersonName}
                initialExistingRegistrantId={createPersonRegistrantId}
                isOpen={createPersonDisclosure.isOpen}
                onClose={createPersonDisclosure.onClose}
                onCreate={onCreatePerson}
            />
        </>
    );
}
