import { gql, Reference } from "@apollo/client";
import { ChevronDownIcon, ExternalLinkIcon } from "@chakra-ui/icons";
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
    ButtonGroup,
    chakra,
    Code,
    Divider,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    IconButton,
    Menu,
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
    Tooltip,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import {
    ManageContent_ElementFragment,
    ManageContent_ElementFragmentDoc,
    ManageContent_ItemProgramPersonFragment,
    ManageContent_ItemProgramPersonFragmentDoc,
    ManageContent_ItemSecondaryFragment,
    useManageContent_DeleteElementMutation,
    useManageContent_DeleteItemProgramPersonMutation,
    useManageContent_InsertItemProgramPersonMutation,
    useManageContent_SelectItemQuery,
    useManageContent_SelectProgramPeopleQuery,
    useManageContent_SetElementIsHiddenMutation,
    useManageContent_UpdateElementMutation,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../../Icons/FAIcon";
import { maybeCompare } from "../../../../Utils/maybeSort";
import { useConference } from "../../../useConference";
import { ElementBaseTemplates } from "../Templates";
import type { ElementDescriptor } from "../Types";
import { AddContentMenu } from "./AddContentMenu";
import { LayoutEditor } from "./LayoutEditor";

export function SecondaryEditor({
    itemId,
    isOpen,
    onClose,
}: {
    itemId: string | null;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    return (
        <>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader pb={0}>
                        <Text fontSize="lg">Edit item</Text>
                        <Code fontSize="xs">{itemId}</Code>
                    </DrawerHeader>

                    <DrawerBody>{itemId && <SecondaryEditorInner itemId={itemId} />}</DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}

function SecondaryEditorInner({ itemId }: { itemId: string }): JSX.Element {
    const conference = useConference();
    const itemResponse = useManageContent_SelectItemQuery({
        variables: {
            itemId,
        },
        fetchPolicy: "network-only",
    });

    return (
        <VStack w="100%" alignItems="flex-start">
            <HStack flexWrap="wrap" justifyContent="flex-start" w="100%">
                <LinkButton
                    size="sm"
                    to={`/conference/${conference.slug}/item/${itemId}`}
                    isExternal
                    aria-label="View item"
                    title="View item"
                >
                    View item&nbsp;
                    <ExternalLinkIcon />
                </LinkButton>
                {itemResponse.data?.content_Item_by_pk ? (
                    <>
                        {itemResponse.data.content_Item_by_pk.rooms.length === 1 ? (
                            <LinkButton
                                size="sm"
                                to={`/conference/${conference.slug}/room/${itemResponse.data.content_Item_by_pk.rooms[0].id}`}
                                isExternal
                                aria-label="View discussion room"
                                title="View discussion room"
                            >
                                View discussion room&nbsp;
                                <ExternalLinkIcon />
                            </LinkButton>
                        ) : itemResponse.data.content_Item_by_pk.rooms.length > 1 ? (
                            <Menu>TODO</Menu>
                        ) : undefined}
                        <AddContentMenu
                            itemId={itemId}
                            roomId={itemResponse.data.content_Item_by_pk.rooms[0]?.id ?? null}
                            refetch={async () => {
                                await itemResponse.refetch();
                            }}
                        />
                    </>
                ) : undefined}
            </HStack>
            <ApolloQueryWrapper getter={(result) => result.content_Item_by_pk} queryResult={itemResponse}>
                {(result: ManageContent_ItemSecondaryFragment) => <Elements itemId={itemId} {...result} />}
            </ApolloQueryWrapper>
        </VStack>
    );
}

function Elements({
    itemId,
    elements,
    itemPeople,
    itemExhibitions,
    rooms,
    chatId,
    originatingData,
}: { itemId: string } & ManageContent_ItemSecondaryFragment): JSX.Element {
    const conference = useConference();

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

    const itemPeopleIds = useMemo(() => itemPeople.map((x) => x.id), [itemPeople]);

    return (
        <Accordion allowToggle allowMultiple w="100%">
            <AccordionItem w="100%">
                <AccordionButton>People</AccordionButton>
                <AccordionPanel pb={4}>
                    <VStack spacing={2} alignItems="flex-start">
                        <Text>Add or remove Program People associated with this item.</Text>
                        <Text fontSize="sm" pb={2}>
                            Please add people to the Program People table (optionally link them to their Registrant),
                            then link them to this item.
                        </Text>
                        <ButtonGroup>
                            <AddItemPerson itemId={itemId} existingPeopleIds={itemPeopleIds} />
                            <LinkButton size="sm" to={`/conference/${conference.slug}/manage/people`}>
                                <Tooltip label="Link opens in the same tab">Manage Program People</Tooltip>
                            </LinkButton>
                        </ButtonGroup>
                        <ItemPersonsList itemPeople={itemPeople} />
                    </VStack>
                </AccordionPanel>
            </AccordionItem>
            {sortedElements.map((item) => (
                <Element key={item.id} element={item} />
            ))}
        </Accordion>
    );
}

gql`
    query ManageContent_SelectProgramPeople($conferenceId: uuid!) {
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId }, registrantId: { _is_null: false } }) {
            ...ManageContent_ProgramPerson
        }
    }

    mutation ManageContent_InsertItemProgramPerson($conferenceId: uuid!, $personId: uuid!, $itemId: uuid!) {
        insert_content_ItemProgramPerson_one(
            object: {
                conferenceId: $conferenceId
                personId: $personId
                itemId: $itemId
                priority: 1
                roleName: "AUTHOR"
            }
        ) {
            ...ManageContent_ItemProgramPerson
        }
    }

    mutation ManageContent_DeleteItemProgramPerson($itemPersonId: uuid!) {
        delete_content_ItemProgramPerson_by_pk(id: $itemPersonId) {
            id
        }
    }
`;

function AddRepBody({
    itemId,
    existingPeopleIds,
    onClose,
}: {
    itemId: string;
    existingPeopleIds: string[]; // TODO: This needs to be a pair of id and role
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const peopleResponse = useManageContent_SelectProgramPeopleQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [insertItemPerson, insertItemPersonResponse] = useManageContent_InsertItemProgramPersonMutation();

    const sortedPeople = useMemo(
        () =>
            peopleResponse.data?.collection_ProgramPerson
                .filter((person) => !existingPeopleIds.includes(person.id))
                .sort((x, y) => x.name.localeCompare(y.name)),
        [existingPeopleIds, peopleResponse.data?.collection_ProgramPerson]
    );

    const toast = useToast();
    return (
        <>
            <PopoverHeader>Link program person</PopoverHeader>
            <PopoverBody>
                {peopleResponse.loading && !sortedPeople ? <Spinner label="Loading program people" /> : undefined}
                {sortedPeople ? (
                    <Select
                        value={selectedPersonId ?? ""}
                        onChange={(ev) => setSelectedPersonId(ev.target.value === "" ? null : ev.target.value)}
                    >
                        <option value="">Select a program person</option>
                        {sortedPeople.map((person) => (
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
                                    // TODO: Role
                                    // TODO: Priority
                                },
                                update: (cache, response) => {
                                    if (response.data) {
                                        const data = response.data.insert_content_ItemProgramPerson_one;
                                        cache.modify({
                                            fields: {
                                                content_ItemProgramPerson(existingRefs: Reference[] = []) {
                                                    const newRef = cache.writeFragment({
                                                        data,
                                                        fragment: ManageContent_ItemProgramPersonFragmentDoc,
                                                        fragmentName: "ManageContent_ItemProgramPerson",
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
                                title: "Error linking person",
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

function AddItemPerson(props: { itemId: string; existingPeopleIds: string[] }): JSX.Element {
    const { onOpen, onClose, isOpen } = useDisclosure();

    return (
        <Popover placement="bottom-start" isLazy isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
            <PopoverTrigger>
                <Button size="sm" colorScheme="green">
                    <FAIcon iconStyle="s" icon="plus-square" mr={2} />
                    <chakra.span>Link person</chakra.span>
                    <ChevronDownIcon ml={1} />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <AddRepBody onClose={onClose} {...props} />
            </PopoverContent>
        </Popover>
    );
}

function ItemPersonsList({
    itemPeople,
}: {
    itemPeople: readonly ManageContent_ItemProgramPersonFragment[];
}): JSX.Element {
    const sortedReps = useMemo(
        () =>
            R.sortWith(
                [
                    (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
                    (x, y) => x.person.name.localeCompare(y.person.name),
                ],
                itemPeople
            ),
        [itemPeople]
    );
    const toast = useToast();
    const [deleteItemPerson, deleteItemPersonResponse] = useManageContent_DeleteItemProgramPersonMutation();

    // TODO: Roles

    return sortedReps.length > 0 ? (
        <>
            <Text>People:</Text>
            <VStack w="100%">
                {sortedReps.map((person, idx) => (
                    <Flex key={person.id} w="100%">
                        <ButtonGroup mr={2}>
                            <Button
                                size="xs"
                                isDisabled={idx === 0}
                                onClick={() => {
                                    // TODO
                                }}
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                            </Button>
                            <Button
                                size="xs"
                                isDisabled={idx === sortedReps.length - 1}
                                onClick={() => {
                                    // TODO
                                }}
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                            </Button>
                        </ButtonGroup>
                        <chakra.span>
                            {person.person.name} &lt;{person.person.email?.length ? person.person.email : "No email"}
                            &gt;
                        </chakra.span>
                        <Select
                            ml="auto"
                            size="xs"
                            value={person.roleName}
                            w="auto"
                            onSelect={(ev) => {
                                // TODO
                            }}
                        >
                            <option value="AUTHOR">Author</option>
                            <option value="CHAIR">Chair</option>
                            <option value="PRESENTER">Presenter</option>
                        </Select>
                        <Button
                            ml={2}
                            aria-label="Delete"
                            colorScheme="red"
                            size="xs"
                            isDisabled={deleteItemPersonResponse.loading}
                            onClick={async () => {
                                try {
                                    deleteItemPerson({
                                        variables: {
                                            itemPersonId: person.id,
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
                                                                fieldName: "ManageContent_ItemProgramPerson",
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
                                        title: "Error unlinking person",
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
                    </Flex>
                ))}
            </VStack>
        </>
    ) : (
        <Text>No people linked to this item.</Text>
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
            id
        }
    }

    mutation ManageContent_UpdateElement($elementId: uuid!, $element: content_Element_set_input!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: $element) {
            id
        }
    }
`;

export function Element({ element }: { element: ManageContent_ElementFragment }): JSX.Element {
    const [deleteElement] = useManageContent_DeleteElementMutation();
    const toast = useToast();

    return (
        <AccordionItem w="100%">
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    {element.name}
                </Box>
                <Tooltip label="Manage element security">
                    <IconButton
                        colorScheme="yellow"
                        size="xs"
                        aria-label="Element security"
                        icon={<FAIcon iconStyle="s" icon="lock" />}
                        onClick={() => {
                            // TODO
                        }}
                    />
                </Tooltip>
                <Tooltip label="Delete element">
                    <IconButton
                        colorScheme="red"
                        size="xs"
                        aria-label="Delete element"
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
                            } catch (e) {
                                toast({
                                    status: "error",
                                    title: "Could not delete content",
                                });
                            }
                        }}
                        ml={2}
                    />
                </Tooltip>
                <AccordionIcon ml={2} />
            </AccordionButton>
            <AccordionPanel pb={4}>
                <ElementInner element={element} />
            </AccordionPanel>
        </AccordionItem>
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
