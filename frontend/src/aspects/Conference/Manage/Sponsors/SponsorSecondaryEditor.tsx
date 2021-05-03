import { gql, Reference } from "@apollo/client";
import { InfoIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    chakra,
    Divider,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    IconButton,
    ListItem,
    OrderedList,
    Spinner,
    Switch,
    Text,
    useToast,
} from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    SponsorSecondaryEditor_ElementFragment,
    SponsorSecondaryEditor_ElementFragmentDoc,
    useSponsorElementInner_UpdateElementMutation,
    useSponsorElement_DeleteElementMutation,
    useSponsorElement_SetElementIsHiddenMutation,
    useSponsorSecondaryEditor_GetSponsorElementsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import FAIcon from "../../../Icons/FAIcon";
import { ElementBaseTemplates } from "../Content/Templates";
import type { ElementDescriptor } from "../Content/Types";
import { AddSponsorContentMenu } from "./AddSponsorContentMenu";
import { LayoutEditor } from "./LayoutEditor";
import type { SponsorInfoFragment } from "./Types";

gql`
    query SponsorSecondaryEditor_GetSponsorElements($itemId: uuid!) {
        content_Element(where: { itemId: { _eq: $itemId } }) {
            ...SponsorSecondaryEditor_Element
        }
    }

    fragment SponsorSecondaryEditor_Element on content_Element {
        id
        name
        typeName
        data
        layoutData
        isHidden
        updatedAt
    }
`;

export function SponsorSecondaryEditor({
    sponsors,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
    index,
}: {
    sponsors: readonly SponsorInfoFragment[];
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
    index: number | null;
}): JSX.Element {
    const elementsResult = useSponsorSecondaryEditor_GetSponsorElementsQuery({
        variables: {
            itemId: index !== null && index < sponsors.length ? sponsors[index].id : "",
        },
        skip: index === null || index >= sponsors.length,
    });

    return (
        <Drawer isOpen={isSecondaryPanelOpen} onClose={onSecondaryPanelClose} size="lg">
            <DrawerOverlay>
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Edit</DrawerHeader>
                    <DrawerBody>
                        {index !== null ? (
                            <AddSponsorContentMenu
                                itemId={sponsors[index].id}
                                roomId={sponsors[index].room?.id ?? null}
                                refetch={async () => {
                                    await elementsResult.refetch();
                                }}
                            />
                        ) : undefined}
                        <ApolloQueryWrapper getter={(result) => result.content_Element} queryResult={elementsResult}>
                            {(elements: readonly SponsorSecondaryEditor_ElementFragment[]) => (
                                <SponsorElements elements={elements} />
                            )}
                        </ApolloQueryWrapper>
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}

export function SponsorElements({
    elements,
}: {
    elements: readonly SponsorSecondaryEditor_ElementFragment[];
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
        <Accordion allowToggle allowMultiple>
            <AccordionItem>
                <AccordionButton>
                    <Box flex="1" textAlign="left">
                        <InfoIcon mr={2} verticalAlign="middle" />
                        <chakra.span>How to add a sponsor&apos;s logo</chakra.span>
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                    <OrderedList>
                        <ListItem>Add content of type &ldquo;Image file&rdquo;</ListItem>
                        <ListItem>Enable the &ldquo;Is logo&rdquo; option</ListItem>
                        <ListItem>For correct display, please also enable the &ldquo;Hidden&rdquo; option</ListItem>
                        <ListItem>Upload the logo file</ListItem>
                    </OrderedList>
                </AccordionPanel>
            </AccordionItem>
            {sortedElements.map((item) => (
                <SponsorElement key={item.id} element={item} />
            ))}
        </Accordion>
    );
}

gql`
    mutation SponsorElement_DeleteElement($elementId: uuid!) {
        delete_content_Element_by_pk(id: $elementId) {
            id
        }
    }

    mutation SponsorElement_SetElementIsHidden($elementId: uuid!, $isHidden: Boolean!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: { isHidden: $isHidden }) {
            id
        }
    }

    mutation SponsorElementInner_UpdateElement($elementId: uuid!, $element: content_Element_set_input!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: $element) {
            id
        }
    }
`;

export function SponsorElement({ element }: { element: SponsorSecondaryEditor_ElementFragment }): JSX.Element {
    return (
        <AccordionItem>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    {element.name}
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
                <SponsorElementInner element={element} />
            </AccordionPanel>
        </AccordionItem>
    );
}

function SponsorElementInner({ element }: { element: SponsorSecondaryEditor_ElementFragment }): JSX.Element {
    const [deleteElement] = useSponsorElement_DeleteElementMutation();
    const [setIsHidden, setIsHiddenResponse] = useSponsorElement_SetElementIsHiddenMutation();
    const [updateElement, updateElementResponse] = useSponsorElementInner_UpdateElementMutation();
    const toast = useToast();

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
                                                    fragment: SponsorSecondaryEditor_ElementFragmentDoc,
                                                    fragmentName: "SponsorSecondaryEditor_Element",
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
                                                        fragment: SponsorSecondaryEditor_ElementFragmentDoc,
                                                        fragmentName: "SponsorSecondaryEditor_Element",
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
                <Box>
                    <IconButton
                        colorScheme="red"
                        size="sm"
                        aria-label="Delete content"
                        icon={<FAIcon iconStyle="s" icon="trash-alt" />}
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
                                                    content_Element(existingRefs: Reference[] = [], { readField }) {
                                                        cache.evict({
                                                            id: data.id,
                                                            fieldName: "SponsorSecondaryEditor_ElementFragment",
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
                            } catch (e) {
                                toast({
                                    status: "error",
                                    title: "Could not delete content",
                                });
                            }
                        }}
                    />
                </Box>
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
                                                fragment: SponsorSecondaryEditor_ElementFragmentDoc,
                                                fragmentName: "SponsorSecondaryEditor_Element",
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
