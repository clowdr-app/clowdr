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
import type { ContentGroupDescriptor, ContentGroupHallwayDescriptor, HallwayDescriptor } from "./Types";

const ContentGroupHallwayCRUDTable = (props: Readonly<CRUDTableProps<ContentGroupHallwayDescriptor, "id">>) =>
    CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    isGroupDirty: boolean;
    group: ContentGroupDescriptor;
    hallwaysMap: Map<string, HallwayDescriptor>;
    insertContentGroupHallway: (contentGroupHallway: ContentGroupHallwayDescriptor) => void;
    updateContentGroupHallway: (contentGroupHallway: ContentGroupHallwayDescriptor) => void;
    deleteContentGroupHallway: (contentGroupHallwayId: string) => void;
}

export default function ContentGroupHallwaysModal({
    isOpen,
    onOpen,
    onClose,
    isGroupDirty,
    group,
    hallwaysMap,
    insertContentGroupHallway,
    updateContentGroupHallway,
    deleteContentGroupHallway,
}: Props): JSX.Element {
    const contentGroupHallwaysMap = useMemo(() => {
        const results = new Map<string, ContentGroupHallwayDescriptor>();

        group.hallways.forEach((contentGroupHallway) => {
            results.set(contentGroupHallway.id, contentGroupHallway);
        });

        return results;
    }, [group.hallways]);

    const hallwayOptions = useMemo(() => {
        return Array.from(hallwaysMap.values()).map((hallway) => ({
            label: hallway.name,
            value: hallway.id,
        }));
    }, [hallwaysMap]);

    const conference = useConference();

    return (
        <>
            <Box mt={4}>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme="blue">
                        Manage Content Hallways
                    </Button>
                    <Text mt={2} as="p">(Hallways can exhibit items, rooms and events.)</Text>
                </Center>
            </Box>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Content Hallways</ModalHeader>
                    <ModalHeader paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic" fontWeight="normal">
                        &ldquo;{group.title}&bdquo;
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <ContentGroupHallwayCRUDTable
                                data={contentGroupHallwaysMap}
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
                                            const hallway = hallwaysMap.get(v.hallwayId);
                                            assert(hallway);
                                            return hallway.name;
                                        },
                                    },
                                    otherFields: {
                                        hallway: {
                                            heading: "Hallway",
                                            ariaLabel: "Hallway",
                                            description: "Hallway",
                                            isHidden: false,
                                            isEditable: false,
                                            isEditableAtCreate: true,
                                            defaultValue: null,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    hallwayId: v,
                                                };
                                            },
                                            extract: (item) => item.hallwayId,
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
                                                convertToUI: (hallwayId) => {
                                                    const opt = hallwayOptions.find((x) => x.value === hallwayId);
                                                    if (opt) {
                                                        return opt;
                                                    } else {
                                                        return {
                                                            label: `<Unknown (${hallwayId})>`,
                                                            value: hallwayId,
                                                        };
                                                    }
                                                },
                                                multiSelect: false,
                                                options: () => hallwayOptions,
                                                filter: defaultSelectFilter,
                                            },
                                        },
                                        priority: {
                                            heading: "Priority",
                                            ariaLabel: "Priority",
                                            description:
                                                "Priority determines the order items are listed in the hallway. Ascending sort (lowest first).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: group.hallways.length - 1,
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
                                        // TODO: Layout info
                                    },
                                }}
                                csud={{
                                    cudCallbacks: {
                                        create: async (
                                            partialContentGroupHallway: Partial<ContentGroupHallwayDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialContentGroupHallway.hallwayId);
                                            assert(
                                                partialContentGroupHallway.priority !== null &&
                                                    partialContentGroupHallway.priority !== undefined
                                            );
                                            const newContentGroupHallway: ContentGroupHallwayDescriptor = {
                                                id: uuidv4(),
                                                isNew: true,
                                                conferenceId: conference.id,
                                                groupId: group.id,
                                                hallwayId: partialContentGroupHallway.hallwayId,
                                                priority: partialContentGroupHallway.priority,
                                            };
                                            insertContentGroupHallway(newContentGroupHallway);
                                            return newContentGroupHallway.id;
                                        },
                                        update: async (contentGroupHallways): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, contentGroupHallway] of contentGroupHallways) {
                                                results.set(key, true);
                                                updateContentGroupHallway(contentGroupHallway);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteContentGroupHallway(key);
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
