import { gql, Reference } from "@apollo/client";
import {
    Box,
    Button,
    Center,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    AttendeeInfoFragment,
    EventInfoFragment,
    EventInfoFragmentDoc,
    EventPersonInfoFragmentDoc,
    EventPersonRole_Enum,
    EventPerson_Insert_Input,
    useDeleteEventPersonsMutation,
    useInsertEventPersonMutation,
    useUpdateEventPersonMutation,
} from "../../../../generated/graphql";
import CRUDTable, {
    defaultSelectFilter,
    defaultStringFilter,
    FieldType,
    SelectOption,
    UpdateResult,
} from "../../../CRUDTable/CRUDTable";
import isValidUUID from "../../../Utils/isValidUUID";
import type { EventPersonDescriptor } from "./Types";

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    event: EventInfoFragment;
    attendees: readonly AttendeeInfoFragment[];
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

export function EventPersonsModal({ isOpen, onOpen, onClose, event, attendees }: Props): JSX.Element {
    const eventPersonsMap = useMemo(() => {
        const results = new Map<string, EventPersonDescriptor>();

        event.eventPeople.forEach((eventPerson) => {
            results.set(eventPerson.id, eventPerson);
        });

        return results;
    }, [event.eventPeople]);

    const attendeeOptions = useMemo(() => {
        return attendees.map((attendee) => ({
            label: `${attendee.displayName}`,
            value: attendee.id,
        }));
    }, [attendees]);

    const roleOptions: SelectOption[] = useMemo(() => {
        return Object.keys(EventPersonRole_Enum)
            .filter((key) => typeof (EventPersonRole_Enum as any)[key] === "string")
            .map((key) => {
                const v = (EventPersonRole_Enum as any)[key] as string;
                return {
                    label: key,
                    value: v,
                };
            });
    }, []);

    const [insertEventPerson] = useInsertEventPersonMutation();
    const [updateEventPerson] = useUpdateEventPersonMutation();
    const [deleteEventPersons] = useDeleteEventPersonsMutation();

    return (
        <>
            <Box>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme="blue">
                        Manage Event People
                    </Button>
                    <Text as="p">(People can be listed as presenters or chairs of events.)</Text>
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
                            <CRUDTable<EventPersonDescriptor, "id">
                                data={eventPersonsMap}
                                primaryFields={{
                                    keyField: {
                                        heading: "Id",
                                        ariaLabel: "Unique identifier",
                                        description: "Unique identifier",
                                        isHidden: true,
                                        insert: (item, v) => {
                                            return {
                                                ...item,
                                                id: v,
                                            };
                                        },
                                        extract: (v) => v.id,
                                        spec: {
                                            fieldType: FieldType.string,
                                            convertToUI: (x) => x,
                                            disallowSpaces: true,
                                        },
                                        validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                                        getRowTitle: (v) => v.name,
                                    },
                                    otherFields: {
                                        attendee: {
                                            heading: "Attendee",
                                            ariaLabel: "Attendee",
                                            description: "Attendee",
                                            isHidden: false,
                                            isEditable: false,
                                            isEditableAtCreate: true,
                                            defaultValue: null,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    attendeeId: v,
                                                };
                                            },
                                            extract: (item) => item.attendeeId,
                                            spec: {
                                                fieldType: FieldType.select,
                                                convertFromUI: (opt) => {
                                                    assert(!(opt instanceof Array) || opt.length === 1);
                                                    if (opt instanceof Array) {
                                                        return opt[0].value;
                                                    } else {
                                                        return opt.value;
                                                    }
                                                },
                                                convertToUI: (attendeeId) => {
                                                    if (!attendeeId) {
                                                        return {
                                                            label: "None selected",
                                                            value: null,
                                                        };
                                                    }
                                                    const opt = attendeeOptions.find((x) => x.value === attendeeId);
                                                    if (opt) {
                                                        return opt;
                                                    } else {
                                                        return {
                                                            label: `<Unknown (${attendeeId})>`,
                                                            value: attendeeId,
                                                        };
                                                    }
                                                },
                                                multiSelect: false,
                                                options: () => attendeeOptions,
                                                filter: defaultSelectFilter,
                                            },
                                        },
                                        role: {
                                            heading: "Role",
                                            ariaLabel: "Role",
                                            description: "Role",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: null,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    roleName: v,
                                                };
                                            },
                                            extract: (item) => item.roleName,
                                            spec: {
                                                fieldType: FieldType.select,
                                                convertFromUI: (opt) => {
                                                    assert(!(opt instanceof Array) || opt.length === 1);
                                                    if (opt instanceof Array) {
                                                        return opt[0].value;
                                                    } else {
                                                        return opt.value;
                                                    }
                                                },
                                                convertToUI: (roleName) => {
                                                    const opt = roleOptions.find((x) => x.value === roleName);
                                                    if (opt) {
                                                        return opt;
                                                    } else {
                                                        return {
                                                            label: `<Unknown (${roleName})>`,
                                                            value: roleName,
                                                        };
                                                    }
                                                },
                                                multiSelect: false,
                                                options: () => roleOptions,
                                                filter: defaultSelectFilter,
                                            },
                                        },
                                        affiliation: {
                                            heading: "Affiliation",
                                            ariaLabel: "Affiliation",
                                            description: "Affiliation",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: null,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    affiliation: v,
                                                };
                                            },
                                            extract: (item) => item.affiliation,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => (!x || x?.length === 0 ? null : x),
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (v) =>
                                                !v || v.length >= 3 || ["Affiliaton must be at least 3 characters"],
                                        },
                                    },
                                }}
                                csud={{
                                    cudCallbacks: {
                                        create: async (
                                            partialEventPerson: Partial<EventPersonDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialEventPerson.roleName);
                                            const newEventPerson: EventPerson_Insert_Input = {
                                                id: uuidv4(),
                                                eventId: event.id,
                                                conferenceId: event.conferenceId,
                                                name: partialEventPerson.roleName.toString(),
                                                attendeeId: partialEventPerson.attendeeId,
                                                roleName: partialEventPerson.roleName,
                                                affiliation: partialEventPerson.affiliation,
                                                originatingDataId: partialEventPerson.originatingDataId,
                                            };
                                            await insertEventPerson({
                                                variables: {
                                                    newEventPerson,
                                                },
                                                update: (cache, { data: _data }) => {
                                                    if (_data?.insert_EventPerson_one) {
                                                        const data = _data.insert_EventPerson_one;
                                                        cache.modify({
                                                            fields: {
                                                                Event: (
                                                                    existingRefs: Reference[] = [],
                                                                    { readField }
                                                                ) => {
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
                                                                                eventPeople: [
                                                                                    ...frag.eventPeople,
                                                                                    data,
                                                                                ],
                                                                            },
                                                                        });
                                                                    }
                                                                    return existingRefs;
                                                                },
                                                                EventPerson(
                                                                    existingRefs: Reference[] = [],
                                                                    { readField }
                                                                ) {
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
                                            return newEventPerson.id;
                                        },
                                        update: async (eventPersons): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, eventPerson] of eventPersons) {
                                                try {
                                                    await updateEventPerson({
                                                        variables: {
                                                            id: eventPerson.id,
                                                            name: eventPerson.name,
                                                            roleName: eventPerson.roleName,
                                                            affiliation: eventPerson.affiliation,
                                                            attendeeId: eventPerson.attendeeId,
                                                            originatingDataId: eventPerson.originatingDataId,
                                                        },
                                                        update: (cache, { data: _data }) => {
                                                            if (_data?.update_EventPerson_by_pk) {
                                                                const data = _data.update_EventPerson_by_pk;
                                                                cache.modify({
                                                                    fields: {
                                                                        EventPerson(
                                                                            existingRefs: Reference[] = [],
                                                                            { readField }
                                                                        ) {
                                                                            const newRef = cache.writeFragment({
                                                                                data,
                                                                                fragment: EventPersonInfoFragmentDoc,
                                                                                fragmentName: "EventPersonInfo",
                                                                            });
                                                                            if (
                                                                                existingRefs.some(
                                                                                    (ref) =>
                                                                                        readField("id", ref) === data.id
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
                                                    results.set(key, true);
                                                } catch (e) {
                                                    results.set(key, e.toString());
                                                }
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            let ok = false;
                                            try {
                                                await deleteEventPersons({
                                                    variables: {
                                                        deleteEventPeopleIds: [...keys.values()],
                                                    },
                                                    update: (cache, { data: _data }) => {
                                                        if (_data?.delete_EventPerson) {
                                                            const datas = _data.delete_EventPerson;
                                                            const ids = datas.returning.map((x) => x.id);
                                                            cache.modify({
                                                                fields: {
                                                                    Event: (
                                                                        existingRefs: Reference[] = [],
                                                                        { readField }
                                                                    ) => {
                                                                        const eventRef = existingRefs.find(
                                                                            (ref) => readField("id", ref) === event.id
                                                                        );
                                                                        assert(eventRef);

                                                                        const frag = cache.readFragment<
                                                                            EventInfoFragment
                                                                        >({
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
                                                                    EventPerson(
                                                                        existingRefs: Reference[] = [],
                                                                        { readField }
                                                                    ) {
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
                                                ok = true;
                                            } catch (e) {
                                                ok = false;
                                            }
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, ok);
                                            }
                                            return results;
                                        },
                                    },
                                }}
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
