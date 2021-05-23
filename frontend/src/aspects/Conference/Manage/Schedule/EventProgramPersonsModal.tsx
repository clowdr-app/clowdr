import { gql, Reference } from "@apollo/client";
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
import assert from "assert";
import React, { LegacyRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    EventInfoFragment,
    EventInfoFragmentDoc,
    EventProgramPersonInfoFragment,
    EventProgramPersonInfoFragmentDoc,
    ProgramPersonInfoFragment,
    Room_Mode_Enum,
    Schedule_EventProgramPersonRole_Enum,
    Schedule_EventProgramPerson_Insert_Input,
    useAddEventPeople_InsertEventPeopleMutation,
    useAddEventPeople_InsertProgramPeopleMutation,
    useAddEventPeople_SelectProgramPeople_ByRegistrantQuery,
    useAddEventPeople_SelectRegistrantsQuery,
    useDeleteEventProgramPersonsMutation,
    useInsertEventProgramPersonMutation,
    useUpdateEventProgramPersonMutation,
} from "../../../../generated/graphql";
import { formatEnumValue } from "../../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../../CRUDTable2/CRUDTable2";
import FAIcon from "../../../Icons/FAIcon";
import { maybeCompare } from "../../../Utils/maybeSort";
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

    mutation UpdateEventProgramPerson($id: uuid!, $personId: uuid!, $roleName: schedule_EventProgramPersonRole_enum!) {
        update_schedule_EventProgramPerson_by_pk(
            pk_columns: { id: $id }
            _set: { personId: $personId, roleName: $roleName }
        ) {
            ...EventProgramPersonInfo
        }
    }
`;

export function requiresEventPeople(event: EventInfoFragment): boolean {
    return (
        (!event.eventPeople || event.eventPeople.length === 0) &&
        (event.intendedRoomModeName === Room_Mode_Enum.Presentation ||
            event.intendedRoomModeName === Room_Mode_Enum.QAndA)
    );
}

export function AddEventProgramPerson_RegistrantModal({
    event,
    closeOuter,
}: {
    event: EventInfoFragment;
    closeOuter: () => void;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const selectRegistrantsQuery = useAddEventPeople_SelectRegistrantsQuery({
        variables: {
            conferenceId: event.conferenceId,
        },
    });
    const selectProgramPeople_ByRegistrantQuery = useAddEventPeople_SelectProgramPeople_ByRegistrantQuery({
        skip: true,
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

    const add = useCallback(async () => {
        setAdding(true);
        setError(null);

        try {
            const newEventPeople: Schedule_EventProgramPerson_Insert_Input[] = await addRegistrantsToEvent(
                [selectedRegistrantId],
                selectRegistrantsQuery,
                selectProgramPeople_ByRegistrantQuery,
                insertProgramPeople,
                event.conferenceId,
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
        } catch (e) {
            setError(e.message || e.toString());
            setAdding(false);
        }
    }, [
        event,
        insertProgramPeople,
        insertEventPeopleQ,
        onClose,
        selectRegistrantsQuery,
        selectProgramPeople_ByRegistrantQuery,
        selectedRegistrantId,
        selectedRole,
        toast,
        closeOuter,
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
                                    {roleOptions}
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
                                isDisabled={selectRegistrantsQuery.loading || selectedRegistrantId === ""}
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
            .sort((x, y) => x.name.localeCompare(y.name))
            .map((person) => (
                <option key={person.id} value={person.id}>
                    {person.name}
                </option>
            ));
    }, [programPeople]);

    const [insertEventProgramPerson, insertEventProgramPersonResponse] = useInsertEventProgramPersonMutation();
    const [updateEventProgramPerson, updateEventProgramPersonResponse] = useUpdateEventProgramPersonMutation();
    const [deleteEventProgramPersons, deleteEventProgramPersonsResponse] = useDeleteEventProgramPersonsMutation();

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
                header: function NameHeader(props: ColumnHeaderProps<EventProgramPersonInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Person</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Person{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => programPeople.find((x) => x.id === data.personId),
                set: (record, value: ProgramPersonInfoFragment | undefined) => {
                    record.personId = value?.id;
                },
                sort: (x: ProgramPersonInfoFragment | undefined, y: ProgramPersonInfoFragment | undefined) =>
                    x && y
                        ? x.name.localeCompare(y.name) ||
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
                header: function RoleHeader(props: ColumnHeaderProps<EventProgramPersonInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Role</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Role{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.roleName,
                set: (record, value) => {
                    record.roleName = value;
                },
                sort: (x: Room_Mode_Enum, y: Room_Mode_Enum) => x.localeCompare(y),
                cell: function EventNameCell(props: CellProps<Partial<EventProgramPersonInfoFragment>>) {
                    return (
                        <Select
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value as Room_Mode_Enum)}
                            onBlur={props.onBlur}
                            ref={props.ref as LegacyRef<HTMLSelectElement>}
                        >
                            {roleOptions.map((option) => {
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
                                    ongoing: insertEventProgramPersonResponse.loading,
                                    generateDefaults: () => ({
                                        id: uuidv4(),
                                        eventId: event.id,
                                        roleName: Schedule_EventProgramPersonRole_Enum.Presenter,
                                    }),
                                    makeWhole: (d) => d.personId && (d as EventProgramPersonInfoFragment),
                                    start: async (record) => {
                                        assert(record.roleName);
                                        assert(record.personId);
                                        const newEventProgramPerson: Schedule_EventProgramPerson_Insert_Input = {
                                            id: uuidv4(),
                                            eventId: event.id,
                                            personId: record.personId,
                                            roleName: record.roleName,
                                        };
                                        await insertEventProgramPerson({
                                            variables: {
                                                newEventProgramPerson,
                                            },
                                            update: (cache, response) => {
                                                if (response.data?.insert_schedule_EventProgramPerson_one) {
                                                    const data = response.data.insert_schedule_EventProgramPerson_one;
                                                    cache.writeFragment({
                                                        data,
                                                        fragment: EventProgramPersonInfoFragmentDoc,
                                                        fragmentName: "EventProgramPersonInfo",
                                                    });

                                                    const frag = cache.readFragment<EventInfoFragment>({
                                                        id: cache.identify({
                                                            __typename: "schedule_Event",
                                                            id: event.id,
                                                        }),
                                                        fragment: EventInfoFragmentDoc,
                                                        fragmentName: "EventInfo",
                                                    });
                                                    if (frag) {
                                                        cache.writeFragment<EventInfoFragment>({
                                                            id: cache.identify(frag),
                                                            data: {
                                                                ...frag,
                                                                eventPeople: [...frag.eventPeople, data],
                                                            },
                                                            fragment: EventInfoFragmentDoc,
                                                            fragmentName: "EventInfo",
                                                        });
                                                    }
                                                }
                                            },
                                        });
                                    },
                                }}
                                update={{
                                    ongoing: updateEventProgramPersonResponse.loading,
                                    start: (record) => {
                                        updateEventProgramPerson({
                                            variables: {
                                                id: record.id,
                                                roleName: record.roleName,
                                                personId: record.personId,
                                            },
                                            update: (cache, { data: _data }) => {
                                                if (_data?.update_schedule_EventProgramPerson_by_pk) {
                                                    const data = _data.update_schedule_EventProgramPerson_by_pk;
                                                    cache.writeFragment({
                                                        data,
                                                        fragment: EventProgramPersonInfoFragmentDoc,
                                                        fragmentName: "EventProgramPersonInfo",
                                                    });
                                                }
                                            },
                                        });
                                    },
                                }}
                                delete={{
                                    ongoing: deleteEventProgramPersonsResponse.loading,
                                    start: (keys) => {
                                        deleteEventProgramPersons({
                                            variables: {
                                                deleteEventPeopleIds: keys,
                                            },
                                            update: (cache, { data: _data }) => {
                                                if (_data?.delete_schedule_EventProgramPerson) {
                                                    const datas = _data.delete_schedule_EventProgramPerson;
                                                    const ids = datas.returning.map((x) => x.id);
                                                    cache.modify({
                                                        fields: {
                                                            schedule_EventProgramPerson(
                                                                existingRefs: Reference[] = [],
                                                                { readField }
                                                            ) {
                                                                for (const id of ids) {
                                                                    cache.evict({
                                                                        id,
                                                                        fieldName: "EventProgramPersonInfo",
                                                                        broadcast: true,
                                                                    });
                                                                }

                                                                return existingRefs.filter(
                                                                    (ref) => !ids.includes(readField("id", ref))
                                                                );
                                                            },
                                                        },
                                                    });

                                                    const frag = cache.readFragment<EventInfoFragment>({
                                                        id: cache.identify({
                                                            __typename: "schedule_Event",
                                                            id: event.id,
                                                        }),
                                                        fragment: EventInfoFragmentDoc,
                                                        fragmentName: "EventInfo",
                                                    });
                                                    if (frag) {
                                                        cache.writeFragment<EventInfoFragment>({
                                                            id: cache.identify(frag),
                                                            data: {
                                                                ...frag,
                                                                eventPeople: frag.eventPeople.filter(
                                                                    (x) => !ids.includes(x.id)
                                                                ),
                                                            },
                                                            fragment: EventInfoFragmentDoc,
                                                            fragmentName: "EventInfo",
                                                        });
                                                    }
                                                }
                                            },
                                        });
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
                                                  insertEventProgramPersonResponse.error?.message ??
                                                  updateEventProgramPersonResponse.error?.message ??
                                                  deleteEventProgramPersonsResponse.error?.message ??
                                                  "Unknown error",
                                          }
                                        : undefined
                                }
                                forceReload={forceReloadRef}
                            />
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                            Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
