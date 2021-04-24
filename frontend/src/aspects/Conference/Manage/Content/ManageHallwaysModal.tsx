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
import type { HallwayDescriptor } from "./Types";

const HallwayCRUDTable = (props: Readonly<CRUDTableProps<HallwayDescriptor, "id">>) => CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    hallways: Map<string, HallwayDescriptor>;
    areHallwaysDirty: boolean;
    insertHallway: (hallway: HallwayDescriptor) => void;
    updateHallway: (hallway: HallwayDescriptor) => void;
    deleteHallway: (hallwayId: string) => void;
}

export default function ManageHallwaysModal({
    isOpen,
    onClose,
    hallways,
    areHallwaysDirty,
    insertHallway,
    updateHallway,
    deleteHallway,
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
                            <HallwayCRUDTable
                                data={hallways}
                                externalUnsavedChanges={areHallwaysDirty}
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
                                            description: "The colour of the hallway (hex or rgb or rgba format).",
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
                                                "Priority determines the order hallways are listed. Ascending sort (lowest first).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: hallways.size,
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
                                            partialHallway: Partial<HallwayDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialHallway.colour);
                                            assert(partialHallway.name);
                                            assert(
                                                partialHallway.priority !== null &&
                                                    partialHallway.priority !== undefined
                                            );
                                            const newHallway: HallwayDescriptor = {
                                                colour: partialHallway.colour,
                                                id: uuidv4(),
                                                name: partialHallway.name,
                                                priority: partialHallway.priority,
                                                isNew: true,
                                            };
                                            insertHallway(newHallway);
                                            return newHallway.id;
                                        },
                                        update: async (hallways): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, hallway] of hallways) {
                                                results.set(key, true);
                                                updateHallway(hallway);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteHallway(key);
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
