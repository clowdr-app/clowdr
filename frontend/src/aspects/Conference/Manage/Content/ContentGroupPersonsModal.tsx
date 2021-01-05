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
import CRUDTable, {
    CRUDTableProps,
    defaultIntegerFilter,
    defaultSelectFilter,
    FieldType,
    UpdateResult,
} from "../../../CRUDTable/CRUDTable";
import isValidUUID from "../../../Utils/isValidUUID";
import { useConference } from "../../useConference";
import {
    ContentGroupDescriptor,
    ContentGroupPersonDescriptor,
    ContentPersonDescriptor,
    ContentRoleNames,
} from "./Types";

const ContentGroupPersonCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupPersonDescriptor, "id">>) =>
    CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    isGroupDirty: boolean;
    group: ContentGroupDescriptor;
    peopleMap: Map<string, ContentPersonDescriptor>;
    insertContentGroupPerson: (contentGroupPerson: ContentGroupPersonDescriptor) => void;
    updateContentGroupPerson: (contentGroupPerson: ContentGroupPersonDescriptor) => void;
    deleteContentGroupPerson: (contentGroupPersonId: string) => void;
}

export default function ContentGroupPersonsModal({
    isOpen,
    onOpen,
    onClose,
    isGroupDirty,
    group,
    peopleMap,
    insertContentGroupPerson,
    updateContentGroupPerson,
    deleteContentGroupPerson,
}: Props): JSX.Element {
    const contentGroupPersonsMap = useMemo(() => {
        const results = new Map<string, ContentGroupPersonDescriptor>();

        group.people.forEach((contentGroupPerson) => {
            results.set(contentGroupPerson.id, contentGroupPerson);
        });

        return results;
    }, [group.people]);

    const personOptions = useMemo(() => {
        return Array.from(peopleMap.values()).map((person) => ({
            label: `${person.name} (${person.affiliation})`,
            value: person.id,
        }));
    }, [peopleMap]);

    const roleOptions = useMemo(() => {
        return ContentRoleNames.map((roleName) => ({
            label: roleName[0] + roleName.toLowerCase().substr(1),
            value: roleName,
        }));
    }, []);

    const conference = useConference();

    return (
        <>
            <Box mt={4}>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme="blue">
                        Manage Content People
                    </Button>
                    <Text mt={2} as="p">
                        (People can be listed as presenters, authors, chairs and other such roles for content and
                        events.)
                    </Text>
                </Center>
            </Box>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Content People</ModalHeader>
                    <ModalHeader paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic" fontWeight="normal">
                        &ldquo;{group.title}&bdquo;
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <ContentGroupPersonCRUDTable
                                data={contentGroupPersonsMap}
                                externalUnsavedChanges={isGroupDirty}
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
                                        getRowTitle: (v) => {
                                            const person = peopleMap.get(v.personId);
                                            assert(person);
                                            return person.name;
                                        },
                                    },
                                    otherFields: {
                                        person: {
                                            heading: "Person",
                                            ariaLabel: "Person",
                                            description: "Person",
                                            isHidden: false,
                                            isEditable: false,
                                            isEditableAtCreate: true,
                                            defaultValue: null,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    personId: v,
                                                };
                                            },
                                            extract: (item) => item.personId,
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
                                                convertToUI: (personId) => {
                                                    const opt = personOptions.find((x) => x.value === personId);
                                                    if (opt) {
                                                        return opt;
                                                    } else {
                                                        return {
                                                            label: `<Unknown (${personId})>`,
                                                            value: personId,
                                                        };
                                                    }
                                                },
                                                multiSelect: false,
                                                options: () => personOptions,
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
                                        priority: {
                                            heading: "Priority",
                                            ariaLabel: "Priority",
                                            description:
                                                "Priority determines the order people are listed when displayed on item pages. Ascending sort (lowest first).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: group.people.length - 1,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    priority: v,
                                                };
                                            },
                                            extract: (v) => v.priority,
                                            spec: {
                                                fieldType: FieldType.integer,
                                                convertToUI: (x) => x,
                                                convertFromUI: (x) => x,
                                                filter: defaultIntegerFilter,
                                            },
                                        },
                                    },
                                }}
                                csud={{
                                    cudCallbacks: {
                                        create: async (
                                            partialContentGroupPerson: Partial<ContentGroupPersonDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialContentGroupPerson.personId);
                                            assert(partialContentGroupPerson.roleName);
                                            const newContentGroupPerson: ContentGroupPersonDescriptor = {
                                                id: uuidv4(),
                                                isNew: true,
                                                conferenceId: conference.id,
                                                groupId: group.id,
                                                personId: partialContentGroupPerson.personId,
                                                roleName: partialContentGroupPerson.roleName,
                                                priority: partialContentGroupPerson.priority,
                                            };
                                            insertContentGroupPerson(newContentGroupPerson);
                                            return newContentGroupPerson.id;
                                        },
                                        update: async (contentGroupPersons): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, contentGroupPerson] of contentGroupPersons) {
                                                results.set(key, true);
                                                updateContentGroupPerson(contentGroupPerson);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteContentGroupPerson(key);
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
