import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import CRUDTable, { CRUDTableProps, defaultStringFilter, FieldType, UpdateResult } from "../../../CRUDTable/CRUDTable";
import isValidUUID from "../../../Utils/isValidUUID";
import { useConference } from "../../useConference";
import type { ContentPersonDescriptor } from "./Types";

const PersonCRUDTable = (props: Readonly<CRUDTableProps<ContentPersonDescriptor, "id">>) => CRUDTable(props);

// TODO: Handle duplicate email addresses (edit/create)
// TODO: Handle duplicate name+affiliation (edit/create)

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    persons: Map<string, ContentPersonDescriptor>;
    arePersonsEdited: boolean;
    insertPerson: (person: ContentPersonDescriptor) => void;
    updatePerson: (person: ContentPersonDescriptor) => void;
    deletePerson: (personId: string) => void;
}

export default function ManagePersonsModal({
    isOpen,
    onClose,
    persons,
    arePersonsEdited,
    insertPerson,
    updatePerson,
    deletePerson,
}: Props): JSX.Element {
    const conference = useConference();

    return (
        <>
            <Modal isCentered onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage People</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <PersonCRUDTable
                                data={persons}
                                externalUnsavedChanges={arePersonsEdited}
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
                                        name: {
                                            heading: "Name",
                                            ariaLabel: "Name",
                                            description: "Name",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: "",
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    name: v,
                                                };
                                            },
                                            extract: (v) => v.name,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => x,
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (v) => v.length >= 3 || ["Name must be at least 3 characters"],
                                        },
                                        affiliation: {
                                            heading: "Affiliation",
                                            ariaLabel: "Affiliation",
                                            description: "The person's affiliation address.",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: "",
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    affiliation: v,
                                                };
                                            },
                                            extract: (v) => v.affiliation,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => x,
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (_v) => true, // TODO
                                        },
                                        email: {
                                            heading: "Email",
                                            ariaLabel: "Email",
                                            description: "The person's email address.",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: "",
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    email: v,
                                                };
                                            },
                                            extract: (v) => v.email,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => x,
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (_v) => true, // TODO
                                        },
                                    },
                                }}
                                csud={{
                                    cudCallbacks: {
                                        create: async (partialPerson: Partial<ContentPersonDescriptor>): Promise<string | null> => {
                                            assert(partialPerson.affiliation);
                                            assert(partialPerson.name);
                                            const newPerson: ContentPersonDescriptor = {
                                                affiliation: partialPerson.affiliation,
                                                id: uuidv4(),
                                                name: partialPerson.name,
                                                email: partialPerson.email,
                                                conferenceId: conference.id,
                                                isNew: true,
                                            };
                                            insertPerson(newPerson);
                                            return newPerson.id;
                                        },
                                        update: async (persons): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, person] of persons) {
                                                results.set(key, true);
                                                updatePerson(person);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deletePerson(key);
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
