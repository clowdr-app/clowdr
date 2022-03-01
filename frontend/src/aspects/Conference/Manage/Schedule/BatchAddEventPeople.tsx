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
import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { OperationResult, UseMutationResponse, UseQueryState } from "urql";
import { useClient } from "urql";
import type {
    AddEventPeople_InsertEventPeopleMutation,
    AddEventPeople_InsertEventPeopleMutationVariables,
    AddEventPeople_InsertProgramPeopleMutation,
    AddEventPeople_InsertProgramPeopleMutationVariables,
    AddEventPeople_ItemPersonFragment,
    AddEventPeople_SelectItemPeopleQuery,
    AddEventPeople_SelectItemPeopleQueryVariables,
    AddEventPeople_SelectProgramPeople_ByRegistrantQuery,
    AddEventPeople_SelectProgramPeople_ByRegistrantQueryVariables,
    AddEventPeople_SelectRegistrantsQuery,
    AddEventPeople_SelectRegistrants_ByGroupQuery,
    AddEventPeople_SelectRegistrants_ByGroupQueryVariables,
    Collection_ProgramPerson_Insert_Input,
    EventInfoFragment,
    Exact,
    RoomInfoFragment,
    Schedule_EventProgramPerson_Insert_Input,
} from "../../../../generated/graphql";
import {
    AddEventPeople_SelectItemPeopleDocument,
    AddEventPeople_SelectProgramPeople_ByRegistrantDocument,
    AddEventPeople_SelectRegistrants_ByGroupDocument,
    Schedule_EventProgramPersonRole_Enum,
    useAddEventPeople_InsertEventPeopleMutation,
    useAddEventPeople_InsertProgramPeopleMutation,
    useAddEventPeople_SelectGroupsQuery,
    useAddEventPeople_SelectProgramPeopleQuery,
    useAddEventPeople_SelectRegistrantsQuery,
} from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { formatEnumValue } from "../../../CRUDTable2/CRUDComponents";
import { makeContext } from "../../../GQL/make-context";
import { maybeCompare } from "../../../Utils/maybeCompare";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";

gql`
    fragment AddEventPeople_ItemPerson on content_ItemProgramPerson {
        id
        itemId
        personId
        roleName
    }

    fragment AddEventPeople_ProgramPerson on collection_ProgramPerson {
        id
        name
        affiliation
        email
        registrantId
    }

    fragment AddEventPeople_Registrant on registrant_Registrant {
        id
        displayName
        profile {
            registrantId
            affiliation
        }
        invitation {
            id
            invitedEmailAddress
        }
    }

    fragment AddEventPeople_Group on registrant_Group {
        id
        name
    }

    query AddEventPeople_SelectItemPeople($itemIds: [uuid!]!, $exhibitionIds: [uuid!]!) {
        content_ItemProgramPerson(where: { itemId: { _in: $itemIds }, roleName: { _neq: "REVIEWER" } }) {
            ...AddEventPeople_ItemPerson
        }
        content_ItemExhibition(where: { exhibitionId: { _in: $exhibitionIds } }) {
            id
            exhibitionId
            itemId
            item {
                id
                itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
                    ...AddEventPeople_ItemPerson
                }
            }
        }
    }

    query AddEventPeople_SelectProgramPeople($conferenceId: uuid!) {
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AddEventPeople_ProgramPerson
        }
    }

    query AddEventPeople_SelectRegistrants($conferenceId: uuid!) {
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AddEventPeople_Registrant
        }
    }

    query AddEventPeople_SelectProgramPeople_ByRegistrant($registrantIds: [uuid!]!) {
        collection_ProgramPerson(where: { registrantId: { _in: $registrantIds } }) {
            ...AddEventPeople_ProgramPerson
        }
    }

    query AddEventPeople_SelectGroups($conferenceId: uuid!) {
        registrant_Group(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AddEventPeople_Group
        }
    }

    query AddEventPeople_SelectRegistrants_ByGroup($groupId: uuid!) {
        registrant_Registrant(where: { groupRegistrants: { groupId: { _eq: $groupId } } }) {
            ...AddEventPeople_Registrant
        }
    }

    mutation AddEventPeople_InsertProgramPeople($objects: [collection_ProgramPerson_insert_input!]!) {
        insert_collection_ProgramPerson(objects: $objects) {
            returning {
                ...AddEventPeople_ProgramPerson
            }
        }
    }

    mutation AddEventPeople_InsertEventPeople($objects: [schedule_EventProgramPerson_insert_input!]!) {
        insert_schedule_EventProgramPerson(
            objects: $objects
            on_conflict: { constraint: EventProgramPerson_eventId_personId_roleName_key, update_columns: [] }
        ) {
            returning {
                ...EventProgramPersonInfo
            }
        }
    }
`;

function ItemProgramPersonRoleToEventProgramPersonRole(role: string): Schedule_EventProgramPersonRole_Enum {
    switch (role.toLowerCase()) {
        case "chair":
            return Schedule_EventProgramPersonRole_Enum.Chair;
        case "session chair":
            return Schedule_EventProgramPersonRole_Enum.Chair;
        case "session organizer":
            return Schedule_EventProgramPersonRole_Enum.Chair;
        case "organizer":
            return Schedule_EventProgramPersonRole_Enum.Chair;
        default:
            return Schedule_EventProgramPersonRole_Enum.Presenter;
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
    const client = useClient();
    const insert = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [copying, setCopying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const copy = useCallback(
        async (includeContent: boolean, includeExhibitions: boolean) => {
            setCopying(true);
            setError(null);

            try {
                const eventsWithContent = includeContent ? events.filter((x) => !!x.itemId) : [];
                const itemIds: string[] = eventsWithContent.map((x) => x.itemId);

                const eventsWithExhibition = includeExhibitions ? events.filter((x) => !!x.exhibitionId) : [];
                const exhibitionIds: string[] = eventsWithExhibition.map((x) => x.exhibitionId);

                const itemPeopleQ = await client
                    .query<AddEventPeople_SelectItemPeopleQuery, AddEventPeople_SelectItemPeopleQueryVariables>(
                        AddEventPeople_SelectItemPeopleDocument,
                        {
                            itemIds,
                            exhibitionIds,
                        },
                        {
                            fetchOptions: {
                                headers: {
                                    [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                },
                            },
                        }
                    )
                    .toPromise();
                if (!itemPeopleQ.data) {
                    throw new Error("No data available.");
                }
                const itemPeople = itemPeopleQ.data.content_ItemProgramPerson;
                const itemExhibitions = itemPeopleQ.data.content_ItemExhibition;
                const itemPeopleByItem = new Map<string, AddEventPeople_ItemPersonFragment[]>(
                    itemIds.map((itemId) => [itemId, itemPeople.filter((x) => x.itemId === itemId)])
                );
                const exhibitionsMap = new Map<string, AddEventPeople_ItemPersonFragment[]>();
                for (const itemExhibition of itemExhibitions) {
                    const existing = exhibitionsMap.get(itemExhibition.exhibitionId);
                    if (existing) {
                        existing.push(...itemExhibition.item.itemPeople);
                    } else {
                        exhibitionsMap.set(itemExhibition.exhibitionId, [...itemExhibition.item.itemPeople]);
                    }
                }
                const newEventPeople: Schedule_EventProgramPerson_Insert_Input[] = [];
                if (includeContent) {
                    for (const event of eventsWithContent) {
                        const existingEventPeople = event.eventPeople;
                        const itemPeopleItm = itemPeopleByItem.get(event.itemId);
                        if (itemPeopleItm) {
                            for (const itemPerson of itemPeopleItm) {
                                const itemPersonEventRole = ItemProgramPersonRoleToEventProgramPersonRole(
                                    itemPerson.roleName
                                );
                                if (
                                    !existingEventPeople.some(
                                        (person) =>
                                            person.personId === itemPerson.personId &&
                                            person.roleName === itemPersonEventRole
                                    )
                                ) {
                                    newEventPeople.push({
                                        eventId: event.id,
                                        personId: itemPerson.personId,
                                        roleName: itemPersonEventRole,
                                    });
                                }
                            }
                        }
                    }
                }

                if (includeExhibitions) {
                    for (const event of eventsWithExhibition) {
                        const existingEventPeople = event.eventPeople;
                        const itemPeopleExh = exhibitionsMap.get(event.exhibitionId);
                        if (itemPeopleExh) {
                            for (const itemPerson of itemPeopleExh) {
                                const itemPersonEventRole = ItemProgramPersonRoleToEventProgramPersonRole(
                                    itemPerson.roleName
                                );
                                if (
                                    !existingEventPeople.some(
                                        (person) =>
                                            person.personId === itemPerson.personId &&
                                            person.roleName === itemPersonEventRole
                                    )
                                ) {
                                    newEventPeople.push({
                                        eventId: event.id,
                                        personId: itemPerson.personId,
                                        roleName: itemPersonEventRole,
                                    });
                                }
                            }
                        }
                    }
                }

                if (newEventPeople.length > 0) {
                    await insertEventPeople(newEventPeople, insert);
                }

                setCopying(false);
                onClose();
                toast({
                    title: `${newEventPeople.length} new people copied`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom",
                });
            } catch (e: any) {
                setError(e.message || e.toString());
                setCopying(false);
            }
        },
        [events, insert, onClose, client, toast]
    );

    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Copy from associated content or exhibitions
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
                <Button colorScheme="purple" onClick={() => copy(true, false)} isLoading={copying} mb={2}>
                    Copy from associated content only
                </Button>
                <Button colorScheme="purple" onClick={() => copy(false, true)} isLoading={copying} mb={2}>
                    Copy from associated exhibitions only
                </Button>
                <Button colorScheme="purple" onClick={() => copy(true, true)} isLoading={copying}>
                    Copy from associated content and exhibitions
                </Button>
            </AccordionPanel>
        </>
    );
}

function AddEventPeople_SingleProgramPersonPanel({
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

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [selectProgramPeopleQuery] = useAddEventPeople_SelectProgramPeopleQuery({
        pause: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const peopleOptions = useMemo(
        () =>
            selectProgramPeopleQuery.data
                ? [...selectProgramPeopleQuery.data.collection_ProgramPerson]
                      .sort((x, y) => maybeCompare(x.name, y.name, (a, b) => a.localeCompare(b)))
                      .map((x) => (
                          <option key={x.id} value={x.id}>
                              {x.name}
                              {x.affiliation ? ` (${x.affiliation})` : ""}
                              {x.email ? ` <${x.email}>` : ""}
                          </option>
                      ))
                : [],
        [selectProgramPeopleQuery.data]
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(Schedule_EventProgramPersonRole_Enum)
                .filter((x) => x !== "Participant")
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (Schedule_EventProgramPersonRole_Enum as any)[x];
                    return (
                        <option key={v} value={v}>
                            {formatEnumValue(v)}
                        </option>
                    );
                }),
        []
    );

    const [selectedPersonId, setSelectedPersonId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<Schedule_EventProgramPersonRole_Enum>(
        Schedule_EventProgramPersonRole_Enum.Presenter
    );

    const insert = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [adding, setAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            assert.truthy(selectProgramPeopleQuery.data);
            const selectedPerson = selectProgramPeopleQuery.data.collection_ProgramPerson.find(
                (x) => x.id === selectedPersonId
            );
            assert.truthy(selectedPerson);
            const newEventPeople: Schedule_EventProgramPerson_Insert_Input[] = [];
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

            await insertEventPeople(newEventPeople, insert);

            setAdding(false);
            onClose();
            toast({
                title: `Person added to ${newEventPeople.length} event(s)`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        } catch (e: any) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [events, insert, onClose, selectProgramPeopleQuery.data, selectedPersonId, selectedRole, toast]);

    return (
        <>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    Add a program person
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                {error || selectProgramPeopleQuery.error ? (
                    <Alert status="error" variant="subtle" mb={4} justifyContent="flex-start" alignItems="flex-start">
                        <AlertIcon />
                        <VStack justifyContent="flex-start" alignItems="flex-start">
                            <AlertTitle>
                                {error ? "Error adding person to events" : "Error loading list of people"}
                            </AlertTitle>
                            <AlertDescription>{error ?? selectProgramPeopleQuery.error?.message}</AlertDescription>
                        </VStack>
                    </Alert>
                ) : undefined}
                <Select
                    aria-label="Person to add"
                    value={selectedPersonId}
                    onChange={(ev) => setSelectedPersonId(ev.target.value)}
                    mb={4}
                >
                    <option value="">Select a program person</option>
                    {peopleOptions}
                </Select>
                <Select
                    aria-label="Role of person"
                    value={selectedRole}
                    onChange={(ev) => setSelectedRole(ev.target.value as Schedule_EventProgramPersonRole_Enum)}
                    mb={4}
                >
                    {roleOptions}
                </Select>
                <Button colorScheme="purple" isDisabled={selectedPersonId === ""} isLoading={adding} onClick={add}>
                    Add
                </Button>
            </AccordionPanel>
        </>
    );
}

// TODO
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

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [selectRegistrantsQuery] = useAddEventPeople_SelectRegistrantsQuery({
        pause: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const [selectGroupsQuery] = useAddEventPeople_SelectGroupsQuery({
        pause: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const registrantOptions = useMemo(
        () =>
            selectGroupsQuery.data
                ? [...selectGroupsQuery.data.registrant_Group]
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
            Object.keys(Schedule_EventProgramPersonRole_Enum)
                .filter((x) => x !== "Participant")
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (Schedule_EventProgramPersonRole_Enum as any)[x];
                    return (
                        <option key={v} value={v}>
                            {formatEnumValue(v)}
                        </option>
                    );
                }),
        []
    );

    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<Schedule_EventProgramPersonRole_Enum>(
        Schedule_EventProgramPersonRole_Enum.Presenter
    );

    const insertProgramPeople = useAddEventPeople_InsertProgramPeopleMutation();
    const insertEventPeopleQ = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [adding, setAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const client = useClient();
    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            const registrants = await client
                .query<
                    AddEventPeople_SelectRegistrants_ByGroupQuery,
                    AddEventPeople_SelectRegistrants_ByGroupQueryVariables
                >(
                    AddEventPeople_SelectRegistrants_ByGroupDocument,
                    {
                        groupId: selectedGroupId,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                )
                .toPromise();
            assert.truthy(registrants.data, "API returned no data");
            await addRegistrantsToEvent(
                registrants.data.registrant_Registrant.map((x) => x.id),
                selectRegistrantsQuery,
                (registrantIds) =>
                    client
                        .query<
                            AddEventPeople_SelectProgramPeople_ByRegistrantQuery,
                            AddEventPeople_SelectProgramPeople_ByRegistrantQueryVariables
                        >(
                            AddEventPeople_SelectProgramPeople_ByRegistrantDocument,
                            {
                                registrantIds,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise(),
                insertProgramPeople,
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
        } catch (e: any) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [
        selectedGroupId,
        selectRegistrantsQuery,
        insertProgramPeople,
        conference.id,
        events,
        selectedRole,
        insertEventPeopleQ,
        onClose,
        toast,
        client,
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
                    onChange={(ev) => setSelectedRole(ev.target.value as Schedule_EventProgramPersonRole_Enum)}
                    mb={4}
                >
                    {roleOptions}
                </Select>
                <Button colorScheme="purple" isDisabled={selectedGroupId === ""} isLoading={adding} onClick={add}>
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

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [selectRegistrantsQuery] = useAddEventPeople_SelectRegistrantsQuery({
        pause: !hasBeenExpanded,
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const registrantOptions = useMemo(
        () =>
            selectRegistrantsQuery.data
                ? [...selectRegistrantsQuery.data.registrant_Registrant]
                      .sort((x, y) => x.displayName.localeCompare(y.displayName))
                      .map((x) => (
                          <option key={x.id} value={x.id}>
                              {x.displayName}
                              {x.profile?.affiliation ? ` (${x.profile.affiliation})` : ""}
                              {x.invitation?.invitedEmailAddress ? ` <${x.invitation.invitedEmailAddress}>` : ""}
                          </option>
                      ))
                : [],
        [selectRegistrantsQuery.data]
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(Schedule_EventProgramPersonRole_Enum)
                .filter((x) => x !== "Participant")
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (Schedule_EventProgramPersonRole_Enum as any)[x];
                    return (
                        <option key={v} value={v}>
                            {formatEnumValue(v)}
                        </option>
                    );
                }),
        []
    );

    const [selectedRegistrantId, setSelectedRegistrantId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<Schedule_EventProgramPersonRole_Enum>(
        Schedule_EventProgramPersonRole_Enum.Presenter
    );

    const insertProgramPeople = useAddEventPeople_InsertProgramPeopleMutation();
    const insertEventPeopleQ = useAddEventPeople_InsertEventPeopleMutation();
    const toast = useToast();

    const [adding, setAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const client = useClient();
    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            const newEventPeople: Schedule_EventProgramPerson_Insert_Input[] = await addRegistrantsToEvent(
                [selectedRegistrantId],
                selectRegistrantsQuery,
                (registrantIds) =>
                    client
                        .query<
                            AddEventPeople_SelectProgramPeople_ByRegistrantQuery,
                            AddEventPeople_SelectProgramPeople_ByRegistrantQueryVariables
                        >(
                            AddEventPeople_SelectProgramPeople_ByRegistrantDocument,
                            {
                                registrantIds,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise(),
                insertProgramPeople,
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
        } catch (e: any) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [
        selectedRegistrantId,
        selectRegistrantsQuery,
        insertProgramPeople,
        conference.id,
        events,
        selectedRole,
        insertEventPeopleQ,
        onClose,
        toast,
        client,
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
                {error || selectRegistrantsQuery.error ? (
                    <Alert status="error" variant="subtle" mb={4} justifyContent="flex-start" alignItems="flex-start">
                        <AlertIcon />
                        <VStack justifyContent="flex-start" alignItems="flex-start">
                            <AlertTitle>
                                {error ? "Error adding registrant to events" : "Error loading list of registrants"}
                            </AlertTitle>
                            <AlertDescription>{error ?? selectRegistrantsQuery.error?.message}</AlertDescription>
                        </VStack>
                    </Alert>
                ) : undefined}
                <Select
                    aria-label="Registrant to add"
                    value={selectedRegistrantId}
                    onChange={(ev) => setSelectedRegistrantId(ev.target.value)}
                    mb={4}
                >
                    <option value="">Select a registrant</option>
                    {registrantOptions}
                </Select>
                <Select
                    aria-label="Role of registrant"
                    value={selectedRole}
                    onChange={(ev) => setSelectedRole(ev.target.value as Schedule_EventProgramPersonRole_Enum)}
                    mb={4}
                >
                    {roleOptions}
                </Select>
                <Button colorScheme="purple" isDisabled={selectedRegistrantId === ""} isLoading={adding} onClick={add}>
                    Add
                </Button>
            </AccordionPanel>
        </>
    );
}

async function insertEventPeople(
    newEventPeople: Schedule_EventProgramPerson_Insert_Input[],
    insert: UseMutationResponse<
        AddEventPeople_InsertEventPeopleMutation,
        AddEventPeople_InsertEventPeopleMutationVariables
    >
): Promise<void> {
    await insert[1](
        {
            objects: newEventPeople,
        },
        {
            fetchOptions: {
                headers: {
                    [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                },
            },
        }
    );
}

export async function addRegistrantsToEvent(
    registrantIds: string[],
    // eslint-disable-next-line @typescript-eslint/ban-types
    selectRegistrantsQuery: UseQueryState<AddEventPeople_SelectRegistrantsQuery, object>,
    selectProgramPeople_ByRegistrantQuery: (
        registrantIds: string[]
    ) => Promise<OperationResult<AddEventPeople_SelectProgramPeople_ByRegistrantQuery, Exact<{ registrantIds: any }>>>,
    insertProgramPeople: UseMutationResponse<
        AddEventPeople_InsertProgramPeopleMutation,
        AddEventPeople_InsertProgramPeopleMutationVariables
    >,
    conferenceId: string,
    events: EventInfoFragment[],
    selectedRole: Schedule_EventProgramPersonRole_Enum,
    insertEventPeopleQ: UseMutationResponse<
        AddEventPeople_InsertEventPeopleMutation,
        AddEventPeople_InsertEventPeopleMutationVariables
    >
): Promise<Schedule_EventProgramPerson_Insert_Input[]> {
    const programPeople = await selectProgramPeople_ByRegistrantQuery(registrantIds);

    const personIds: string[] = [];
    const insertProgramPersons: Collection_ProgramPerson_Insert_Input[] = [];
    for (const registrantId of registrantIds) {
        const personId = programPeople.data?.collection_ProgramPerson.find((x) => x.registrantId === registrantId)?.id;
        if (personId) {
            personIds.push(personId);
        } else {
            const registrant = selectRegistrantsQuery.data?.registrant_Registrant.find((x) => x.id === registrantId);
            assert.truthy(registrant, `Failed to find registrant ${registrantId}`);
            insertProgramPersons.push({
                name: registrant.displayName,
                affiliation: registrant.profile?.affiliation,
                registrantId: registrant.id,
                conferenceId,
                email: registrant.invitation?.invitedEmailAddress,
            });
        }
    }

    if (insertProgramPersons.length > 0) {
        const newPeople = await insertProgramPeople[1](
            {
                objects: insertProgramPersons,
            },
            {
                fetchOptions: {
                    headers: {
                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                    },
                },
            }
        );
        assert.truthy(newPeople.data?.insert_collection_ProgramPerson?.returning, "Failed to insert content people");
        personIds.push(...newPeople.data.insert_collection_ProgramPerson.returning.map((x) => x.id));
    }

    const newEventPeople: Schedule_EventProgramPerson_Insert_Input[] = [];
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

    await insertEventPeople(newEventPeople, insertEventPeopleQ);
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
                                    <AddEventPeople_SingleProgramPersonPanel
                                        events={filteredEvents}
                                        isExpanded={isExpanded}
                                        onClose={onClose}
                                    />
                                )}
                            </AccordionItem>
                            <RequireRole organizerRole>
                                <AccordionItem>
                                    {({ isExpanded }) => (
                                        <AddEventPeople_FromGroupPanel
                                            events={filteredEvents}
                                            isExpanded={isExpanded}
                                            onClose={onClose}
                                        />
                                    )}
                                </AccordionItem>
                            </RequireRole>
                            <RequireRole organizerRole>
                                <AccordionItem>
                                    {({ isExpanded }) => (
                                        <AddEventPeople_SingleRegistrantPanel
                                            events={filteredEvents}
                                            isExpanded={isExpanded}
                                            onClose={onClose}
                                        />
                                    )}
                                </AccordionItem>
                            </RequireRole>
                        </Accordion>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
