import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    Menu,
    MenuButton,
    MenuDivider,
    MenuGroup,
    MenuItem,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useState } from "react";
import type { ManageContent_ItemFragment, ManageContent_TagFragment } from "../../../../../../generated/graphql";
import { EditElementsPermissionGrantsModal } from "../Security/EditElementsPermissionGrantsModal";
import { AddElementsModal } from "./AddElementsModal";
import { AddRemoveExhibitionsModal } from "./AddRemoveExhibitionsModal";
import { AddRemoveTagsModal } from "./AddRemoveTagsModal";
import { AddUploadablesModal } from "./AddUploadablesModal";
import { LinkUnlinkPeopleModal } from "./LinkUnlinkPeopleModal";
import { RemoveElementsOrUploadablesModal } from "./RemoveElementsOrUploadablesModal";
import { SelectElementsOrUploadablesModal } from "./SelectElementsOrUploadablesModal";

export function BulkOperationMenu({
    selectedData: selectedItems,
    allItems,
    allTags,
}: {
    selectedData: ManageContent_ItemFragment[];
    allItems: readonly ManageContent_ItemFragment[];
    allTags: readonly ManageContent_TagFragment[];
}): JSX.Element {
    const { isOpen: menuIsOpen, onOpen: menuOnOpen, onClose: _menuOnClose } = useDisclosure();
    const [selectedOperation, setSelectedOperation] = useState<string>("");
    const menuOnClose = useCallback(() => {
        setSelectedOperation("");
        _menuOnClose();
    }, [_menuOnClose]);

    const [activeOperation, setActiveOperation] = useState<{
        operation: string;
        items: readonly ManageContent_ItemFragment[];
        step: string;
        elementIds: string[];
        uploadableIds: {
            uploadableId: string;
            elementId?: string;
        }[];
    } | null>(null);
    const operations: {
        label: string;
        value: string;
        operation: (items: readonly ManageContent_ItemFragment[]) => void;
    }[] = [
        {
            label: "Manage security",
            value: "SECURITY",
            operation: (items) => {
                setActiveOperation({
                    operation: "SECURITY",
                    items,
                    step: "SELECT",
                    elementIds: [],
                    uploadableIds: [],
                });
            },
        },
        // {
        //     label: "Copy people to uploaders",
        //     value: "COPY_UPLOADERS",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "COPY_UPLOADERS",
        //             items: items,
        //             step: "SELECT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
        // {
        //     label: "Add/remove tags",
        //     value: "TAGS",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "TAGS",
        //             items: items,
        //             step: "ACT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
        // {
        //     label: "Add to/remove from exhibitions",
        //     value: "EXHIBITIONS",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "EXHIBITIONS",
        //             items: items,
        //             step: "ACT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
        // {
        //     label: "Link/unlink people",
        //     value: "PEOPLE",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "PEOPLE",
        //             items: items,
        //             step: "ACT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
        // {
        //     label: "Add elements",
        //     value: "ELEMENTS_ADD",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "ELEMENTS_ADD",
        //             items: items,
        //             step: "ACT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
        // {
        //     label: "Add uploadable elements",
        //     value: "UPLOADABLES_ADD",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "UPLOADABLES_ADD",
        //             items: items,
        //             step: "ACT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
        // {
        //     label: "Remove elements or uploadables",
        //     value: "ELEMENTS_REMOVE",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "ELEMENTS_REMOVE",
        //             items: items,
        //             step: "SELECT",
        //             elementIds: [],
        //             uploadableIds: [],
        //         });
        //     },
        // },
    ];

    const toast = useToast();

    return (
        <>
            {selectedItems.length > 0 ? (
                <Menu isOpen={menuIsOpen} onClose={menuOnClose} onOpen={menuOnOpen}>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Bulk edit
                    </MenuButton>
                    <MenuList overflow="auto" maxH="30vh">
                        <MenuGroup title="Operation">
                            {operations.map((operation) => (
                                <MenuItem
                                    key={operation.value}
                                    value={operation.value}
                                    onClick={() => {
                                        operation.operation(selectedItems);
                                    }}
                                >
                                    {operation.label}
                                </MenuItem>
                            ))}
                        </MenuGroup>
                    </MenuList>
                </Menu>
            ) : (
                <Menu closeOnSelect={false} isLazy isOpen={menuIsOpen} onClose={menuOnClose} onOpen={menuOnOpen}>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Bulk edit
                    </MenuButton>
                    <MenuList overflow="auto" maxH="30vh">
                        <MenuOptionGroup
                            title="Operation"
                            type="radio"
                            value={selectedOperation}
                            onChange={(value) => {
                                setSelectedOperation(value as string);
                            }}
                        >
                            {operations.map((operation) => (
                                <MenuItemOption key={operation.value} value={operation.value}>
                                    {operation.label}
                                </MenuItemOption>
                            ))}
                        </MenuOptionGroup>
                        <MenuDivider />
                        <MenuItem
                            key="all-items"
                            onClick={() => {
                                const operation = operations.find((x) => x.value === selectedOperation);
                                if (operation) {
                                    menuOnClose();
                                    operation.operation(allItems);
                                    setSelectedOperation("");
                                } else {
                                    toast({
                                        title: "Please select an operation",
                                        duration: 3000,
                                        position: "top",
                                        isClosable: true,
                                    });
                                }
                            }}
                        >
                            All items
                        </MenuItem>
                        <MenuGroup title="Items with tag">
                            {R.sortBy((x) => x.name, allTags).map((tag) => (
                                <MenuItem
                                    key={tag.id}
                                    onClick={() => {
                                        const filteredItems = allItems.filter((item) =>
                                            item.itemTags.some((itemTag) => itemTag.tagId === tag.id)
                                        );
                                        const operation = operations.find((x) => x.value === selectedOperation);
                                        if (operation) {
                                            menuOnClose();
                                            operation.operation(filteredItems);
                                            setSelectedOperation("");
                                        } else {
                                            toast({
                                                title: "Please select an operation",
                                                duration: 3000,
                                                position: "top",
                                                isClosable: true,
                                            });
                                        }
                                    }}
                                >
                                    {tag.name}
                                </MenuItem>
                            ))}
                        </MenuGroup>
                    </MenuList>
                </Menu>
            )}
            <AddElementsModal
                isOpen={activeOperation?.operation === "ELEMENTS_ADD"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <AddRemoveExhibitionsModal
                isOpen={activeOperation?.operation === "EXHIBITIONS"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <AddRemoveTagsModal
                isOpen={activeOperation?.operation === "TAGS"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <AddUploadablesModal
                isOpen={activeOperation?.operation === "UPLOADABLES_ADD"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <LinkUnlinkPeopleModal
                isOpen={activeOperation?.operation === "PEOPLE"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <RemoveElementsOrUploadablesModal
                isOpen={activeOperation?.operation === "ELEMENTS_REMOVE" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <SelectElementsOrUploadablesModal
                isOpen={
                    (activeOperation?.operation === "SECURITY" ||
                        activeOperation?.operation === "COPY_UPLOADERS" ||
                        activeOperation?.operation === "ELEMENTS_REMOVE") &&
                    activeOperation?.step === "SELECT"
                }
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
                onSelect={(elementIds, uploadableIds) => {
                    if (activeOperation?.operation === "SECURITY" || activeOperation?.operation === "ELEMENTS_REMOVE") {
                        setActiveOperation({
                            elementIds,
                            items: activeOperation.items,
                            operation: activeOperation.operation,
                            step: "ACT",
                            uploadableIds,
                        });
                    } else if (activeOperation?.operation === "COPY_UPLOADERS") {
                        // TODO: Copy uploaders
                    }
                }}
            />
            <EditElementsPermissionGrantsModal
                isOpen={activeOperation?.operation === "SECURITY" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                elementIds={activeOperation?.elementIds ?? []}
                uploadableIds={activeOperation?.uploadableIds ?? []}
            />
        </>
    );
}
