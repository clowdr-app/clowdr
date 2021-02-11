import { gql, Reference } from "@apollo/client";
import {
    Box,
    Button,
    Center,
    FormLabel,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Text,
    Tooltip,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    AttendeeInfoFragment,
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
import { LinkButton } from "../../../Chakra/LinkButton";
import { formatEnumValue } from "../../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../../CRUDTable2/CRUDTable2";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    event: EventInfoFragment;
    attendees: readonly AttendeeInfoFragment[];
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

    mutation UpdateEventPersonInfo(
        $id: uuid!
        $attendeeId: uuid = null
        $name: String!
        $affiliation: String = null
        $roleName: EventPersonRole_enum!
        $originatingDataId: uuid = null
    ) {
        update_EventPerson_by_pk(
            pk_columns: { id: $id }
            _set: {
                attendeeId: $attendeeId
                name: $name
                affiliation: $affiliation
                roleName: $roleName
                originatingDataId: $originatingDataId
            }
        ) {
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

export function EventPersonsModal({ isOpen, onOpen, onClose, event, attendees }: Props): JSX.Element {
    const data = useMemo(() => [...event.eventPeople], [event.eventPeople]);

    const attendeeOptions = useMemo(() => {
        return attendees.map((attendee) => (
            <option key={attendee.id} value={attendee.id}>
                {attendee.displayName}
            </option>
        ));
    }, [attendees]);

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

    const conference = useConference();

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
                id: "Attendee",
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
                get: (data) => attendees.find((x) => x.id === data.attendeeId),
                set: (record, value: AttendeeInfoFragment | undefined) => {
                    record.attendeeId = value?.id;
                },
                sort: (x: AttendeeInfoFragment | undefined, y: AttendeeInfoFragment | undefined) =>
                    x && y ? x.displayName.localeCompare(y.displayName) : x ? 1 : y ? -1 : 0,
                cell: function AttendeeCell(
                    props: CellProps<Partial<EventPersonInfoFragment>, AttendeeInfoFragment | undefined>
                ) {
                    if (props.isInCreate) {
                        return (
                            <HStack>
                                {props.value ? (
                                    <LinkButton
                                        linkProps={{ target: "_blank" }}
                                        to={`/conference/${conference.slug}/profile/view/${props.value.id}`}
                                        size="xs"
                                        aria-label="Go to attendee in new tab"
                                    >
                                        <Tooltip label="Go to attendee in new tab">
                                            <FAIcon iconStyle="s" icon="link" />
                                        </Tooltip>
                                    </LinkButton>
                                ) : undefined}
                                <Select
                                    value={props.value?.id ?? ""}
                                    onChange={(ev) => props.onChange?.(attendees.find((x) => x.id === ev.target.value))}
                                    onBlur={props.onBlur}
                                >
                                    <option value="">Select an attendee</option>
                                    {attendeeOptions}
                                </Select>
                            </HStack>
                        );
                    } else {
                        return <>{props.value?.displayName ?? "Attendee not found"}</>;
                    }
                },
            },
            {
                id: "affiliation",
                header: function AffiliationHeader(props: ColumnHeaderProps<EventPersonInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Affiliation</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Affiliation{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.affiliation,
                set: (record, value: string) => {
                    record.affiliation = value;
                },
                sort: (x: string | undefined, y: string | undefined) =>
                    x && y ? x.localeCompare(y) : x ? 1 : y ? -1 : 0,
                cell: function AffiliationCell(props: CellProps<Partial<EventPersonInfoFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                        />
                    );
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
        [attendeeOptions, attendees, conference.slug, roleOptions]
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
                                        conferenceId: event.conferenceId,
                                        eventId: event.id,
                                        name: "",
                                        attendeeId: undefined,
                                        roleName: EventPersonRole_Enum.Presenter,
                                        affiliation: undefined,
                                        originatingDataId: undefined,
                                    }),
                                    makeWhole: (d) => d.attendeeId && (d as EventPersonInfoFragment),
                                    start: (record) => {
                                        assert(record.roleName);
                                        const newEventPerson: EventPerson_Insert_Input = {
                                            id: uuidv4(),
                                            eventId: event.id,
                                            conferenceId: event.conferenceId,
                                            name: record.roleName.toString(),
                                            attendeeId: record.attendeeId,
                                            roleName: record.roleName,
                                            affiliation: record.affiliation,
                                            originatingDataId: record.originatingDataId,
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
                                                                console.log(frag);
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
                                                name: record.name,
                                                roleName: record.roleName,
                                                affiliation: record.affiliation,
                                                attendeeId: record.attendeeId,
                                                originatingDataId: record.originatingDataId,
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
                                                                console.log(frag);
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
