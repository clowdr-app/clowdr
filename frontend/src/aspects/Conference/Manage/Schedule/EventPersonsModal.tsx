import { gql, Reference } from "@apollo/client";
import {
    Box,
    Button,
    Center,
    FormLabel,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Text,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentPersonInfoFragment,
    EventInfoFragment,
    EventInfoFragmentDoc,
    EventPersonInfoFragment,
    EventPersonInfoFragmentDoc,
    EventPersonRole_Enum,
    EventPerson_Insert_Input,
    RoomMode_Enum,
    useDeleteEventPersonsMutation,
    useInsertEventPersonMutation,
    useUpdateEventPersonMutation,
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

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    event: EventInfoFragment;
    contentPeople: readonly ContentPersonInfoFragment[];
    yellow: string;
}

gql`
    mutation InsertEventPerson($newEventPerson: EventPerson_insert_input!) {
        insert_EventPerson_one(object: $newEventPerson) {
            ...EventPersonInfo
        }
    }

    mutation DeleteEventPersons($deleteEventPeopleIds: [uuid!]!) {
        delete_EventPerson(where: { id: { _in: $deleteEventPeopleIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateEventPerson($id: uuid!, $personId: uuid!, $roleName: EventPersonRole_enum!) {
        update_EventPerson_by_pk(pk_columns: { id: $id }, _set: { personId: $personId, roleName: $roleName }) {
            ...EventPersonInfo
        }
    }
`;

export function requiresEventPeople(event: EventInfoFragment): boolean {
    return (
        (!event.eventPeople || event.eventPeople.length === 0) &&
        (event.intendedRoomModeName === RoomMode_Enum.Presentation ||
            event.intendedRoomModeName === RoomMode_Enum.QAndA)
    );
}

export function EventPersonsModal({ isOpen, onOpen, onClose, event, contentPeople }: Props): JSX.Element {
    const data = useMemo(() => [...event.eventPeople], [event.eventPeople]);

    const options = useMemo(() => {
        return [...contentPeople]
            .sort((x, y) => x.name.localeCompare(y.name))
            .map((person) => (
                <option key={person.id} value={person.id}>
                    {person.name}
                </option>
            ));
    }, [contentPeople]);

    const [insertEventPerson, insertEventPersonResponse] = useInsertEventPersonMutation();
    const [updateEventPerson, updateEventPersonResponse] = useUpdateEventPersonMutation();
    const [deleteEventPersons, deleteEventPersonsResponse] = useDeleteEventPersonsMutation();

    const row: RowSpecification<EventPersonInfoFragment> = useMemo(
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
            Object.keys(EventPersonRole_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (EventPersonRole_Enum as any)[x];
                    return { value: v, label: formatEnumValue(v) };
                }),
        []
    );

    const columns: ColumnSpecification<EventPersonInfoFragment>[] = useMemo(
        () => [
            {
                id: "ContentPerson",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<EventPersonInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Attendee</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Attendee{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => contentPeople.find((x) => x.id === data.personId),
                set: (record, value: ContentPersonInfoFragment | undefined) => {
                    record.personId = value?.id;
                },
                sort: (x: ContentPersonInfoFragment | undefined, y: ContentPersonInfoFragment | undefined) =>
                    x && y
                        ? x.name.localeCompare(y.name) ||
                          maybeCompare(x.affiliation, y.affiliation, (a, b) => a.localeCompare(b))
                        : x
                        ? 1
                        : y
                        ? -1
                        : 0,
                cell: function ContentPersonCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                }: CellProps<Partial<EventPersonInfoFragment>, ContentPersonInfoFragment | undefined>) {
                    if (isInCreate) {
                        return (
                            <HStack>
                                <Select
                                    value={value?.id ?? ""}
                                    onChange={(ev) => onChange?.(contentPeople.find((x) => x.id === ev.target.value))}
                                    onBlur={onBlur}
                                >
                                    <option value="">Select a person</option>
                                    {options}
                                </Select>
                            </HStack>
                        );
                    } else {
                        return (
                            <>
                                {value
                                    ? `${value.name} ${value.affiliation ? `(${value.affiliation})` : ""}`
                                    : "Person not found"}
                            </>
                        );
                    }
                },
            },
            {
                id: "role",
                header: function RoleHeader(props: ColumnHeaderProps<EventPersonInfoFragment>) {
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
                sort: (x: RoomMode_Enum, y: RoomMode_Enum) => x.localeCompare(y),
                cell: function EventNameCell(props: CellProps<Partial<EventPersonInfoFragment>>) {
                    return (
                        <Select
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value as RoomMode_Enum)}
                            onBlur={props.onBlur}
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
        [options, contentPeople, roleOptions]
    );

    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    useEffect(() => {
        if (insertEventPersonResponse.error || updateEventPersonResponse.error || deleteEventPersonsResponse.error) {
            forceReloadRef.current?.();
        }
    }, [deleteEventPersonsResponse.error, insertEventPersonResponse.error, updateEventPersonResponse.error]);

    const eventPeopleRequired = requiresEventPeople(event);
    return (
        <>
            <Box>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme={eventPeopleRequired ? "orange" : "blue"}>
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
                            <CRUDTable
                                data={data}
                                tableUniqueName="ManageConferenceSchedule_EventPersonsModal"
                                row={row}
                                columns={columns}
                                insert={{
                                    ongoing: insertEventPersonResponse.loading,
                                    generateDefaults: () => ({
                                        id: uuidv4(),
                                        eventId: event.id,
                                        roleName: EventPersonRole_Enum.Presenter,
                                    }),
                                    makeWhole: (d) => d.personId && (d as EventPersonInfoFragment),
                                    start: (record) => {
                                        assert(record.roleName);
                                        assert(record.personId);
                                        const newEventPerson: EventPerson_Insert_Input = {
                                            id: uuidv4(),
                                            eventId: event.id,
                                            personId: record.personId,
                                            roleName: record.roleName,
                                        };
                                        insertEventPerson({
                                            variables: {
                                                newEventPerson,
                                            },
                                            update: (cache, { data: _data }) => {
                                                if (_data?.insert_EventPerson_one) {
                                                    const data = _data.insert_EventPerson_one;
                                                    cache.modify({
                                                        fields: {
                                                            Event: (existingRefs: Reference[] = [], { readField }) => {
                                                                const eventRef = existingRefs.find(
                                                                    (ref) => readField("id", ref) === event.id
                                                                );
                                                                assert(eventRef);

                                                                const frag = cache.readFragment<EventInfoFragment>({
                                                                    fragment: EventInfoFragmentDoc,
                                                                    fragmentName: "EventInfo",
                                                                    id: eventRef.__ref,
                                                                });
                                                                if (
                                                                    frag &&
                                                                    !frag.eventPeople.some((p) => p.id === data.id)
                                                                ) {
                                                                    cache.writeFragment<EventInfoFragment>({
                                                                        fragment: EventInfoFragmentDoc,
                                                                        fragmentName: "EventInfo",
                                                                        data: {
                                                                            ...frag,
                                                                            eventPeople: [...frag.eventPeople, data],
                                                                        },
                                                                    });
                                                                }
                                                                return existingRefs;
                                                            },
                                                            EventPerson(existingRefs: Reference[] = [], { readField }) {
                                                                const newRef = cache.writeFragment({
                                                                    data,
                                                                    fragment: EventPersonInfoFragmentDoc,
                                                                    fragmentName: "EventPersonInfo",
                                                                });
                                                                if (
                                                                    existingRefs.some(
                                                                        (ref) => readField("id", ref) === data.id
                                                                    )
                                                                ) {
                                                                    return existingRefs;
                                                                }

                                                                return [...existingRefs, newRef];
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });
                                    },
                                }}
                                update={{
                                    ongoing: updateEventPersonResponse.loading,
                                    start: (record) => {
                                        updateEventPerson({
                                            variables: {
                                                id: record.id,
                                                roleName: record.roleName,
                                                personId: record.personId,
                                            },
                                            update: (cache, { data: _data }) => {
                                                if (_data?.update_EventPerson_by_pk) {
                                                    const data = _data.update_EventPerson_by_pk;
                                                    cache.modify({
                                                        fields: {
                                                            EventPerson(existingRefs: Reference[] = [], { readField }) {
                                                                const newRef = cache.writeFragment({
                                                                    data,
                                                                    fragment: EventPersonInfoFragmentDoc,
                                                                    fragmentName: "EventPersonInfo",
                                                                });
                                                                if (
                                                                    existingRefs.some(
                                                                        (ref) => readField("id", ref) === data.id
                                                                    )
                                                                ) {
                                                                    return existingRefs;
                                                                }
                                                                return [...existingRefs, newRef];
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });
                                    },
                                }}
                                delete={{
                                    ongoing: deleteEventPersonsResponse.loading,
                                    start: (keys) => {
                                        deleteEventPersons({
                                            variables: {
                                                deleteEventPeopleIds: keys,
                                            },
                                            update: (cache, { data: _data }) => {
                                                if (_data?.delete_EventPerson) {
                                                    const datas = _data.delete_EventPerson;
                                                    const ids = datas.returning.map((x) => x.id);
                                                    cache.modify({
                                                        fields: {
                                                            Event: (existingRefs: Reference[] = [], { readField }) => {
                                                                const eventRef = existingRefs.find(
                                                                    (ref) => readField("id", ref) === event.id
                                                                );
                                                                assert(eventRef);

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
                                                                            eventPeople: frag.eventPeople.filter(
                                                                                (p) => !ids.includes(p.id)
                                                                            ),
                                                                        },
                                                                    });
                                                                }
                                                                return existingRefs;
                                                            },
                                                            EventPerson(existingRefs: Reference[] = [], { readField }) {
                                                                for (const id of ids) {
                                                                    cache.evict({
                                                                        id,
                                                                        fieldName: "EventPersonInfo",
                                                                        broadcast: true,
                                                                    });
                                                                }

                                                                return existingRefs.filter(
                                                                    (ref) => !ids.includes(readField("id", ref))
                                                                );
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });
                                    },
                                }}
                                alert={
                                    insertEventPersonResponse.error ||
                                    updateEventPersonResponse.error ||
                                    deleteEventPersonsResponse.error
                                        ? {
                                              status: "error",
                                              title: "Error saving changes",
                                              description:
                                                  insertEventPersonResponse.error?.message ??
                                                  updateEventPersonResponse.error?.message ??
                                                  deleteEventPersonsResponse.error?.message ??
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
