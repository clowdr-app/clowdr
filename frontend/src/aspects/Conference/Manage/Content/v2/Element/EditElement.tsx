import { gql, Reference } from "@apollo/client";
import {
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    ButtonGroup,
    chakra,
    HStack,
    IconButton,
    Input,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useCallback, useRef, useState } from "react";
import {
    ManageContent_ElementFragment,
    ManageContent_ElementFragmentDoc,
    useManageContent_DeleteElementMutation,
    useManageContent_UpdateElementMutation,
} from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { EditElementsPermissionGrantsModal } from "../Security/EditElementsPermissionGrantsModal";
import { EditElementInner } from "./EditElementInner";

gql`
    mutation ManageContent_DeleteElement($elementId: uuid!) {
        delete_content_Element_by_pk(id: $elementId) {
            id
        }
    }

    mutation ManageContent_UpdateElement($elementId: uuid!, $element: content_Element_set_input!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: $element) {
            ...ManageContent_Element
        }
    }
`;

export function EditElement({
    element,
    idx,
    previousElement,
    nextElement,
    refetchElements,
    defaultOpenSecurity,
    openSendSubmissionRequests,
}: {
    element: ManageContent_ElementFragment | ManageContent_ElementFragment;
    idx: number;
    previousElement?: ManageContent_ElementFragment | ManageContent_ElementFragment;
    nextElement?: ManageContent_ElementFragment | ManageContent_ElementFragment;
    refetchElements: () => void;
    defaultOpenSecurity: boolean;
    openSendSubmissionRequests: (uploaderIds: string[]) => void;
}): JSX.Element {
    const [updateElement, updateElementResponse] = useManageContent_UpdateElementMutation({
        update: (cache, response) => {
            if (response.data?.update_content_Element_by_pk) {
                const data = response.data.update_content_Element_by_pk;
                cache.modify({
                    fields: {
                        content_Element(existingRefs: Reference[] = [], { readField }) {
                            const newRef = cache.writeFragment({
                                data,
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
    const [deleteElement, deleteElementResponse] = useManageContent_DeleteElementMutation({
        update: (cache, { data: _data }) => {
            if (_data?.delete_content_Element_by_pk) {
                const data = _data.delete_content_Element_by_pk;
                cache.modify({
                    fields: {
                        content_Element(existingRefs: Reference[] = [], { readField }) {
                            cache.evict({
                                id: data.id,
                                fieldName: "ManageContent_ElementFragment",
                                broadcast: true,
                            });
                            return existingRefs.filter((ref) => data.id !== readField("id", ref));
                        },
                    },
                });
            }
        },
    });

    const toast = useToast();

    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(element.name);

    const {
        isOpen: confirmDelete_IsOpen,
        onOpen: confirmDelete_OnOpen,
        onClose: confirmDelete_OnClose,
    } = useDisclosure();
    const cancelRef = useRef<HTMLButtonElement>(null);

    const {
        isOpen: editPGs_IsOpen,
        onOpen: editPGs_OnOpen,
        onClose: editPGs_OnClose,
    } = useDisclosure({
        defaultIsOpen: defaultOpenSecurity,
    });
    const editPGs_OnCloseFull = useCallback(() => {
        refetchElements();
        editPGs_OnClose();
    }, [editPGs_OnClose, refetchElements]);

    const bgColor = useColorModeValue("gray.100", "gray.800");
    return (
        <>
            <AccordionItem w="100%">
                {({ isExpanded }) => (
                    <>
                        <AccordionButton
                            as={"div"}
                            cursor="pointer"
                            tabIndex={0}
                            bgColor={bgColor}
                            onKeyUp={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") {
                                    (ev.target as HTMLDivElement).click();
                                }
                            }}
                        >
                            {element ? (
                                <ButtonGroup mr={2}>
                                    <Tooltip label="Move element up">
                                        <Button
                                            size="xs"
                                            isDisabled={!previousElement}
                                            onClick={(ev) => {
                                                ev.stopPropagation();

                                                if (previousElement) {
                                                    const layoutDataA: LayoutDataBlob = {
                                                        contentType: element.typeName,
                                                        wide: false,
                                                        hidden: false,
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
                                                    });

                                                    const layoutDataB: LayoutDataBlob = {
                                                        contentType: previousElement.typeName,
                                                        wide: false,
                                                        hidden: false,
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
                                            isDisabled={!nextElement}
                                            onClick={(ev) => {
                                                ev.stopPropagation();

                                                if (nextElement) {
                                                    const layoutDataA: LayoutDataBlob = {
                                                        contentType: element.typeName,
                                                        wide: false,
                                                        hidden: false,
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
                                                    });

                                                    const layoutDataB: LayoutDataBlob = {
                                                        contentType: nextElement.typeName,
                                                        wide: false,
                                                        hidden: false,
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
                            ) : undefined}
                            <Tooltip
                                label={
                                    element.isHidden
                                        ? "Show this element to attendees."
                                        : "Hide this element from attendees."
                                }
                            >
                                <Button
                                    aria-label={
                                        element.isHidden
                                            ? "Show this element to attendees."
                                            : "Hide this element from attendees."
                                    }
                                    mr={4}
                                    size="xs"
                                    isLoading={updateElementResponse.loading}
                                    onClick={(ev) => {
                                        ev.stopPropagation();

                                        const isHidden = !element.isHidden;
                                        updateElement({
                                            variables: {
                                                elementId: element.id,
                                                element: { isHidden },
                                            },
                                            optimisticResponse: {
                                                update_content_Element_by_pk: {
                                                    ...element,
                                                    isHidden,
                                                    __typename: "content_Element",
                                                },
                                            },
                                        });
                                    }}
                                    onKeyUp={(ev) => {
                                        ev.stopPropagation();
                                    }}
                                >
                                    <FAIcon iconStyle="s" icon={element.isHidden ? "eye" : "eye-slash"} />
                                </Button>
                            </Tooltip>
                            <HStack textAlign="left" mr={2} minW="auto" w="auto">
                                {!("layoutData" in element) ? <chakra.span>(Uploadable)</chakra.span> : undefined}
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
                                            onKeyDown={(ev) => {
                                                ev.stopPropagation();
                                            }}
                                            onKeyPress={(ev) => {
                                                ev.stopPropagation();
                                            }}
                                            onKeyUp={(ev) => {
                                                ev.stopPropagation();
                                            }}
                                        />
                                        <Tooltip label="Save element name">
                                            <Button
                                                colorScheme="purple"
                                                size="xs"
                                                aria-label="Save element name"
                                                mx={2}
                                                isLoading={updateElementResponse.loading}
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
                                                    });
                                                }}
                                                onKeyUp={(ev) => {
                                                    ev.stopPropagation();
                                                }}
                                            >
                                                <FAIcon iconStyle="s" icon="save" />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip label="Discard name changes">
                                            <Button
                                                colorScheme="yellow"
                                                size="xs"
                                                aria-label="Discard name changes"
                                                mx={2}
                                                isLoading={updateElementResponse.loading}
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    setIsEditingTitle(false);
                                                    setNewName(element.name);
                                                }}
                                                onKeyUp={(ev) => {
                                                    ev.stopPropagation();
                                                }}
                                            >
                                                <FAIcon iconStyle="s" icon="ban" />
                                            </Button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <>
                                        <Text
                                            textOverflow="wrap"
                                            wordBreak="break-all"
                                            noOfLines={1}
                                            minW="auto"
                                            w="auto"
                                        >
                                            {element.name}
                                        </Text>
                                        <Tooltip label="Edit element name">
                                            <Button
                                                size="xs"
                                                aria-label="Edit element name"
                                                mx={2}
                                                isLoading={updateElementResponse.loading}
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
                                        editPGs_OnOpen();
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
                            {isExpanded ? (
                                <EditElementInner
                                    element={element}
                                    openSendSubmissionRequests={openSendSubmissionRequests}
                                />
                            ) : undefined}
                        </AccordionPanel>
                    </>
                )}
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
                                        });
                                        confirmDelete_OnClose();
                                    } catch (e) {
                                        toast({
                                            status: "error",
                                            title: "Could not delete element",
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
            <EditElementsPermissionGrantsModal
                isOpen={editPGs_IsOpen}
                onClose={editPGs_OnCloseFull}
                elementIds={[element.id]}
            />
        </>
    );
}
