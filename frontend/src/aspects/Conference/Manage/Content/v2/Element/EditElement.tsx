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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import { gql } from "@urql/core";
import React, { useRef, useState } from "react";
import type { ManageContent_ElementFragment } from "../../../../../../generated/graphql";
import {
    useManageContent_DeleteElementMutation,
    useManageContent_UpdateElementMutation,
} from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";
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
    openSendSubmissionRequests,
}: {
    element: ManageContent_ElementFragment | ManageContent_ElementFragment;
    idx: number;
    previousElement?: ManageContent_ElementFragment | ManageContent_ElementFragment;
    nextElement?: ManageContent_ElementFragment | ManageContent_ElementFragment;
    openSendSubmissionRequests: (personIds: string[]) => void;
}): JSX.Element {
    const [updateElementResponse, updateElement] = useManageContent_UpdateElementMutation();
    const [deleteElementResponse, deleteElement] = useManageContent_DeleteElementMutation();

    const toast = useToast();

    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(element.name);

    const {
        isOpen: confirmDelete_IsOpen,
        onOpen: confirmDelete_OnOpen,
        onClose: confirmDelete_OnClose,
    } = useDisclosure();
    const cancelRef = useRef<HTMLButtonElement>(null);

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
                                                    updateElement(
                                                        {
                                                            elementId: element.id,
                                                            element: {
                                                                layoutData: layoutDataA,
                                                            },
                                                        },
                                                        {
                                                            fetchOptions: {
                                                                headers: {
                                                                    [AuthHeader.Role]:
                                                                        HasuraRoleName.SubconferenceOrganizer,
                                                                },
                                                            },
                                                        }
                                                    );

                                                    const layoutDataB: LayoutDataBlob = {
                                                        contentType: previousElement.typeName,
                                                        wide: false,
                                                        hidden: false,
                                                        ...previousElement.layoutData,
                                                        priority: idx,
                                                    };
                                                    updateElement(
                                                        {
                                                            elementId: previousElement.id,
                                                            element: {
                                                                layoutData: layoutDataB,
                                                            },
                                                        },
                                                        {
                                                            fetchOptions: {
                                                                headers: {
                                                                    [AuthHeader.Role]:
                                                                        HasuraRoleName.SubconferenceOrganizer,
                                                                },
                                                            },
                                                        }
                                                    );
                                                }
                                            }}
                                            onKeyUp={(ev) => {
                                                ev.stopPropagation();
                                            }}
                                            aria-label="Move item up"
                                            isLoading={updateElementResponse.fetching}
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
                                                    updateElement(
                                                        {
                                                            elementId: element.id,
                                                            element: {
                                                                layoutData: layoutDataA,
                                                            },
                                                        },
                                                        {
                                                            fetchOptions: {
                                                                headers: {
                                                                    [AuthHeader.Role]:
                                                                        HasuraRoleName.SubconferenceOrganizer,
                                                                },
                                                            },
                                                        }
                                                    );

                                                    const layoutDataB: LayoutDataBlob = {
                                                        contentType: nextElement.typeName,
                                                        wide: false,
                                                        hidden: false,
                                                        ...nextElement.layoutData,
                                                        priority: idx,
                                                    };
                                                    updateElement(
                                                        {
                                                            elementId: nextElement.id,
                                                            element: {
                                                                layoutData: layoutDataB,
                                                            },
                                                        },
                                                        {
                                                            fetchOptions: {
                                                                headers: {
                                                                    [AuthHeader.Role]:
                                                                        HasuraRoleName.SubconferenceOrganizer,
                                                                },
                                                            },
                                                        }
                                                    );
                                                }
                                            }}
                                            onKeyUp={(ev) => {
                                                ev.stopPropagation();
                                            }}
                                            aria-label="Move item down"
                                            isLoading={updateElementResponse.fetching}
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
                                    isLoading={updateElementResponse.fetching}
                                    onClick={(ev) => {
                                        ev.stopPropagation();

                                        const isHidden = !element.isHidden;
                                        updateElement(
                                            {
                                                elementId: element.id,
                                                element: { isHidden },
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
                                    }}
                                    onKeyUp={(ev) => {
                                        ev.stopPropagation();
                                    }}
                                >
                                    <FAIcon iconStyle="s" icon={element.isHidden ? "eye-slash" : "eye"} />
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
                                                isLoading={updateElementResponse.fetching}
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    setIsEditingTitle(false);

                                                    updateElement(
                                                        {
                                                            elementId: element.id,
                                                            element: {
                                                                name: newName,
                                                            },
                                                        },
                                                        {
                                                            fetchOptions: {
                                                                headers: {
                                                                    [AuthHeader.Role]:
                                                                        HasuraRoleName.SubconferenceOrganizer,
                                                                },
                                                            },
                                                        }
                                                    );
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
                                                isLoading={updateElementResponse.fetching}
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
                                                isLoading={updateElementResponse.fetching}
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
                            {/* TODO: Do we want to re-introduce per-element visibility controls?
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
                            </Tooltip> */}
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
                                    isLoading={deleteElementResponse.fetching}
                                    ml="auto"
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
                                        await deleteElement(
                                            {
                                                elementId: element.id,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                                    },
                                                },
                                            }
                                        );
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
        </>
    );
}
