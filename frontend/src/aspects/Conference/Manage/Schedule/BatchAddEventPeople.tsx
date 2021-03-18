import { gql, MutationTuple, QueryResult, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Select,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    AddEventPeople_ContentGroupPersonFragment,
    AddEventPeople_InsertContentPeopleMutation,
    AddEventPeople_InsertContentPeopleMutationVariables,
    AddEventPeople_InsertEventPeopleMutation,
    AddEventPeople_InsertEventPeopleMutationVariables,
    AddEventPeople_SelectAttendeesQuery,
    AddEventPeople_SelectAttendeesQueryVariables,
    AddEventPeople_SelectContentPeople_ByAttendeeQuery,
    AddEventPeople_SelectContentPeople_ByAttendeeQueryVariables,
    ContentPersonInfoFragmentDoc,
    ContentPerson_Insert_Input,
    EventInfoFragment,
    EventInfoFragmentDoc,
    EventPersonInfoFragmentDoc,
    EventPersonRole_Enum,
    EventPerson_Insert_Input,
    Permission_Enum,
    RoomInfoFragment,
    useAddEventPeople_InsertContentPeopleMutation,
    useAddEventPeople_InsertEventPeopleMutation,
    useAddEventPeople_SelectAttendeesQuery,
    useAddEventPeople_SelectAttendees_ByGroupQuery,
    useAddEventPeople_SelectContentGroupPeopleQuery,
    useAddEventPeople_SelectContentPeopleQuery,
    useAddEventPeople_SelectContentPeople_ByAttendeeQuery,
    useAddEventPeople_SelectGroupsQuery,
} from "../../../../generated/graphql";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { formatEnumValue } from "../../../CRUDTable2/CRUDComponents";
import { FAIcon } from "../../../Icons/FAIcon";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";

gql`
    fragment AddEventPeople_ContentGroupPerson on ContentGroupPerson {
        id
        groupId
        personId
        roleName
    }

    fragment AddEventPeople_ContentPerson on ContentPerson {
        id
        name
        affiliation
        email
        attendeeId
    }

    fragment AddEventPeople_Attendee on Attendee {
        id
        displayName
        profile {
            attendeeId
            affiliation
        }
        invitation {
            id
            invitedEmailAddress
        }
    }

    fragment AddEventPeople_Group on Group {
        id
        name
    }

    query AddEventPeople_SelectContentGroupPeople($contentGroupIds: [uuid!]!) {
        ContentGroupPerson(where: { groupId: { _in: $contentGroupIds } }) {
            ...AddEventPeople_ContentGroupPerson
        }
    }

    query AddEventPeople_SelectContentPeople($conferenceId: uuid!) {
        ContentPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AddEventPeople_ContentPerson
        }
    }

    query AddEventPeople_SelectAttendees($conferenceId: uuid!) {
        Attendee(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AddEventPeople_Attendee
        }
    }

    query AddEventPeople_SelectContentPeople_ByAttendee($attendeeIds: [uuid!]!) {
        ContentPerson(where: { attendeeId: { _in: $attendeeIds } }) {
            ...AddEventPeople_ContentPerson
        }
    }

    query AddEventPeople_SelectGroups($conferenceId: uuid!) {
        Group(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AddEventPeople_Group
        }
    }

    query AddEventPeople_SelectAttendees_ByGroup($groupId: uuid!) {
        Attendee(where: { groupAttendees: { groupId: { _eq: $groupId } } }) {
            ...AddEventPeople_Attendee
        }
    }

    mutation AddEventPeople_InsertContentPeople($objects: [ContentPerson_insert_input!]!) {
        insert_ContentPerson(objects: $objects) {
            returning {
                ...AddEventPeople_ContentPerson
            }
        }
    }

    mutation AddEventPeople_InsertEventPeople($objects: [EventPerson_insert_input!]!) {
        insert_EventPerson(objects: $objects) {
            returning {
                ...EventPersonInfo
            }
        }
    }
`;

function ContentGroupPersonRoleToEventPersonRole(role: string): EventPersonRole_Enum {
    switch (role.toLowerCase()) {
        case "chair":
            return EventPersonRole_Enum.Chair;
        case "session chair":
            return EventPersonRole_Enum.Chair;
        default:
            return EventPersonRole_Enum.Presenter;
    }
}

function AddEventPeople_FromContentPanel({
    events,
    onClose,
}: {
    events: EventInfoFragment[];
    isExpanded: boolean;
    onClose: () => void;
}) {
    const selectContentGroupPeopleQuery = useAddEventPeople_SelectContentGroupPeopleQuery({
        skip: true,
    });
    const insert = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [copying, setCopying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const copy = useCallback(async () => {
        setCopying(true);
        setError(null);

        try {
            const eventsWithContent = events.filter((x) => !!x.contentGroupId);
            const contentGroupIds: string[] = eventsWithContent.map((x) => x.contentGroupId);
            const contentGroupPeopleQ = await selectContentGroupPeopleQuery.refetch({
                contentGroupIds,
            });
            const contentGroupPeople = contentGroupPeopleQ.data.ContentGroupPerson;
            const contentGroupPeopleByGroup = new Map(
                contentGroupIds.map((groupId) => [groupId, contentGroupPeople.filter((x) => x.groupId === groupId)])
            );
            const newEventPeople: EventPerson_Insert_Input[] = [];
            for (const event of eventsWithContent) {
                const existingEventPeople = event.eventPeople;
                const groupPeople = contentGroupPeopleByGroup.get(
                    event.contentGroupId
                ) as AddEventPeople_ContentGroupPersonFragment[];
                for (const groupPerson of groupPeople) {
                    const groupPersonEventRole = ContentGroupPersonRoleToEventPersonRole(groupPerson.roleName);
                    if (
                        !existingEventPeople.some(
                            (person) =>
                                person.personId === groupPerson.personId && person.roleName === groupPersonEventRole
                        )
                    ) {
                        newEventPeople.push({
                            eventId: event.id,
                            personId: groupPerson.personId,
                            roleName: groupPersonEventRole,
                        });
                    }
                }
            }

            await insertEventPeople(eventsWithContent, newEventPeople, insert);

            setCopying(false);
            onClose();
            toast({
                title: `${newEventPeople.length} new people copied`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        } catch (e) {
            setError(e.message || e.toString());
            setCopying(false);
        }
    }, [events, insert, onClose, selectContentGroupPeopleQuery, toast]);

    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Copy from associated content
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                {error ? (
                    <Alert status="error" variant="subtle" mb={4} justifyContent="flex-start" alignItems="flex-start">
                        <AlertIcon />
                        <VStack justifyContent="flex-start" alignItems="flex-start">
                            <AlertTitle>Error copying people to events</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </VStack>
                    </Alert>
                ) : undefined}
                <Button colorScheme="green" onClick={copy} isLoading={copying}>
                    Copy
                </Button>
            </AccordionPanel>
        </>
    );
}

function AddEventPeople_SingleContentPersonPanel({
    events,
    isExpanded,
    onClose,
}: {
    events: EventInfoFragment[];
    isExpanded: boolean;
    onClose: () => void;
}) {
    const conference = useConference();
    const [hasBeenExpanded, setHasBeenExpanded] = useState<boolean>(false);
    useEffect(() => {
        if (isExpanded) {
            setHasBeenExpanded(true);
        }
    }, [isExpanded]);

    const selectContentPeopleQuery = useAddEventPeople_SelectContentPeopleQuery({
        skip: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
    });
    const peopleOptions = useMemo(
        () =>
            selectContentPeopleQuery.data
                ? [...selectContentPeopleQuery.data.ContentPerson]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .map((x) => (
                          <option key={x.id} value={x.id}>
                              {x.name}
                              {x.affiliation ? ` (${x.affiliation})` : ""}
                              {x.email ? ` <${x.email}>` : ""}
                          </option>
                      ))
                : [],
        [selectContentPeopleQuery.data]
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(EventPersonRole_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (EventPersonRole_Enum as any)[x];
                    return (
                        <option key={v} value={v}>
                            {formatEnumValue(v)}
                        </option>
                    );
                }),
        []
    );

    const [selectedPersonId, setSelectedPersonId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<EventPersonRole_Enum>(EventPersonRole_Enum.Presenter);

    const insert = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [adding, setAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            assert(selectContentPeopleQuery.data);
            const selectedPerson = selectContentPeopleQuery.data.ContentPerson.find((x) => x.id === selectedPersonId);
            assert(selectedPerson);
            const newEventPeople: EventPerson_Insert_Input[] = [];
            for (const event of events) {
                const existingEventPeople = event.eventPeople;
                if (
                    !existingEventPeople.some(
                        (person) => person.personId === selectedPerson.id && person.roleName === selectedRole
                    )
                ) {
                    newEventPeople.push({
                        eventId: event.id,
                        personId: selectedPerson.id,
                        roleName: selectedRole,
                    });
                }
            }

            await insertEventPeople(events, newEventPeople, insert);

            setAdding(false);
            onClose();
            toast({
                title: `Person added to ${newEventPeople.length} event(s)`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        } catch (e) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [events, insert, onClose, selectContentPeopleQuery.data, selectedPersonId, selectedRole, toast]);

    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Add a person
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                {error || selectContentPeopleQuery.error ? (
                    <Alert status="error" variant="subtle" mb={4} justifyContent="flex-start" alignItems="flex-start">
                        <AlertIcon />
                        <VStack justifyContent="flex-start" alignItems="flex-start">
                            <AlertTitle>
                                {error ? "Error adding person to events" : "Error loading list of people"}
                            </AlertTitle>
                            <AlertDescription>{error ?? selectContentPeopleQuery.error?.message}</AlertDescription>
                        </VStack>
                    </Alert>
                ) : undefined}
                <Select
                    aria-label="Person to add"
                    value={selectedPersonId}
                    onChange={(ev) => setSelectedPersonId(ev.target.value)}
                    mb={4}
                >
                    <option value="">Select a person</option>
                    {peopleOptions}
                </Select>
                <Select
                    aria-label="Role of person"
                    value={selectedRole}
                    onChange={(ev) => setSelectedRole(ev.target.value as EventPersonRole_Enum)}
                    mb={4}
                >
                    {roleOptions}
                </Select>
                <Button colorScheme="green" isDisabled={selectedPersonId === ""} isLoading={adding} onClick={add}>
                    Add
                </Button>
            </AccordionPanel>
        </>
    );
}

function AddEventPeople_FromGroupPanel({
    events,
    isExpanded,
    onClose,
}: {
    events: EventInfoFragment[];
    isExpanded: boolean;
    onClose: () => void;
}) {
    const conference = useConference();
    const [hasBeenExpanded, setHasBeenExpanded] = useState<boolean>(false);
    useEffect(() => {
        if (isExpanded) {
            setHasBeenExpanded(true);
        }
    }, [isExpanded]);

    const selectAttendeesQuery = useAddEventPeople_SelectAttendeesQuery({
        skip: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
    });
    const selectGroupsQuery = useAddEventPeople_SelectGroupsQuery({
        skip: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
    });
    const selectAttendees_ByGroupQuery = useAddEventPeople_SelectAttendees_ByGroupQuery({
        skip: true,
    });
    const selectContentPeople_ByAttendeeQuery = useAddEventPeople_SelectContentPeople_ByAttendeeQuery({
        skip: true,
    });
    const registrantOptions = useMemo(
        () =>
            selectGroupsQuery.data
                ? [...selectGroupsQuery.data.Group]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .map((x) => (
                          <option key={x.id} value={x.id}>
                              {x.name}
                          </option>
                      ))
                : [],
        [selectGroupsQuery.data]
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(EventPersonRole_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (EventPersonRole_Enum as any)[x];
                    return (
                        <option key={v} value={v}>
                            {formatEnumValue(v)}
                        </option>
                    );
                }),
        []
    );

    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<EventPersonRole_Enum>(EventPersonRole_Enum.Presenter);

    const insertContentPeople = useAddEventPeople_InsertContentPeopleMutation();
    const insertEventPeopleQ = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [adding, setAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            const attendees = await selectAttendees_ByGroupQuery.refetch({
                groupId: selectedGroupId,
            });
            await addAttendeesToEvent(
                attendees.data.Attendee.map((x) => x.id),
                selectAttendeesQuery,
                selectContentPeople_ByAttendeeQuery,
                insertContentPeople,
                conference.id,
                events,
                selectedRole,
                insertEventPeopleQ
            );

            setAdding(false);
            onClose();
            toast({
                title: "Registration group added to events",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        } catch (e) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [
        conference,
        events,
        insertContentPeople,
        insertEventPeopleQ,
        onClose,
        selectAttendeesQuery,
        selectAttendees_ByGroupQuery,
        selectContentPeople_ByAttendeeQuery,
        selectedGroupId,
        selectedRole,
        toast,
    ]);

    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Copy from a registration group
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                {error || selectGroupsQuery.error ? (
                    <Alert status="error" variant="subtle" mb={4} justifyContent="flex-start" alignItems="flex-start">
                        <AlertIcon />
                        <VStack justifyContent="flex-start" alignItems="flex-start">
                            <AlertTitle>
                                {error ? "Error adding registration group to events" : "Error loading list of groups"}
                            </AlertTitle>
                            <AlertDescription>{error ?? selectGroupsQuery.error?.message}</AlertDescription>
                        </VStack>
                    </Alert>
                ) : undefined}
                <Select
                    aria-label="Registration group to add"
                    value={selectedGroupId}
                    onChange={(ev) => setSelectedGroupId(ev.target.value)}
                    mb={4}
                >
                    <option value="">Select a registration group</option>
                    {registrantOptions}
                </Select>
                <Select
                    aria-label="Role of registrant"
                    value={selectedRole}
                    onChange={(ev) => setSelectedRole(ev.target.value as EventPersonRole_Enum)}
                    mb={4}
                >
                    {roleOptions}
                </Select>
                <Button colorScheme="green" isDisabled={selectedGroupId === ""} isLoading={adding} onClick={add}>
                    Add
                </Button>
            </AccordionPanel>
        </>
    );
}

function AddEventPeople_SingleRegistrantPanel({
    events,
    isExpanded,
    onClose,
}: {
    events: EventInfoFragment[];
    isExpanded: boolean;
    onClose: () => void;
}) {
    const conference = useConference();
    const [hasBeenExpanded, setHasBeenExpanded] = useState<boolean>(false);
    useEffect(() => {
        if (isExpanded) {
            setHasBeenExpanded(true);
        }
    }, [isExpanded]);

    const selectAttendeesQuery = useAddEventPeople_SelectAttendeesQuery({
        skip: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
    });
    const selectContentPeople_ByAttendeeQuery = useAddEventPeople_SelectContentPeople_ByAttendeeQuery({
        skip: true,
    });
    const registrantOptions = useMemo(
        () =>
            selectAttendeesQuery.data
                ? [...selectAttendeesQuery.data.Attendee]
                      .sort((x, y) => x.displayName.localeCompare(y.displayName))
                      .map((x) => (
                          <option key={x.id} value={x.id}>
                              {x.displayName}
                              {x.profile?.affiliation ? ` (${x.profile.affiliation})` : ""}
                              {x.invitation?.invitedEmailAddress ? ` <${x.invitation.invitedEmailAddress}>` : ""}
                          </option>
                      ))
                : [],
        [selectAttendeesQuery.data]
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(EventPersonRole_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (EventPersonRole_Enum as any)[x];
                    return (
                        <option key={v} value={v}>
                            {formatEnumValue(v)}
                        </option>
                    );
                }),
        []
    );

    const [selectedAttendeeId, setSelectedAttendeeId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<EventPersonRole_Enum>(EventPersonRole_Enum.Presenter);

    const insertContentPeople = useAddEventPeople_InsertContentPeopleMutation();
    const insertEventPeopleQ = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [adding, setAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            const newEventPeople: EventPerson_Insert_Input[] = await addAttendeesToEvent(
                [selectedAttendeeId],
                selectAttendeesQuery,
                selectContentPeople_ByAttendeeQuery,
                insertContentPeople,
                conference.id,
                events,
                selectedRole,
                insertEventPeopleQ
            );

            setAdding(false);
            onClose();
            toast({
                title: `Registrant added to ${newEventPeople.length} event(s)`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        } catch (e) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [
        conference,
        events,
        insertContentPeople,
        insertEventPeopleQ,
        onClose,
        selectAttendeesQuery,
        selectContentPeople_ByAttendeeQuery,
        selectedAttendeeId,
        selectedRole,
        toast,
    ]);

    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Add a registrant
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                {error || selectAttendeesQuery.error ? (
                    <Alert status="error" variant="subtle" mb={4} justifyContent="flex-start" alignItems="flex-start">
                        <AlertIcon />
                        <VStack justifyContent="flex-start" alignItems="flex-start">
                            <AlertTitle>
                                {error ? "Error adding registrant to events" : "Error loading list of registrants"}
                            </AlertTitle>
                            <AlertDescription>{error ?? selectAttendeesQuery.error?.message}</AlertDescription>
                        </VStack>
                    </Alert>
                ) : undefined}
                <Select
                    aria-label="Registrant to add"
                    value={selectedAttendeeId}
                    onChange={(ev) => setSelectedAttendeeId(ev.target.value)}
                    mb={4}
                >
                    <option value="">Select a registrant</option>
                    {registrantOptions}
                </Select>
                <Select
                    aria-label="Role of registrant"
                    value={selectedRole}
                    onChange={(ev) => setSelectedRole(ev.target.value as EventPersonRole_Enum)}
                    mb={4}
                >
                    {roleOptions}
                </Select>
                <Button colorScheme="green" isDisabled={selectedAttendeeId === ""} isLoading={adding} onClick={add}>
                    Add
                </Button>
            </AccordionPanel>
        </>
    );
}

async function insertEventPeople(
    events: EventInfoFragment[],
    newEventPeople: EventPerson_Insert_Input[],
    insert: MutationTuple<AddEventPeople_InsertEventPeopleMutation, AddEventPeople_InsertEventPeopleMutationVariables>
): Promise<void> {
    await insert[0]({
        variables: {
            objects: newEventPeople,
        },
        update: (cache, { data: _data }) => {
            if (_data?.insert_EventPerson) {
                const data = _data.insert_EventPerson;
                cache.modify({
                    fields: {
                        Event: (existingRefs: Reference[] = [], { readField }) => {
                            const eventRefs = existingRefs.filter((ref) =>
                                events.some((x) => x.id === readField("id", ref))
                            );

                            for (const eventRef of eventRefs) {
                                const frag = cache.readFragment<EventInfoFragment>({
                                    fragment: EventInfoFragmentDoc,
                                    fragmentName: "EventInfo",
                                    id: eventRef.__ref,
                                });
                                if (frag) {
                                    cache.writeFragment<EventInfoFragment>({
                                        fragment: EventInfoFragmentDoc,
                                        fragmentName: "EventInfo",
                                        data: {
                                            ...frag,
                                            eventPeople: [
                                                ...frag.eventPeople,
                                                ...data.returning.filter((x) => x.eventId === frag.id),
                                            ],
                                        },
                                    });
                                }
                            }

                            return existingRefs;
                        },
                        EventPerson(existingRefs: Reference[] = []) {
                            const newRefs = data.returning.map((x) =>
                                cache.writeFragment({
                                    data: x,
                                    fragment: EventPersonInfoFragmentDoc,
                                    fragmentName: "EventPersonInfo",
                                })
                            );
                            return [...existingRefs, ...newRefs];
                        },
                    },
                });
            }
        },
    });
}

export async function addAttendeesToEvent(
    attendeeIds: string[],
    selectAttendeesQuery: QueryResult<
        AddEventPeople_SelectAttendeesQuery,
        AddEventPeople_SelectAttendeesQueryVariables
    >,
    selectContentPeople_ByAttendeeQuery: QueryResult<
        AddEventPeople_SelectContentPeople_ByAttendeeQuery,
        AddEventPeople_SelectContentPeople_ByAttendeeQueryVariables
    >,
    insertContentPeople: MutationTuple<
        AddEventPeople_InsertContentPeopleMutation,
        AddEventPeople_InsertContentPeopleMutationVariables
    >,
    conferenceId: string,
    events: EventInfoFragment[],
    selectedRole: EventPersonRole_Enum,
    insertEventPeopleQ: MutationTuple<
        AddEventPeople_InsertEventPeopleMutation,
        AddEventPeople_InsertEventPeopleMutationVariables
    >
): Promise<EventPerson_Insert_Input[]> {
    const contentPeople = await selectContentPeople_ByAttendeeQuery.refetch({
        attendeeIds,
    });

    const personIds: string[] = [];
    const insertContentPersons: ContentPerson_Insert_Input[] = [];
    for (const attendeeId of attendeeIds) {
        const personId = contentPeople.data.ContentPerson.find((x) => x.attendeeId === attendeeId)?.id;
        if (personId) {
            personIds.push(personId);
        } else {
            const attendee = selectAttendeesQuery.data?.Attendee.find((x) => x.id === attendeeId);
            assert(attendee, `Failed to find attendee ${attendeeId}`);
            insertContentPersons.push({
                name: attendee.displayName,
                affiliation: attendee.profile?.affiliation,
                attendeeId: attendee.id,
                conferenceId,
                email: attendee.invitation?.invitedEmailAddress,
            });
        }
    }

    if (insertContentPersons.length > 0) {
        const newPeople = await insertContentPeople[0]({
            variables: {
                objects: insertContentPersons,
            },
            update: (cache, result) => {
                if (result.data?.insert_ContentPerson) {
                    const data = result.data.insert_ContentPerson;
                    cache.modify({
                        fields: {
                            ContentPerson(existingRefs: Reference[] = []) {
                                const newRefs = data.returning.map((x) =>
                                    cache.writeFragment({
                                        data: x,
                                        fragment: ContentPersonInfoFragmentDoc,
                                        fragmentName: "ContentPersonInfo",
                                    })
                                );
                                return [...existingRefs, ...newRefs];
                            },
                        },
                    });
                }
            },
        });
        assert(newPeople.data?.insert_ContentPerson?.returning, "Failed to insert content people");
        personIds.push(...newPeople.data.insert_ContentPerson.returning.map((x) => x.id));
    }

    const newEventPeople: EventPerson_Insert_Input[] = [];
    for (const event of events) {
        const existingEventPeople = event.eventPeople;
        for (const personId of personIds) {
            if (
                !existingEventPeople.some((person) => person.personId === personId && person.roleName === selectedRole)
            ) {
                newEventPeople.push({
                    eventId: event.id,
                    personId: personId,
                    roleName: selectedRole,
                });
            }
        }
    }

    await insertEventPeople(events, newEventPeople, insertEventPeopleQ);
    return newEventPeople;
}

export default function BatchAddEventPeople({
    isOpen,
    onClose,
    events,
    rooms,
}: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    events: EventInfoFragment[];
    rooms: readonly RoomInfoFragment[];
}): JSX.Element {
    const roomOptions = useMemo(
        () =>
            rooms.map((room) => (
                <option key={room.id} value={room.id}>
                    {room.name}
                </option>
            )),
        [rooms]
    );

    const [startsAfter, setStartsAfter] = useState<Date | undefined>();
    const [endsBefore, setEndsBefore] = useState<Date | undefined>();
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");

    const [refilterEvents, setRefilterEvents] = useState<boolean>(true);
    useEffect(() => {
        setRefilterEvents(true);
    }, [events]);

    const [filteredEvents, setFilteredEvents] = useState<EventInfoFragment[]>([]);
    useEffect(() => {
        if (refilterEvents) {
            setRefilterEvents(false);
            const startsAfterTime = startsAfter?.getTime();
            const endsBeforeTime = endsBefore?.getTime();
            const filteredByRoom =
                selectedRoomId === "" ? events : events.filter((event) => event.roomId === selectedRoomId);
            const filteredByTime =
                startsAfterTime || endsBeforeTime
                    ? filteredByRoom.filter(
                          (event) =>
                              (!startsAfterTime || Date.parse(event.startTime) >= startsAfterTime) &&
                              (!endsBeforeTime ||
                                  Date.parse(event.startTime) + event.durationSeconds * 1000 <= endsBeforeTime)
                      )
                    : filteredByRoom;
            setFilteredEvents(
                R.sortWith(
                    [
                        (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
                        (a, b) =>
                            Date.parse(a.startTime) +
                            a.durationSeconds * 1000 -
                            (Date.parse(b.startTime) + b.durationSeconds * 1000),
                    ],
                    filteredByTime
                )
            );
        }
    }, [endsBefore, events, refilterEvents, selectedRoomId, startsAfter]);
    const firstEvent = useMemo(() => (filteredEvents.length > 0 ? filteredEvents[0] : undefined), [filteredEvents]);
    const lastEvent = useMemo(
        () => (filteredEvents.length > 1 ? filteredEvents[filteredEvents.length - 1] : undefined),
        [filteredEvents]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Add people to events
                    <ModalCloseButton />
                </ModalHeader>
                <ModalBody>
                    <VStack spacing={4} justifyContent="flex-start" alignItems="flex-start">
                        <Text fontStyle="italic">Use the controls below to filter to particular events.</Text>
                        <FormControl>
                            <FormLabel>Starts after</FormLabel>
                            <HStack>
                                <DateTimePicker
                                    value={startsAfter}
                                    onChange={setStartsAfter}
                                    onBlur={() => setRefilterEvents(true)}
                                />
                                <Button
                                    aria-label="Clear filter"
                                    size="sm"
                                    isDisabled={!startsAfter}
                                    onClick={() => setStartsAfter(undefined)}
                                >
                                    <FAIcon iconStyle="s" icon="times" />
                                </Button>
                            </HStack>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Ends before</FormLabel>
                            <HStack>
                                <DateTimePicker
                                    value={endsBefore}
                                    onChange={setEndsBefore}
                                    onBlur={() => setRefilterEvents(true)}
                                />
                                <Button
                                    aria-label="Clear filter"
                                    size="sm"
                                    isDisabled={!endsBefore}
                                    onClick={() => setEndsBefore(undefined)}
                                >
                                    <FAIcon iconStyle="s" icon="times" />
                                </Button>
                            </HStack>
                        </FormControl>
                        <FormControl>
                            <FormLabel>In room</FormLabel>
                            <Select
                                value={selectedRoomId}
                                onChange={(ev) => setSelectedRoomId(ev.target.value)}
                                onBlur={() => setRefilterEvents(true)}
                            >
                                <option value="">&lt;No filter&gt;</option>
                                {roomOptions}
                            </Select>
                        </FormControl>
                        <Text fontStyle="italic">Sample of events in your filtered selection.</Text>
                        {firstEvent || lastEvent ? (
                            <List>
                                {firstEvent ? (
                                    <ListItem>
                                        First: {new Date(firstEvent.startTime).toLocaleString()} - {firstEvent.name}
                                    </ListItem>
                                ) : undefined}
                                {lastEvent ? (
                                    <ListItem>
                                        Last: {new Date(lastEvent.startTime).toLocaleString()} - {lastEvent.name}
                                    </ListItem>
                                ) : undefined}
                            </List>
                        ) : (
                            <Text>No events in filtered selection.</Text>
                        )}
                        <Text fontStyle="italic">Select the bulk operation you would like to perform.</Text>
                        <Accordion w="100%">
                            <AccordionItem>
                                {({ isExpanded }) => (
                                    <AddEventPeople_FromContentPanel
                                        events={filteredEvents}
                                        isExpanded={isExpanded}
                                        onClose={onClose}
                                    />
                                )}
                            </AccordionItem>
                            <AccordionItem>
                                {({ isExpanded }) => (
                                    <AddEventPeople_SingleContentPersonPanel
                                        events={filteredEvents}
                                        isExpanded={isExpanded}
                                        onClose={onClose}
                                    />
                                )}
                            </AccordionItem>
                            <RequireAtLeastOnePermissionWrapper
                                permissions={[
                                    Permission_Enum.ConferenceManageGroups,
                                    Permission_Enum.ConferenceManageRoles,
                                ]}
                            >
                                <AccordionItem>
                                    {({ isExpanded }) => (
                                        <AddEventPeople_FromGroupPanel
                                            events={filteredEvents}
                                            isExpanded={isExpanded}
                                            onClose={onClose}
                                        />
                                    )}
                                </AccordionItem>
                            </RequireAtLeastOnePermissionWrapper>
                            <RequireAtLeastOnePermissionWrapper
                                permissions={[
                                    Permission_Enum.ConferenceManageAttendees,
                                    Permission_Enum.ConferenceManageGroups,
                                    Permission_Enum.ConferenceManageRoles,
                                ]}
                            >
                                <AccordionItem>
                                    {({ isExpanded }) => (
                                        <AddEventPeople_SingleRegistrantPanel
                                            events={filteredEvents}
                                            isExpanded={isExpanded}
                                            onClose={onClose}
                                        />
                                    )}
                                </AccordionItem>
                            </RequireAtLeastOnePermissionWrapper>
                        </Accordion>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
