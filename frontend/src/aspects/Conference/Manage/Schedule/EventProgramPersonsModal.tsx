import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    Center,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import type { LegacyRef } from "react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "urql";
import { v4 as uuidv4 } from "uuid";
import type {
    AddEventPeople_SelectProgramPeople_ByRegistrantQuery,
    AddEventPeople_SelectProgramPeople_ByRegistrantQueryVariables,
    EventInfoFragment,
    EventProgramPersonInfoFragment,
    ProgramPersonInfoFragment,
    Schedule_EventProgramPerson_Insert_Input,
} from "../../../../generated/graphql";
import {
    AddEventPeople_SelectProgramPeople_ByRegistrantDocument,
    Schedule_EventProgramPersonRole_Enum,
    Schedule_Mode_Enum,
    useAddEventPeople_InsertEventPeopleMutation,
    useAddEventPeople_InsertProgramPeopleMutation,
    useAddEventPeople_SelectRegistrantsQuery,
    useDeleteEventProgramPersonsMutation,
    useInsertEventProgramPersonMutation,
    useUpdateEventProgramPersonMutation,
} from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { formatEnumValue } from "../../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
} from "../../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../../CRUDTable2/CRUDTable2";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { maybeCompare } from "../../../Utils/maybeCompare";
import { addRegistrantsToEvent } from "./BatchAddEventPeople";

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    event: EventInfoFragment;
    programPeople: readonly ProgramPersonInfoFragment[];
    yellow: string;
}

gql`
    fragment EventInfo on schedule_Event {
        conferenceId
        subconferenceId
        id
        eventPeople {
            ...EventProgramPersonInfo
        }
        id
        modeName
        name
        roomId
        scheduledStartTime
        scheduledEndTime
        itemId
        exhibitionId
        shufflePeriodId
        enableRecording
        automaticParticipationSurvey
        autoPlayElementId
    }

    fragment EventProgramPersonInfo on schedule_EventProgramPerson {
        id
        eventId
        roleName
        personId
    }

    mutation InsertEventProgramPerson($newEventProgramPerson: schedule_EventProgramPerson_insert_input!) {
        insert_schedule_EventProgramPerson_one(
            object: $newEventProgramPerson
            on_conflict: { constraint: EventProgramPerson_eventId_personId_roleName_key, update_columns: [] }
        ) {
            ...EventProgramPersonInfo
        }
    }

    mutation DeleteEventProgramPersons($deleteEventPeopleIds: [uuid!]!) {
        delete_schedule_EventProgramPerson(where: { id: { _in: $deleteEventPeopleIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateEventProgramPerson($id: uuid!, $roleName: schedule_EventProgramPersonRole_enum!) {
        update_schedule_EventProgramPerson_by_pk(pk_columns: { id: $id }, _set: { roleName: $roleName }) {
            ...EventProgramPersonInfo
        }
    }
`;

export function requiresEventPeople(event: EventInfoFragment): boolean {
    return (!event.eventPeople || event.eventPeople.length === 0) && event.modeName === Schedule_Mode_Enum.Livestream;
}

export function AddEventProgramPerson_RegistrantModal({
    event,
    closeOuter,
}: {
    event: EventInfoFragment;
    closeOuter: () => void;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [selectRegistrantsQuery] = useAddEventPeople_SelectRegistrantsQuery({
        variables: {
            conferenceId: event.conferenceId,
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
                : undefined,
        [selectRegistrantsQuery.data]
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(Schedule_EventProgramPersonRole_Enum)
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
                event.conferenceId,
                event.subconferenceId,
                [event],
                selectedRole,
                insertEventPeopleQ
            );

            setAdding(false);
            onClose();
            closeOuter();
            toast({
                title: `Registrant added to ${newEventPeople.length} event`,
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
        event,
        selectedRole,
        insertEventPeopleQ,
        onClose,
        closeOuter,
        toast,
        client,
    ]);

    return (
        <>
            <Button onClick={onOpen}>Add registrant</Button>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add registrant to event</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {error || selectRegistrantsQuery.error ? (
                            <Alert
                                status="error"
                                variant="subtle"
                                mb={4}
                                justifyContent="flex-start"
                                alignItems="flex-start"
                            >
                                <AlertIcon />
                                <VStack justifyContent="flex-start" alignItems="flex-start">
                                    <AlertTitle>
                                        {error
                                            ? "Error adding registrant to event"
                                            : "Error loading list of registrants"}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {error ?? selectRegistrantsQuery.error?.message}
                                    </AlertDescription>
                                </VStack>
                            </Alert>
                        ) : undefined}
                        {registrantOptions ? (
                            <>
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
                                    onChange={(ev) =>
                                        setSelectedRole(ev.target.value as Schedule_EventProgramPersonRole_Enum)
                                    }
                                    mb={4}
                                >
                                    {roleOptions.filter(
                                        (x) => x.props.value !== Schedule_EventProgramPersonRole_Enum.Participant
                                    )}
                                </Select>
                            </>
                        ) : (
                            <Spinner label="Loading registrants" />
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <ButtonGroup>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button
                                colorScheme="purple"
                                isDisabled={selectRegistrantsQuery.fetching || selectedRegistrantId === ""}
                                isLoading={adding}
                                onClick={add}
                            >
                                Add
                            </Button>
                        </ButtonGroup>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

export function EventProgramPersonsModal({ isOpen, onOpen, onClose, event, programPeople }: Props): JSX.Element {
    const data = useMemo(() => [...event.eventPeople], [event.eventPeople]);

    const options = useMemo(() => {
        return [...programPeople]
            .sort((x, y) => maybeCompare(x.name, y.name, (a, b) => a.localeCompare(b)))
            .map((person) => (
                <option key={person.id} value={person.id}>
                    {person.name}
                </option>
            ));
    }, [programPeople]);

    const [insertEventProgramPersonResponse, insertEventProgramPerson] = useInsertEventProgramPersonMutation();
    const [updateEventProgramPersonResponse, updateEventProgramPerson] = useUpdateEventProgramPersonMutation();
    const [deleteEventProgramPersonsResponse, deleteEventProgramPersons] = useDeleteEventProgramPersonsMutation();

    const row: RowSpecification<EventProgramPersonInfoFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        []
    );

    const roleOptions = useMemo(
        () =>
            Object.keys(Schedule_EventProgramPersonRole_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (Schedule_EventProgramPersonRole_Enum as any)[x];
                    return { value: v, label: formatEnumValue(v) };
                }),
        []
    );

    const columns: ColumnSpecification<EventProgramPersonInfoFragment>[] = useMemo(
        () => [
            {
                id: "ProgramPerson",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventProgramPersonInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Person</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Person{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => programPeople.find((x) => x.id === data.personId),
                set: (record, value: ProgramPersonInfoFragment | undefined) => {
                    record.personId = value?.id;
                },
                sort: (x: ProgramPersonInfoFragment | undefined, y: ProgramPersonInfoFragment | undefined) =>
                    x && y
                        ? maybeCompare(x.name, y.name, (a, b) => a.localeCompare(b)) ||
                          maybeCompare(x.affiliation, y.affiliation, (a, b) => a.localeCompare(b))
                        : x
                        ? 1
                        : y
                        ? -1
                        : 0,
                cell: function ProgramPersonCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<EventProgramPersonInfoFragment>, ProgramPersonInfoFragment | undefined>) {
                    if (isInCreate) {
                        return (
                            <Select
                                value={value?.id ?? ""}
                                onChange={(ev) => onChange?.(programPeople.find((x) => x.id === ev.target.value))}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                <option value="">Select a person</option>
                                {options}
                            </Select>
                        );
                    } else {
                        return (
                            <>
                                {value
                                    ? `${value.name}${value.affiliation ? ` (${value.affiliation})` : ""}`
                                    : "Person not found"}
                            </>
                        );
                    }
                },
            },
            {
                id: "role",
                header: function RoleHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventProgramPersonInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Role</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Role{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.roleName,
                set: (record, value) => {
                    record.roleName = value;
                },
                sort: (x: Schedule_Mode_Enum, y: Schedule_Mode_Enum) => x.localeCompare(y),
                cell: function EventNameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<EventProgramPersonInfoFragment>>) {
                    return (
                        <Select
                            value={value ?? ""}
                            onChange={(ev) => onChange?.(ev.target.value as Schedule_Mode_Enum)}
                            onBlur={onBlur}
                            ref={ref as LegacyRef<HTMLSelectElement>}
                        >
                            {roleOptions
                                .filter(
                                    (x) =>
                                        value === Schedule_EventProgramPersonRole_Enum.Participant ||
                                        x.value !== Schedule_EventProgramPersonRole_Enum.Participant
                                )
                                .map((option) => {
                                    return (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    );
                                })}
                        </Select>
                    );
                },
            },
        ],
        [options, programPeople, roleOptions]
    );

    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    useEffect(() => {
        if (
            insertEventProgramPersonResponse.error ||
            updateEventProgramPersonResponse.error ||
            deleteEventProgramPersonsResponse.error
        ) {
            forceReloadRef.current?.();
        }
    }, [
        deleteEventProgramPersonsResponse.error,
        insertEventProgramPersonResponse.error,
        updateEventProgramPersonResponse.error,
    ]);

    const eventPeopleRequired = requiresEventPeople(event);
    return (
        <>
            <Box>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme={eventPeopleRequired ? "yellow" : "blue"}>
                        {eventPeopleRequired ? <FAIcon iconStyle="s" icon="exclamation-triangle" mr={1} /> : undefined}{" "}
                        Manage Event People
                    </Button>
                    <Text as="p" mt={2}>
                        (People can be listed as presenters or chairs of events.)
                    </Text>
                </Center>
            </Box>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Event People</ModalHeader>
                    <ModalHeader paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic" fontWeight="normal">
                        &ldquo;{event.name}&rdquo;
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <AddEventProgramPerson_RegistrantModal event={event} closeOuter={onClose} />
                            <CRUDTable
                                data={data}
                                tableUniqueName="ManageConferenceSchedule_EventProgramPersonsModal"
                                row={row}
                                columns={columns}
                                insert={{
                                    ongoing: insertEventProgramPersonResponse.fetching,
                                    generateDefaults: () => ({
                                        id: uuidv4(),
                                        eventId: event.id,
                                        roleName: Schedule_EventProgramPersonRole_Enum.Presenter,
                                    }),
                                    makeWhole: (d) => d.personId && (d as EventProgramPersonInfoFragment),
                                    start: async (record) => {
                                        assert.truthy(record.roleName);
                                        assert.truthy(record.personId);
                                        const newEventProgramPerson: Schedule_EventProgramPerson_Insert_Input = {
                                            id: uuidv4(),
                                            eventId: event.id,
                                            personId: record.personId,
                                            roleName: record.roleName,
                                        };
                                        await insertEventProgramPerson(
                                            {
                                                newEventProgramPerson,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    },
                                }}
                                update={{
                                    ongoing: updateEventProgramPersonResponse.fetching,
                                    start: (record) => {
                                        updateEventProgramPerson(
                                            {
                                                id: record.id,
                                                roleName: record.roleName,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    },
                                }}
                                delete={{
                                    ongoing: deleteEventProgramPersonsResponse.fetching,
                                    start: (keys) => {
                                        deleteEventProgramPersons(
                                            {
                                                deleteEventPeopleIds: keys,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    },
                                }}
                                alert={
                                    insertEventProgramPersonResponse.error ||
                                    updateEventProgramPersonResponse.error ||
                                    deleteEventProgramPersonsResponse.error
                                        ? {
                                              status: "error",
                                              title: "Error saving changes",
                                              description:
                                                  extractActualError(
                                                      insertEventProgramPersonResponse.error ??
                                                          updateEventProgramPersonResponse.error ??
                                                          deleteEventProgramPersonsResponse.error
                                                  ) ?? "Unknown error",
                                          }
                                        : undefined
                                }
                                forceReload={forceReloadRef}
                            />
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="pink" mr={3} onClick={onClose}>
                            Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
