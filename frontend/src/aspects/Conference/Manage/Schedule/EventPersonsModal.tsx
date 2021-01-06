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
import { EventPersonRole_Enum } from "../../../../generated/graphql";
import CRUDTable, {
    CRUDTableProps,
    defaultSelectFilter,
    defaultStringFilter,
    FieldType,
    SelectOption,
    UpdateResult,
} from "../../../CRUDTable/CRUDTable";
import isValidUUID from "../../../Utils/isValidUUID";
import type { AttendeeDescriptor, EventDescriptor, EventPersonDescriptor } from "./Types";

const EventPersonsCRUDTable = (props: Readonly<CRUDTableProps<EventPersonDescriptor, "id">>) => CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    isEventDirty: boolean;
    event: EventDescriptor;
    attendeeMap: Map<string, AttendeeDescriptor>;
    insertEventPerson: (eventPerson: EventPersonDescriptor) => void;
    updateEventPerson: (eventPerson: EventPersonDescriptor) => void;
    deleteEventPerson: (eventPersonId: string) => void;
}

export function EventPersonsModal({
    isOpen,
    onOpen,
    onClose,
    isEventDirty,
    event,
    attendeeMap,
    insertEventPerson,
    updateEventPerson,
    deleteEventPerson,
}: Props): JSX.Element {
    const eventPersonsMap = useMemo(() => {
        const results = new Map<string, EventPersonDescriptor>();

        event.people.forEach((eventPerson) => {
            results.set(eventPerson.id, eventPerson);
        });

        return results;
    }, [event.people]);

    const attendeeOptions = useMemo(() => {
        return Array.from(attendeeMap.values()).map((attendee) => ({
            label: `${attendee.displayName}`,
            value: attendee.id,
        }));
    }, [attendeeMap]);

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
                            <EventPersonsCRUDTable
                                data={eventPersonsMap}
                                externalUnsavedChanges={isEventDirty}
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
                                            const newEventPerson: EventPersonDescriptor = {
                                                id: uuidv4(),
                                                isNew: true,
                                                eventId: event.id,
                                                name: partialEventPerson.roleName.toString(),
                                                attendeeId: partialEventPerson.attendeeId,
                                                roleName: partialEventPerson.roleName,
                                            };
                                            insertEventPerson(newEventPerson);
                                            return newEventPerson.id;
                                        },
                                        update: async (eventPersons): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, eventPerson] of eventPersons) {
                                                results.set(key, true);
                                                updateEventPerson(eventPerson);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteEventPerson(key);
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
