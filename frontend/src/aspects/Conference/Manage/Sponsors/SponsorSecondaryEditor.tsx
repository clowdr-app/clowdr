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
    Button,
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
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Select,
    Spinner,
    Switch,
    Text,
    UnorderedList,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import {
    SponsorSecondaryEditor_ElementFragment,
    SponsorSecondaryEditor_ElementFragmentDoc,
    SponsorSecondaryEditor_ItemProgramPersonFragment,
    SponsorSecondaryEditor_ItemProgramPersonFragmentDoc,
    useSponsorElementInner_UpdateElementMutation,
    useSponsorElement_DeleteElementMutation,
    useSponsorElement_SetElementIsHiddenMutation,
    useSponsorSecondaryEditor_DeleteItemProgramPersonMutation,
    useSponsorSecondaryEditor_GetSponsorSecondaryInfoQuery,
    useSponsorSecondaryEditor_InsertItemProgramPersonMutation,
    useSponsorSecondaryEditor_SelectProgramPeopleQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { ElementBaseTemplates } from "../Content/Templates";
import type { ElementDescriptor } from "../Content/Types";
import { AddSponsorContentMenu } from "./AddSponsorContentMenu";
import { LayoutEditor } from "./LayoutEditor";
import type { SponsorInfoFragment } from "./Types";

gql`
    query SponsorSecondaryEditor_GetSponsorSecondaryInfo($itemId: uuid!) {
        content_Element(where: { itemId: { _eq: $itemId } }) {
            ...SponsorSecondaryEditor_Element
        }
        content_ItemProgramPerson(where: { itemId: { _eq: $itemId } }) {
            ...SponsorSecondaryEditor_ItemProgramPerson
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

    fragment SponsorSecondaryEditor_ItemProgramPerson on content_ItemProgramPerson {
        id
        itemId
        person {
            id
            name
            affiliation
            email
        }
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
    const itemId = index !== null && index < sponsors.length ? sponsors[index].id : undefined;
    const roomId = index !== null && index < sponsors.length ? sponsors[index].room?.id : undefined;
    const infoResult = useSponsorSecondaryEditor_GetSponsorSecondaryInfoQuery({
        variables: {
            itemId: itemId ?? "",
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
                        {itemId ? (
                            <AddSponsorContentMenu
                                itemId={itemId}
                                roomId={roomId ?? null}
                                refetch={async () => {
                                    await infoResult.refetch();
                                }}
                            />
                        ) : undefined}
                        {itemId ? (
                            <ApolloQueryWrapper
                                getter={(result) => ({
                                    elements: result.content_Element,
                                    representatives: result.content_ItemProgramPerson,
                                })}
                                queryResult={infoResult}
                            >
                                {(result: {
                                    elements: readonly SponsorSecondaryEditor_ElementFragment[];
                                    representatives: readonly SponsorSecondaryEditor_ItemProgramPersonFragment[];
                                }) => <SponsorElements itemId={itemId} {...result} />}
                            </ApolloQueryWrapper>
                        ) : undefined}
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}

export function SponsorElements({
    itemId,
    elements,
    representatives,
}: {
    itemId: string;
    elements: readonly SponsorSecondaryEditor_ElementFragment[];
    representatives: readonly SponsorSecondaryEditor_ItemProgramPersonFragment[];
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

    const repIds = useMemo(() => representatives.map((x) => x.id), [representatives]);

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
            <AccordionItem>
                <AccordionButton>Representatives</AccordionButton>
                <AccordionPanel pb={4}>
                    <VStack spacing={2} alignItems="flex-start">
                        <Text>Add or remove Program People as representatives of this sponsor.</Text>
                        <Text fontSize="sm" pb={2}>
                            Please add representatives to the Program People table and link them to their Registrant,
                            then link them to this sponsor booth.
                        </Text>
                        <AddSponsorRep itemId={itemId} existingPeopleIds={repIds} />
                        <SponsorRepsList representatives={representatives} />
                    </VStack>
                </AccordionPanel>
            </AccordionItem>
            {sortedElements.map((item) => (
                <SponsorElement key={item.id} element={item} />
            ))}
        </Accordion>
    );
}

gql`
    query SponsorSecondaryEditor_SelectProgramPeople($conferenceId: uuid!) {
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId }, registrantId: { _is_null: false } }) {
            ...SponsorSecondaryEditor_ProgramPerson
        }
    }

    fragment SponsorSecondaryEditor_ProgramPerson on collection_ProgramPerson {
        id
        name
        affiliation
        email
    }

    mutation SponsorSecondaryEditor_InsertItemProgramPerson($conferenceId: uuid!, $personId: uuid!, $itemId: uuid!) {
        insert_content_ItemProgramPerson_one(
            object: {
                conferenceId: $conferenceId
                personId: $personId
                itemId: $itemId
                priority: 1
                roleName: "AUTHOR"
            }
        ) {
            ...SponsorSecondaryEditor_ItemProgramPerson
        }
    }

    mutation SponsorSecondaryEditor_DeleteItemProgramPerson($itemPersonId: uuid!) {
        delete_content_ItemProgramPerson_by_pk(id: $itemPersonId) {
            id
        }
    }
`;

function AddSponsorRepBody({
    itemId,
    existingPeopleIds,
    onClose,
}: {
    itemId: string;
    existingPeopleIds: string[];
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const peopleResponse = useSponsorSecondaryEditor_SelectProgramPeopleQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [insertItemPerson, insertItemPersonResponse] = useSponsorSecondaryEditor_InsertItemProgramPersonMutation();

    const toast = useToast();
    return (
        <>
            <PopoverHeader>Link program person as representative</PopoverHeader>
            <PopoverBody>
                {peopleResponse.loading && !peopleResponse.data ? (
                    <Spinner label="Loading program people" />
                ) : undefined}
                {peopleResponse.data ? (
                    <Select
                        value={selectedPersonId ?? ""}
                        onChange={(ev) => setSelectedPersonId(ev.target.value === "" ? null : ev.target.value)}
                    >
                        <option value="">Select a program person</option>
                        {peopleResponse.data.collection_ProgramPerson
                            .filter((person) => !existingPeopleIds.includes(person.id))
                            .map((person) => (
                                <option key={person.id} value={person.id}>
                                    {person.name} {person.affiliation?.length ? `(${person.affiliation})` : ""} &lt;
                                    {person.email?.length ? person.email : "No email"}&gt;
                                </option>
                            ))}
                    </Select>
                ) : undefined}
            </PopoverBody>
            <PopoverFooter>
                <Button
                    colorScheme="green"
                    isDisabled={!selectedPersonId}
                    isLoading={insertItemPersonResponse.loading}
                    onClick={async () => {
                        try {
                            await insertItemPerson({
                                variables: {
                                    conferenceId: conference.id,
                                    itemId,
                                    personId: selectedPersonId,
                                },
                                update: (cache, response) => {
                                    if (response.data) {
                                        const data = response.data.insert_content_ItemProgramPerson_one;
                                        cache.modify({
                                            fields: {
                                                content_ItemProgramPerson(existingRefs: Reference[] = []) {
                                                    const newRef = cache.writeFragment({
                                                        data,
                                                        fragment: SponsorSecondaryEditor_ItemProgramPersonFragmentDoc,
                                                        fragmentName: "SponsorSecondaryEditor_ItemProgramPerson",
                                                    });
                                                    return [...existingRefs, newRef];
                                                },
                                            },
                                        });
                                    }
                                },
                            });

                            onClose();
                        } catch (e) {
                            toast({
                                title: "Error linking representative",
                                description: e.message ?? e.toString(),
                                isClosable: true,
                                duration: 10000,
                                position: "bottom",
                                status: "error",
                            });
                        }
                    }}
                >
                    Add link
                </Button>
            </PopoverFooter>
        </>
    );
}

function AddSponsorRep(props: { itemId: string; existingPeopleIds: string[] }): JSX.Element {
    const { onOpen, onClose, isOpen } = useDisclosure();

    return (
        <Popover placement="bottom-start" isLazy isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
            <PopoverTrigger>
                <Button size="sm" colorScheme="green">
                    <FAIcon iconStyle="s" icon="plus-square" mr={2} />
                    <chakra.span>Link representative</chakra.span>
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <AddSponsorRepBody onClose={onClose} {...props} />
            </PopoverContent>
        </Popover>
    );
}

function SponsorRepsList({
    representatives,
}: {
    representatives: readonly SponsorSecondaryEditor_ItemProgramPersonFragment[];
}): JSX.Element {
    const sortedReps = useMemo(() => R.sortBy((x) => x.person.name, representatives), [representatives]);
    const toast = useToast();
    const [deleteItemPerson, deleteItemPersonResponse] = useSponsorSecondaryEditor_DeleteItemProgramPersonMutation();

    return sortedReps.length > 0 ? (
        <>
            <Text>Representatives:</Text>
            <UnorderedList listStylePosition="inside">
                {sortedReps.map((rep) => (
                    <ListItem key={rep.id}>
                        <chakra.span>
                            {rep.person.name} &lt;{rep.person.email?.length ? rep.person.email : "No email"}&gt;
                        </chakra.span>
                        <Button
                            aria-label="Delete"
                            colorScheme="red"
                            size="xs"
                            ml={4}
                            isDisabled={deleteItemPersonResponse.loading}
                            onClick={async () => {
                                try {
                                    deleteItemPerson({
                                        variables: {
                                            itemPersonId: rep.id,
                                        },
                                        update: (cache, response) => {
                                            if (response.data?.delete_content_ItemProgramPerson_by_pk) {
                                                const deletedId =
                                                    response.data.delete_content_ItemProgramPerson_by_pk.id;
                                                cache.modify({
                                                    fields: {
                                                        content_ItemProgramPerson(
                                                            existingRefs: Reference[] = [],
                                                            { readField }
                                                        ) {
                                                            cache.evict({
                                                                id: deletedId,
                                                                fieldName: "SponsorSecondaryEditor_ItemProgramPerson",
                                                                broadcast: true,
                                                            });
                                                            return existingRefs.filter(
                                                                (ref) => readField("id", ref) !== deletedId
                                                            );
                                                        },
                                                    },
                                                });
                                            }
                                        },
                                    });
                                } catch (e) {
                                    toast({
                                        title: "Error unlinking representative",
                                        description: e.message ?? e.toString(),
                                        isClosable: true,
                                        duration: 10000,
                                        position: "bottom",
                                        status: "error",
                                    });
                                }
                            }}
                        >
                            <FAIcon iconStyle="s" icon="trash-alt" />
                        </Button>
                    </ListItem>
                ))}
            </UnorderedList>
        </>
    ) : (
        <Text>No representatives linked to this sponsor.</Text>
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
