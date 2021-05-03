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
import type { ExhibitionDescriptor, ItemDescriptor, ItemExhibitionDescriptor } from "./Types";

const ItemExhibitionCRUDTable = (props: Readonly<CRUDTableProps<ItemExhibitionDescriptor, "id">>) => CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    isGroupDirty: boolean;
    group: ItemDescriptor;
    exhibitionsMap: Map<string, ExhibitionDescriptor>;
    insertItemExhibition: (itemExhibition: ItemExhibitionDescriptor) => void;
    updateItemExhibition: (itemExhibition: ItemExhibitionDescriptor) => void;
    deleteItemExhibition: (itemExhibitionId: string) => void;
}

export default function ItemExhibitionsModal({
    isOpen,
    onOpen,
    onClose,
    isGroupDirty,
    group,
    exhibitionsMap,
    insertItemExhibition,
    updateItemExhibition,
    deleteItemExhibition,
}: Props): JSX.Element {
    const itemExhibitionsMap = useMemo(() => {
        const results = new Map<string, ItemExhibitionDescriptor>();

        group.exhibitions.forEach((itemExhibition) => {
            results.set(itemExhibition.id, itemExhibition);
        });

        return results;
    }, [group.exhibitions]);

    const exhibitionOptions = useMemo(() => {
        return Array.from(exhibitionsMap.values()).map((exhibition) => ({
            label: exhibition.name,
            value: exhibition.id,
        }));
    }, [exhibitionsMap]);

    const conference = useConference();

    return (
        <>
            <Box mt={4}>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme="blue">
                        Manage Content Exhibitions
                    </Button>
                    <Text mt={2} as="p">
                        (Exhibitions can exhibit items, rooms and events.)
                    </Text>
                </Center>
            </Box>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Content Exhibitions</ModalHeader>
                    <ModalHeader paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic" fontWeight="normal">
                        &ldquo;{group.title}&bdquo;
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <ItemExhibitionCRUDTable
                                data={itemExhibitionsMap}
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
                                            const exhibition = exhibitionsMap.get(v.exhibitionId);
                                            assert(exhibition);
                                            return exhibition.name;
                                        },
                                    },
                                    otherFields: {
                                        exhibition: {
                                            heading: "Exhibition",
                                            ariaLabel: "Exhibition",
                                            description: "Exhibition",
                                            isHidden: false,
                                            isEditable: false,
                                            isEditableAtCreate: true,
                                            defaultValue: null,
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    exhibitionId: v,
                                                };
                                            },
                                            extract: (item) => item.exhibitionId,
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
                                                convertToUI: (exhibitionId) => {
                                                    const opt = exhibitionOptions.find((x) => x.value === exhibitionId);
                                                    if (opt) {
                                                        return opt;
                                                    } else {
                                                        return {
                                                            label: `<Unknown (${exhibitionId})>`,
                                                            value: exhibitionId,
                                                        };
                                                    }
                                                },
                                                multiSelect: false,
                                                options: () => exhibitionOptions,
                                                filter: defaultSelectFilter,
                                            },
                                        },
                                        priority: {
                                            heading: "Priority",
                                            ariaLabel: "Priority",
                                            description:
                                                "Priority determines the order items are listed in the exhibition. Ascending sort (lowest first).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: group.exhibitions.length - 1,
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
                                            partialItemExhibition: Partial<ItemExhibitionDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialItemExhibition.exhibitionId);
                                            assert(
                                                partialItemExhibition.priority !== null &&
                                                    partialItemExhibition.priority !== undefined
                                            );
                                            const newItemExhibition: ItemExhibitionDescriptor = {
                                                id: uuidv4(),
                                                isNew: true,
                                                conferenceId: conference.id,
                                                itemId: group.id,
                                                exhibitionId: partialItemExhibition.exhibitionId,
                                                priority: partialItemExhibition.priority,
                                            };
                                            insertItemExhibition(newItemExhibition);
                                            return newItemExhibition.id;
                                        },
                                        update: async (itemExhibitions): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, itemExhibition] of itemExhibitions) {
                                                results.set(key, true);
                                                updateItemExhibition(itemExhibition);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteItemExhibition(key);
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
