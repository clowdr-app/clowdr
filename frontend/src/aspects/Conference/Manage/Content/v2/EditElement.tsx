import { gql, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    AlertTitle,
    Button,
    ButtonGroup,
    chakra,
    Divider,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Spinner,
    Switch,
    Text,
    Tooltip,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useMemo, useRef, useState } from "react";
import {
    ManageContent_ElementFragment,
    ManageContent_ElementFragmentDoc,
    ManageContent_ItemSecondaryFragment,
    useManageContent_DeleteElementMutation,
    useManageContent_SetElementIsHiddenMutation,
    useManageContent_UpdateElementMutation,
} from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { ElementBaseTemplates } from "../Templates";
import type { ElementDescriptor } from "../Types";
import { ItemPeoplePanel } from "./AddItemPerson";
import { LayoutEditor } from "./LayoutEditor";

export function Elements({
    itemId,
    elements,
    rooms,
    chatId,
    originatingData,
}: { itemId: string } & ManageContent_ItemSecondaryFragment & {
        elements: readonly ManageContent_ElementFragment[];
    }): JSX.Element {
    const sortedElements = useMemo(() => {
        const sortedElements = [...elements];

        sortedElements.sort((a, b) => {
            if ((!a.layoutData || !("priority" in a.layoutData)) && (!b.layoutData || !("priority" in b.layoutData))) {
                return a.name.localeCompare(b.name);
            }
            if (!a.layoutData || !("priority" in a.layoutData)) {
                return 1;
            }
            if (!b.layoutData || !("priority" in b.layoutData)) {
                return -1;
            }
            const priorityOrder = a.layoutData.priority - b.layoutData.priority;

            return priorityOrder === 0 ? a.name.localeCompare(b.name) : priorityOrder;
        });

        return sortedElements;
    }, [elements]);

    return (
        <Accordion allowToggle allowMultiple w="100%">
            <AccordionItem w="100%">
                {({ isExpanded }) => (
                    <>
                        <AccordionButton>
                            People
                            <AccordionIcon ml="auto" />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                            {isExpanded ? <ItemPeoplePanel itemId={itemId} /> : <></>}
                        </AccordionPanel>
                    </>
                )}
            </AccordionItem>
            {sortedElements.map((item, idx) => (
                <Element
                    key={item.id}
                    element={item}
                    numElements={sortedElements.length}
                    idx={idx}
                    previousElement={sortedElements[idx - 1]}
                    nextElement={sortedElements[idx + 1]}
                />
            ))}
        </Accordion>
    );
}

gql`
    mutation ManageContent_DeleteElement($elementId: uuid!) {
        delete_content_Element_by_pk(id: $elementId) {
            id
        }
    }

    mutation ManageContent_SetElementIsHidden($elementId: uuid!, $isHidden: Boolean!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: { isHidden: $isHidden }) {
            ...ManageContent_Element
        }
    }

    mutation ManageContent_UpdateElement($elementId: uuid!, $element: content_Element_set_input!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: $element) {
            ...ManageContent_Element
        }
    }
`;

function Element({
    element,
    idx,
    numElements,
    previousElement,
    nextElement,
}: {
    element: ManageContent_ElementFragment;
    idx: number;
    numElements: number;
    previousElement?: ManageContent_ElementFragment;
    nextElement?: ManageContent_ElementFragment;
}): JSX.Element {
    const [updateElement, updateElementResponse] = useManageContent_UpdateElementMutation();
    const [deleteElement, deleteElementResponse] = useManageContent_DeleteElementMutation();
    const toast = useToast();

    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(element.name);

    const {
        isOpen: confirmDelete_IsOpen,
        onOpen: confirmDelete_OnOpen,
        onClose: confirmDelete_OnClose,
    } = useDisclosure();
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <AccordionItem w="100%">
                <AccordionButton
                    as={"div"}
                    cursor="pointer"
                    tabIndex={0}
                    onKeyUp={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                            (ev.target as HTMLDivElement).click();
                        }
                    }}
                >
                    <ButtonGroup mr={4}>
                        <Tooltip label="Move element up">
                            <Button
                                size="xs"
                                isDisabled={idx === 0}
                                onClick={(ev) => {
                                    ev.stopPropagation();

                                    if (previousElement) {
                                        const layoutDataA: LayoutDataBlob = {
                                            ...element.layoutData,
                                            priority: idx - 1,
                                        };
                                        updateElement({
                                            variables: {
                                                elementId: element.id,
                                                element: {
                                                    layoutData: layoutDataA,
                                                },
                                            },
                                            update: (cache, response) => {
                                                if (response.data?.update_content_Element_by_pk) {
                                                    const data = response.data.update_content_Element_by_pk;
                                                    cache.modify({
                                                        fields: {
                                                            content_Element(
                                                                existingRefs: Reference[] = [],
                                                                { readField }
                                                            ) {
                                                                const newRef = cache.writeFragment({
                                                                    data,
                                                                    fragment: ManageContent_ElementFragmentDoc,
                                                                    fragmentName: "ManageContent_Element",
                                                                });
                                                                if (
                                                                    existingRefs.some(
                                                                        (ref) => readField("id", ref) === data.id
                                                                    )
                                                                ) {
                                                                    return existingRefs;
                                                                }
                                                                return [...existingRefs, newRef];
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });

                                        const layoutDataB: LayoutDataBlob = {
                                            ...previousElement.layoutData,
                                            priority: idx,
                                        };
                                        updateElement({
                                            variables: {
                                                elementId: previousElement.id,
                                                element: {
                                                    layoutData: layoutDataB,
                                                },
                                            },
                                            update: (cache, response) => {
                                                if (response.data?.update_content_Element_by_pk) {
                                                    const data = response.data.update_content_Element_by_pk;
                                                    cache.modify({
                                                        fields: {
                                                            content_Element(
                                                                existingRefs: Reference[] = [],
                                                                { readField }
                                                            ) {
                                                                const newRef = cache.writeFragment({
                                                                    data,
                                                                    fragment: ManageContent_ElementFragmentDoc,
                                                                    fragmentName: "ManageContent_Element",
                                                                });
                                                                if (
                                                                    existingRefs.some(
                                                                        (ref) => readField("id", ref) === data.id
                                                                    )
                                                                ) {
                                                                    return existingRefs;
                                                                }
                                                                return [...existingRefs, newRef];
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });
                                    }
                                }}
                                onKeyUp={(ev) => {
                                    ev.stopPropagation();
                                }}
                                aria-label="Move item up"
                                isLoading={updateElementResponse.loading}
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                            </Button>
                        </Tooltip>
                        <Tooltip label="Move element down">
                            <Button
                                size="xs"
                                isDisabled={idx === numElements - 1}
                                onClick={(ev) => {
                                    ev.stopPropagation();

                                    if (nextElement) {
                                        const layoutDataA: LayoutDataBlob = {
                                            ...element.layoutData,
                                            priority: idx + 1,
                                        };
                                        updateElement({
                                            variables: {
                                                elementId: element.id,
                                                element: {
                                                    layoutData: layoutDataA,
                                                },
                                            },
                                            update: (cache, response) => {
                                                if (response.data?.update_content_Element_by_pk) {
                                                    const data = response.data.update_content_Element_by_pk;
                                                    cache.modify({
                                                        fields: {
                                                            content_Element(
                                                                existingRefs: Reference[] = [],
                                                                { readField }
                                                            ) {
                                                                const newRef = cache.writeFragment({
                                                                    data,
                                                                    fragment: ManageContent_ElementFragmentDoc,
                                                                    fragmentName: "ManageContent_Element",
                                                                });
                                                                if (
                                                                    existingRefs.some(
                                                                        (ref) => readField("id", ref) === data.id
                                                                    )
                                                                ) {
                                                                    return existingRefs;
                                                                }
                                                                return [...existingRefs, newRef];
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });

                                        const layoutDataB: LayoutDataBlob = {
                                            ...nextElement.layoutData,
                                            priority: idx,
                                        };
                                        updateElement({
                                            variables: {
                                                elementId: nextElement.id,
                                                element: {
                                                    layoutData: layoutDataB,
                                                },
                                            },
                                            update: (cache, response) => {
                                                if (response.data?.update_content_Element_by_pk) {
                                                    const data = response.data.update_content_Element_by_pk;
                                                    cache.modify({
                                                        fields: {
                                                            content_Element(
                                                                existingRefs: Reference[] = [],
                                                                { readField }
                                                            ) {
                                                                const newRef = cache.writeFragment({
                                                                    data,
                                                                    fragment: ManageContent_ElementFragmentDoc,
                                                                    fragmentName: "ManageContent_Element",
                                                                });
                                                                if (
                                                                    existingRefs.some(
                                                                        (ref) => readField("id", ref) === data.id
                                                                    )
                                                                ) {
                                                                    return existingRefs;
                                                                }
                                                                return [...existingRefs, newRef];
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });
                                    }
                                }}
                                onKeyUp={(ev) => {
                                    ev.stopPropagation();
                                }}
                                aria-label="Move item down"
                                isLoading={updateElementResponse.loading}
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                    <HStack textAlign="left">
                        {isEditingTitle ? (
                            <>
                                <Input
                                    size="sm"
                                    value={newName}
                                    onChange={(ev) => {
                                        setNewName(ev.target.value);
                                    }}
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                    }}
                                    onKeyUp={(ev) => {
                                        ev.stopPropagation();
                                    }}
                                />
                                <Tooltip label="Save element name">
                                    <Button
                                        colorScheme="green"
                                        size="xs"
                                        aria-label="Save element name"
                                        mx={2}
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setIsEditingTitle(false);

                                            updateElement({
                                                variables: {
                                                    elementId: element.id,
                                                    element: {
                                                        name: newName,
                                                    },
                                                },
                                                update: (cache, response) => {
                                                    if (response.data?.update_content_Element_by_pk) {
                                                        const data = response.data.update_content_Element_by_pk;
                                                        cache.modify({
                                                            fields: {
                                                                content_Element(
                                                                    existingRefs: Reference[] = [],
                                                                    { readField }
                                                                ) {
                                                                    const newRef = cache.writeFragment({
                                                                        data,
                                                                        fragment: ManageContent_ElementFragmentDoc,
                                                                        fragmentName: "ManageContent_Element",
                                                                    });
                                                                    if (
                                                                        existingRefs.some(
                                                                            (ref) => readField("id", ref) === data.id
                                                                        )
                                                                    ) {
                                                                        return existingRefs;
                                                                    }
                                                                    return [...existingRefs, newRef];
                                                                },
                                                            },
                                                        });
                                                    }
                                                },
                                            });
                                        }}
                                        onKeyUp={(ev) => {
                                            ev.stopPropagation();
                                        }}
                                    >
                                        <FAIcon iconStyle="s" icon="save" />
                                    </Button>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                                <chakra.span>{element.name}</chakra.span>
                                <Tooltip label="Edit element name">
                                    <Button
                                        size="xs"
                                        aria-label="Edit element name"
                                        mx={2}
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setIsEditingTitle(true);
                                        }}
                                        onKeyUp={(ev) => {
                                            ev.stopPropagation();
                                        }}
                                    >
                                        <FAIcon iconStyle="s" icon="edit" />
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    </HStack>
                    <Tooltip label="Manage element security">
                        <IconButton
                            ml="auto"
                            colorScheme="yellow"
                            size="xs"
                            aria-label="Element security"
                            icon={<FAIcon iconStyle="s" icon="lock" />}
                            onClick={(ev) => {
                                ev.stopPropagation();
                                // TODO
                            }}
                            onKeyUp={(ev) => {
                                ev.stopPropagation();
                            }}
                        />
                    </Tooltip>
                    <Tooltip label="Delete element">
                        <IconButton
                            ref={cancelRef}
                            colorScheme="red"
                            size="xs"
                            aria-label="Delete element"
                            icon={<FAIcon iconStyle="s" icon="trash-alt" />}
                            onClick={async (ev) => {
                                ev.stopPropagation();
                                confirmDelete_OnOpen();
                            }}
                            onKeyUp={(ev) => {
                                ev.stopPropagation();
                            }}
                            isLoading={deleteElementResponse.loading}
                            ml={2}
                        />
                    </Tooltip>
                    <AccordionIcon ml={2} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                    <ElementInner element={element} />
                </AccordionPanel>
            </AccordionItem>
            <AlertDialog isOpen={confirmDelete_IsOpen} leastDestructiveRef={cancelRef} onClose={confirmDelete_OnClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Confirm Delete?
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            <Text>
                                Are you sure you want to delete &ldquo;{element.name}&rdquo;? You can&apos;t undo this
                                deletion afterwards.
                            </Text>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={confirmDelete_OnClose}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={async () => {
                                    try {
                                        await deleteElement({
                                            variables: {
                                                elementId: element.id,
                                            },
                                            update: (cache, { data: _data }) => {
                                                if (_data?.delete_content_Element_by_pk) {
                                                    const data = _data.delete_content_Element_by_pk;
                                                    cache.modify({
                                                        fields: {
                                                            content_Element(
                                                                existingRefs: Reference[] = [],
                                                                { readField }
                                                            ) {
                                                                cache.evict({
                                                                    id: data.id,
                                                                    fieldName: "ManageContent_ElementFragment",
                                                                    broadcast: true,
                                                                });
                                                                return existingRefs.filter(
                                                                    (ref) => data.id !== readField("id", ref)
                                                                );
                                                            },
                                                        },
                                                    });
                                                }
                                            },
                                        });
                                        confirmDelete_OnClose();
                                    } catch (e) {
                                        toast({
                                            status: "error",
                                            title: "Could not delete content",
                                        });
                                    }
                                }}
                                ml={3}
                            >
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}

function ElementInner({ element }: { element: ManageContent_ElementFragment }): JSX.Element {
    const [setIsHidden, setIsHiddenResponse] = useManageContent_SetElementIsHiddenMutation();
    const [updateElement, updateElementResponse] = useManageContent_UpdateElementMutation();

    const itemType = element.typeName;
    const baseType = ElementBaseTypes[itemType];
    const itemTemplate = useMemo(() => ElementBaseTemplates[baseType], [baseType]);
    const descriptor = useMemo<ElementDescriptor>(
        () => ({
            ...element,
            typeName: element.typeName,
            layoutData: element.layoutData ?? null,
        }),
        [element]
    );

    const editor = useMemo(() => {
        return itemTemplate.supported ? (
            <itemTemplate.renderEditor
                data={{ type: "element-only", element: descriptor }}
                update={(updated) => {
                    if (updated.type === "element-only") {
                        const updatedItem = {
                            data: updated.element.data,
                            layoutData: updated.element.layoutData,
                        };
                        updateElement({
                            variables: {
                                elementId: updated.element.id,
                                element: updatedItem,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_content_Element_by_pk) {
                                    const data = _data.update_content_Element_by_pk;
                                    cache.modify({
                                        fields: {
                                            content_Element(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data: updated.element,
                                                    fragment: ManageContent_ElementFragmentDoc,
                                                    fragmentName: "ManageContent_Element",
                                                });
                                                if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                                    return existingRefs;
                                                }
                                                return [...existingRefs, newRef];
                                            },
                                        },
                                    });
                                }
                            },
                        });
                    }
                }}
            />
        ) : (
            <Text>Cannot edit {itemType} items.</Text>
        );
    }, [descriptor, itemTemplate, itemType, updateElement]);

    return (
        <>
            {updateElementResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateElementResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            {setIsHiddenResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{setIsHiddenResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            <HStack justifyContent="flex-end">
                <FormControl display="flex" flexDir="row" alignItems="flex-start" justifyContent="flex-start">
                    <FormLabel m={0} p={0} fontSize="0.9em">
                        Hidden?
                    </FormLabel>
                    <Switch
                        m={0}
                        ml={2}
                        p={0}
                        lineHeight="1em"
                        size="sm"
                        isChecked={element.isHidden}
                        onChange={async (event) => {
                            const isHidden = event.target.checked;
                            setIsHidden({
                                variables: {
                                    elementId: element.id,
                                    isHidden,
                                },
                                update: (cache, { data: _data }) => {
                                    if (_data?.update_content_Element_by_pk) {
                                        const data = _data.update_content_Element_by_pk;
                                        cache.modify({
                                            fields: {
                                                content_Element(existingRefs: Reference[] = [], { readField }) {
                                                    const newRef = cache.writeFragment({
                                                        data: {
                                                            __typename: "content_Element",
                                                            id: data.id,
                                                            isHidden,
                                                        },
                                                        fragment: ManageContent_ElementFragmentDoc,
                                                        fragmentName: "ManageContent_Element",
                                                    });
                                                    if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                                        return existingRefs;
                                                    }
                                                    return [...existingRefs, newRef];
                                                },
                                            },
                                        });
                                    }
                                },
                            });
                        }}
                    />
                    <FormHelperText m={0} ml={2} p={0}>
                        Enable to hide this content from registrants.
                    </FormHelperText>
                </FormControl>
                {updateElementResponse.loading ? <Spinner label="Saving changes" /> : undefined}
                {setIsHiddenResponse.loading ? <Spinner label="Saving changes" /> : undefined}
            </HStack>
            <Divider my={2} />
            {editor}
            <Divider my={2} />
            <LayoutEditor
                layoutDataBlob={descriptor.layoutData}
                elementType={element.typeName}
                update={(layoutData) => {
                    const newState: ElementDescriptor = {
                        ...descriptor,
                        layoutData,
                    };
                    updateElement({
                        variables: {
                            elementId: element.id,
                            element: {
                                data: newState.data,
                                layoutData: newState.layoutData,
                            },
                        },
                        update: (cache, { data: _data }) => {
                            if (_data?.update_content_Element_by_pk) {
                                const data = _data.update_content_Element_by_pk;
                                cache.modify({
                                    fields: {
                                        content_Element(existingRefs: Reference[] = [], { readField }) {
                                            const newRef = cache.writeFragment({
                                                data: newState,
                                                fragment: ManageContent_ElementFragmentDoc,
                                                fragmentName: "ManageContent_Element",
                                            });
                                            if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                                return existingRefs;
                                            }
                                            return [...existingRefs, newRef];
                                        },
                                    },
                                });
                            }
                        },
                    });
                }}
            />
        </>
    );
}
