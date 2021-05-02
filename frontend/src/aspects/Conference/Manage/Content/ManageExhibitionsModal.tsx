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
import CRUDTable, {
    CRUDTableProps,
    defaultIntegerFilter,
    defaultStringFilter,
    FieldType,
    UpdateResult,
} from "../../../CRUDTable/CRUDTable";
import isValidUUID from "../../../Utils/isValidUUID";
import type { ExhibitionDescriptor } from "./Types";

const ExhibitionCRUDTable = (props: Readonly<CRUDTableProps<ExhibitionDescriptor, "id">>) => CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    exhibitions: Map<string, ExhibitionDescriptor>;
    areExhibitionsDirty: boolean;
    insertExhibition: (exhibition: ExhibitionDescriptor) => void;
    updateExhibition: (exhibition: ExhibitionDescriptor) => void;
    deleteExhibition: (exhibitionId: string) => void;
}

export default function ManageExhibitionsModal({
    isOpen,
    onClose,
    exhibitions,
    areExhibitionsDirty,
    insertExhibition,
    updateExhibition,
    deleteExhibition,
}: Props): JSX.Element {
    return (
        <>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Exhibitions</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <ExhibitionCRUDTable
                                data={exhibitions}
                                externalUnsavedChanges={areExhibitionsDirty}
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
                                        colour: {
                                            heading: "Colour",
                                            ariaLabel: "Colour",
                                            description: "The colour of the exhibition (hex or rgb or rgba format).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: "#6a0dad",
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    colour: v,
                                                };
                                            },
                                            extract: (v) => v.colour,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => x,
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (_v) => true, // TODO: Validation
                                        },
                                        priority: {
                                            heading: "Priority",
                                            ariaLabel: "Priority",
                                            description:
                                                "Priority determines the order exhibitions are listed. Ascending sort (lowest first).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: exhibitions.size,
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
                                            partialExhibition: Partial<ExhibitionDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialExhibition.colour);
                                            assert(partialExhibition.name);
                                            assert(
                                                partialExhibition.priority !== null &&
                                                    partialExhibition.priority !== undefined
                                            );
                                            const newExhibition: ExhibitionDescriptor = {
                                                colour: partialExhibition.colour,
                                                id: uuidv4(),
                                                name: partialExhibition.name,
                                                priority: partialExhibition.priority,
                                                isNew: true,
                                            };
                                            insertExhibition(newExhibition);
                                            return newExhibition.id;
                                        },
                                        update: async (exhibitions): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, exhibition] of exhibitions) {
                                                results.set(key, true);
                                                updateExhibition(exhibition);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteExhibition(key);
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
