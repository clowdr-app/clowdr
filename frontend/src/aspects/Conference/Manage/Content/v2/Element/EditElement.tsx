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
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    ManageContent_ElementFragment,
    ManageContent_ElementFragmentDoc,
    ManageContent_UploadableElementFragment,
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
    element: ManageContent_ElementFragment | ManageContent_UploadableElementFragment;
    idx: number;
    previousElement?: ManageContent_ElementFragment | ManageContent_UploadableElementFragment;
    nextElement?: ManageContent_ElementFragment | ManageContent_UploadableElementFragment;
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

    const actualElement = useMemo(
        () =>
            "layoutData" in element ? element : "element" in element && element.element ? element.element : undefined,
        [element]
    );
    const actualPreviousElement = useMemo(
        () =>
            previousElement &&
            ("layoutData" in previousElement
                ? previousElement
                : "element" in previousElement && previousElement.element
                ? previousElement.element
                : undefined),
        [previousElement]
    );
    const actualNextElement = useMemo(
        () =>
            nextElement &&
            ("layoutData" in nextElement
                ? nextElement
                : "element" in nextElement && nextElement.element
                ? nextElement.element
                : undefined),
        [nextElement]
    );

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
                            {actualElement ? (
                                <ButtonGroup mr={2}>
                                    <Tooltip label="Move element up">
                                        <Button
                                            size="xs"
                                            isDisabled={!actualPreviousElement}
                                            onClick={(ev) => {
                                                ev.stopPropagation();

                                                if (actualPreviousElement) {
                                                    const layoutDataA: LayoutDataBlob = {
                                                        contentType: actualElement.typeName,
                                                        wide: false,
                                                        hidden: false,
                                                        ...actualElement.layoutData,
                                                        priority: idx - 1,
                                                    };
                                                    updateElement({
                                                        variables: {
                                                            elementId: actualElement.id,
                                                            element: {
                                                                layoutData: layoutDataA,
                                                            },
                                                        },
                                                    });

                                                    const layoutDataB: LayoutDataBlob = {
                                                        contentType: actualPreviousElement.typeName,
                                                        wide: false,
                                                        hidden: false,
                                                        ...actualPreviousElement.layoutData,
                                                        priority: idx,
                                                    };
                                                    updateElement({
                                                        variables: {
                                                            elementId: actualPreviousElement.id,
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
                                            isDisabled={!actualNextElement}
                                            onClick={(ev) => {
                                                ev.stopPropagation();

                                                if (actualNextElement) {
                                                    const layoutDataA: LayoutDataBlob = {
                                                        contentType: actualElement.typeName,
                                                        wide: false,
                                                        hidden: false,
                                                        ...actualElement.layoutData,
                                                        priority: idx + 1,
                                                    };
                                                    updateElement({
                                                        variables: {
                                                            elementId: actualElement.id,
                                                            element: {
                                                                layoutData: layoutDataA,
                                                            },
                                                        },
                                                    });

                                                    const layoutDataB: LayoutDataBlob = {
                                                        contentType: actualNextElement.typeName,
                                                        wide: false,
                                                        hidden: false,
                                                        ...actualNextElement.layoutData,
                                                        priority: idx,
                                                    };
                                                    updateElement({
                                                        variables: {
                                                            elementId: actualNextElement.id,
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
                                    (actualElement ? actualElement.isHidden : element.isHidden)
                                        ? "Show this element to attendees."
                                        : "Hide this element from attendees."
                                }
                            >
                                <Button
                                    aria-label={
                                        (actualElement ? actualElement.isHidden : element.isHidden)
                                            ? "Show this element to attendees."
                                            : "Hide this element from attendees."
                                    }
                                    mr={4}
                                    size="xs"
                                    isLoading={updateElementResponse.loading || updateUploadableElementResponse.loading}
                                    onClick={(ev) => {
                                        ev.stopPropagation();

                                        const isHidden = !(actualElement ? actualElement.isHidden : element.isHidden);
                                        if (actualElement) {
                                            updateElement({
                                                variables: {
                                                    elementId: actualElement.id,
                                                    element: { isHidden },
                                                },
                                                optimisticResponse: {
                                                    update_content_Element_by_pk: {
                                                        ...actualElement,
                                                        isHidden,
                                                        __typename: "content_Element",
                                                    },
                                                },
                                            });
                                        }

                                        if (!("layoutData" in element)) {
                                            updateUploadableElement({
                                                variables: {
                                                    uploadableElementId: element.id,
                                                    uploadableElement: { isHidden },
                                                },
                                            });
                                        }
                                    }}
                                    onKeyUp={(ev) => {
                                        ev.stopPropagation();
                                    }}
                                >
                                    <FAIcon
                                        iconStyle="s"
                                        icon={
                                            !(actualElement ? actualElement.isHidden : element.isHidden)
                                                ? "eye"
                                                : "eye-slash"
                                        }
                                    />
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
                                                isLoading={
                                                    updateElementResponse.loading ||
                                                    updateUploadableElementResponse.loading
                                                }
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    setIsEditingTitle(false);

                                                    if (actualElement) {
                                                        updateElement({
                                                            variables: {
                                                                elementId: actualElement.id,
                                                                element: {
                                                                    name: newName,
                                                                },
                                                            },
                                                        });
                                                    }

                                                    if (!("layoutData" in element)) {
                                                        updateUploadableElement({
                                                            variables: {
                                                                uploadableElementId: element.id,
                                                                uploadableElement: {
                                                                    name: newName,
                                                                },
                                                            },
                                                        });
                                                    }
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
                                                isLoading={
                                                    updateElementResponse.loading ||
                                                    updateUploadableElementResponse.loading
                                                }
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
                                                isLoading={
                                                    updateElementResponse.loading ||
                                                    updateUploadableElementResponse.loading
                                                }
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
                                    isLoading={deleteElementResponse.loading || deleteUploadableElementResponse.loading}
                                    ml={2}
                                />
                            </Tooltip>
                            <AccordionIcon ml={2} />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                            {isExpanded ? (
                                <EditElementInner
                                    element={actualElement ?? null}
                                    uploadableElement={
                                        (!("layoutData" in element)
                                            ? (element as ManageContent_UploadableElementFragment)
                                            : null) as any
                                    }
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
                                        if ("layoutData" in element) {
                                            await deleteElement({
                                                variables: {
                                                    elementId: element.id,
                                                },
                                            });
                                        } else {
                                            await deleteUploadableElement({
                                                variables: {
                                                    uploadableElementId: element.id,
                                                },
                                            });
                                        }
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
                elementIds={"layoutData" in element ? [element.id] : []}
                uploadableIds={
                    !("layoutData" in element)
                        ? [
                              {
                                  elementId: (element as ManageContent_UploadableElementFragment).element?.id,
                                  uploadableId: element.id,
                              },
                          ]
                        : []
                }
            />
        </>
    );
}
