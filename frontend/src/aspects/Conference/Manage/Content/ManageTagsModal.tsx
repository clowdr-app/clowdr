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
import type { TagDescriptor } from "../Shared/Types";

const TagCRUDTable = (props: Readonly<CRUDTableProps<TagDescriptor, "id">>) => CRUDTable(props);

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    tags: Map<string, TagDescriptor>;
    areTagsDirty: boolean;
    insertTag: (tag: TagDescriptor) => void;
    updateTag: (tag: TagDescriptor) => void;
    deleteTag: (tagId: string) => void;
}

export default function ManageTagsModal({
    isOpen,
    onClose,
    tags,
    areTagsDirty,
    insertTag,
    updateTag,
    deleteTag,
}: Props): JSX.Element {
    return (
        <>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Tags</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <TagCRUDTable
                                data={tags}
                                externalUnsavedChanges={areTagsDirty}
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
                                            description: "The colour of the tag (hex or rgb or rgba format).",
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
                                                "Priority determines the order tags are listed. Ascending sort (lowest first).",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: tags.size,
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
                                        create: async (partialTag: Partial<TagDescriptor>): Promise<string | null> => {
                                            assert(partialTag.colour);
                                            assert(partialTag.name);
                                            const newTag: TagDescriptor = {
                                                colour: partialTag.colour,
                                                id: uuidv4(),
                                                name: partialTag.name,
                                                isNew: true,
                                            };
                                            insertTag(newTag);
                                            return newTag.id;
                                        },
                                        update: async (tags): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, tag] of tags) {
                                                results.set(key, true);
                                                updateTag(tag);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteTag(key);
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
