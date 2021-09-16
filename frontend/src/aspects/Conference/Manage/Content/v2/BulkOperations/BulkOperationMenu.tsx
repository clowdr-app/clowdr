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
import {
    Content_ElementType_Enum,
    ManageContent_ItemFragment,
    ManageContent_TagFragment,
} from "../../../../../../generated/graphql";
import { EditElementsPermissionGrantsModal } from "../Security/EditElementsPermissionGrantsModal";
import { AddElementsModal } from "./AddElementsModal";
import { CombineVideosModal } from "./CombineVideosModal";
import { SelectElementsModal } from "./SelectElementsModal";
import { SynchroniseUploadersModal } from "./SynchroniseUploadersModal";
import { UpdateExhibitionDescriptiveItemsModal } from "./UpdateExhibitionDescriptiveItemsModal";
import { UpdateLayoutModal } from "./UpdateLayoutModal";
import { UpdateUploadsRemainingModal } from "./UpdateUploadsRemainingModal";

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
        elementsByItem: {
            itemId: string;
            elementIds: string[];
        }[];
        restrictToTypes: Content_ElementType_Enum[] | null;
    } | null>(null);
    const operations: {
        label: string;
        value: string;
        operation: (items: readonly ManageContent_ItemFragment[]) => void;
    }[] = [
        {
            label: "Add elements",
            value: "ELEMENTS_ADD",
            operation: (items) => {
                setActiveOperation({
                    operation: "ELEMENTS_ADD",
                    items: items,
                    step: "ACT",
                    elementsByItem: [],
                    restrictToTypes: null,
                });
            },
        },
        {
            label: "Synchronise uploaders",
            value: "SYNCHRONISE_UPLOADERS",
            operation: (items) => {
                setActiveOperation({
                    operation: "SYNCHRONISE_UPLOADERS",
                    items: items,
                    step: "SELECT",
                    elementsByItem: [],
                    restrictToTypes: null,
                });
            },
        },
        {
            label: "Edit element uploads remaining",
            value: "UPDATE_UPLOADS_REMAINING",
            operation: (items) => {
                setActiveOperation({
                    operation: "UPDATE_UPLOADS_REMAINING",
                    items: items,
                    step: "SELECT",
                    elementsByItem: [],
                    restrictToTypes: null,
                });
            },
        },
        // {
        //     label: "Add/remove tags",
        //     value: "TAGS",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "TAGS",
        //             items: items,
        //             step: "ACT",
        //             elementsByItem: [],
        //             restrictToTypes: null,
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
        //             elementsByItem: [],
        //             restrictToTypes: null,
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
        //             elementsByItem: [],
        //             restrictToTypes: null,
        //         });
        //     },
        // },
        {
            label: "Edit element layout",
            value: "ELEMENTS_LAYOUT",
            operation: (items) => {
                setActiveOperation({
                    operation: "ELEMENTS_LAYOUT",
                    items: items,
                    step: "SELECT",
                    elementsByItem: [],
                    restrictToTypes: null,
                });
            },
        },
        {
            label: "Update exhibition descriptive items",
            value: "UPDATE_EXHIBITION_DESCRIPTIVE_ITEMS",
            operation: (items) => {
                setActiveOperation({
                    operation: "UPDATE_EXHIBITION_DESCRIPTIVE_ITEMS",
                    items,
                    step: "ACT",
                    elementsByItem: [],
                    restrictToTypes: null,
                });
            },
        },
        // {
        //     label: "Remove elements",
        //     value: "ELEMENTS_REMOVE",
        //     operation: (items) => {
        //         setActiveOperation({
        //             operation: "ELEMENTS_REMOVE",
        //             items: items,
        //             step: "SELECT",
        //             elementsByItem: [],
        //             restrictToTypes: null,
        //         });
        //     },
        // },
        {
            label: "Combine videos",
            value: "COMBINE_VIDEOS",
            operation: (items) => {
                setActiveOperation({
                    operation: "COMBINE_VIDEOS",
                    items: items,
                    step: "SELECT",
                    elementsByItem: [],
                    restrictToTypes: [
                        Content_ElementType_Enum.VideoFile,
                        Content_ElementType_Enum.VideoBroadcast,
                        Content_ElementType_Enum.VideoPrepublish,
                    ],
                });
            },
        },
        {
            label: "Manage security",
            value: "SECURITY",
            operation: (items) => {
                setActiveOperation({
                    operation: "SECURITY",
                    items,
                    step: "SELECT",
                    elementsByItem: [],
                    restrictToTypes: null,
                });
            },
        },
    ];

    const toast = useToast();

    return (
        <>
            {selectedItems.length > 0 ? (
                <Menu isOpen={menuIsOpen} onClose={menuOnClose} onOpen={menuOnOpen} size="xl">
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
                <Menu
                    closeOnSelect={false}
                    isLazy
                    isOpen={menuIsOpen}
                    onClose={menuOnClose}
                    onOpen={menuOnOpen}
                    size="xl"
                >
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
            <SelectElementsModal
                isOpen={
                    (activeOperation?.operation === "SECURITY" ||
                        activeOperation?.operation === "COMBINE_VIDEOS" ||
                        activeOperation?.operation === "SYNCHRONISE_UPLOADERS" ||
                        activeOperation?.operation === "UPDATE_UPLOADS_REMAINING" ||
                        activeOperation?.operation === "ELEMENTS_LAYOUT") &&
                    activeOperation?.step === "SELECT"
                }
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
                onSelect={(elementsByItem) => {
                    if (
                        activeOperation?.operation === "SECURITY" ||
                        activeOperation?.operation === "COMBINE_VIDEOS" ||
                        activeOperation?.operation === "SYNCHRONISE_UPLOADERS" ||
                        activeOperation?.operation === "UPDATE_UPLOADS_REMAINING" ||
                        activeOperation?.operation === "ELEMENTS_LAYOUT"
                    ) {
                        setActiveOperation({
                            elementsByItem,
                            items: [],
                            operation: activeOperation.operation,
                            step: "ACT",
                            restrictToTypes: activeOperation.restrictToTypes,
                        });
                    }
                }}
                restrictToTypes={activeOperation?.restrictToTypes ?? null}
            />

            <AddElementsModal
                isOpen={activeOperation?.operation === "ELEMENTS_ADD" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
            <UpdateLayoutModal
                isOpen={activeOperation?.operation === "ELEMENTS_LAYOUT" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                elementsByItem={activeOperation?.elementsByItem ?? []}
            />
            {/* <AddRemoveExhibitionsModal
                isOpen={activeOperation?.operation === "EXHIBITIONS"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            /> */}
            {/* <AddRemoveTagsModal
                isOpen={activeOperation?.operation === "TAGS"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            /> */}
            {/* <LinkUnlinkPeopleModal
                isOpen={activeOperation?.operation === "PEOPLE"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            /> */}
            {/* <RemoveElementsModal
                isOpen={activeOperation?.operation === "ELEMENTS_REMOVE" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            /> */}
            <EditElementsPermissionGrantsModal
                isOpen={activeOperation?.operation === "SECURITY" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                elementIds={R.flatten(activeOperation?.elementsByItem.map((x) => x.elementIds) ?? [])}
            />
            <CombineVideosModal
                isOpen={activeOperation?.operation === "COMBINE_VIDEOS" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                elementsByItem={activeOperation?.elementsByItem ?? []}
            />
            <SynchroniseUploadersModal
                isOpen={activeOperation?.operation === "SYNCHRONISE_UPLOADERS" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                elementsByItem={activeOperation?.elementsByItem ?? []}
            />
            <UpdateUploadsRemainingModal
                isOpen={activeOperation?.operation === "UPDATE_UPLOADS_REMAINING" && activeOperation?.step === "ACT"}
                onClose={() => {
                    setActiveOperation(null);
                }}
                elementsByItem={activeOperation?.elementsByItem ?? []}
            />
            <UpdateExhibitionDescriptiveItemsModal
                isOpen={
                    activeOperation?.operation === "UPDATE_EXHIBITION_DESCRIPTIVE_ITEMS" &&
                    activeOperation?.step === "ACT"
                }
                onClose={() => {
                    setActiveOperation(null);
                }}
                items={activeOperation?.items ?? []}
            />
        </>
    );
}
