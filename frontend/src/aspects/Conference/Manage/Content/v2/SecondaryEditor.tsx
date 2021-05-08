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
    useColorModeValue,
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
    useManageContent_SelectItemPeopleQuery,
    useManageContent_SelectItemQuery,
    useManageContent_SelectProgramPeopleQuery,
    useManageContent_SetElementIsHiddenMutation,
    useManageContent_UpdateElementMutation,
    useManageContent_UpdateItemProgramPersonMutation,
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
    itemTitle,
    isOpen,
    onClose,
}: {
    itemId: string | null;
    itemTitle: string | null;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    return (
        <>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader pb={0} pr="3em">
                        <Text fontSize="lg" overflow="wrap">
                            Edit item: {itemTitle}
                        </Text>
                        <Code fontSize="xs">{itemId}</Code>
                    </DrawerHeader>
                    <DrawerCloseButton />

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
            <HStack flexWrap="wrap" justifyContent="flex-start" w="100%" gridRowGap={2}>
                <LinkButton
                    size="sm"
                    to={`/conference/${conference.slug}/item/${itemId}`}
                    isExternal
                    aria-label="View item"
                    title="View item"
                >
                    <FAIcon iconStyle="s" icon="link" mr={2} />
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
                                <FAIcon iconStyle="s" icon="link" mr={2} />
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
            <ApolloQueryWrapper
                getter={(result) => ({ rooms: [], ...result.content_Item_by_pk, elements: result.content_Element })}
                queryResult={itemResponse}
            >
                {(
                    result: ManageContent_ItemSecondaryFragment & {
                        elements: readonly ManageContent_ElementFragment[];
                    }
                ) => <Elements itemId={itemId} {...result} />}
            </ApolloQueryWrapper>
        </VStack>
    );
}

function Elements({
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
                // TODO: previousElementId
                // TODO: nextElementId
                <Element key={item.id} element={item} numElements={sortedElements.length} idx={idx} />
            ))}
        </Accordion>
    );
}

function ItemPeoplePanel({ itemId }: { itemId: string }): JSX.Element {
    const conference = useConference();
    const itemPeopleResponse = useManageContent_SelectItemPeopleQuery({
        variables: {
            itemId,
        },
    });
    const itemPeople = itemPeopleResponse.data?.content_ItemProgramPerson;
    const itemPeopleIds = useMemo(() => itemPeople?.map((x) => x.id), [itemPeople]);

    return (
        <VStack spacing={2} alignItems="flex-start" w="100%">
            <Text>Add or remove Program People associated with this item.</Text>
            <Text fontSize="sm" pb={2}>
                Please add people to the Program People table (optionally link them to their Registrant), then link them
                to this item.
            </Text>
            <ButtonGroup>
                {itemPeopleIds ? <AddItemPerson itemId={itemId} existingPeopleIds={itemPeopleIds} /> : undefined}
                <LinkButton size="sm" to={`/conference/${conference.slug}/manage/people`}>
                    <Tooltip label="Link opens in the same tab">
                        <>
                            <FAIcon iconStyle="s" icon="link" mr={2} />
                            <chakra.span>Manage Program People</chakra.span>
                        </>
                    </Tooltip>
                </LinkButton>
            </ButtonGroup>
            {itemPeopleResponse.loading && !itemPeople ? <Spinner label="Loading people" /> : undefined}
            {itemPeople ? <ItemPersonsList itemPeople={itemPeople} /> : undefined}
        </VStack>
    );
}

gql`
    query ManageContent_SelectProgramPeople($conferenceId: uuid!) {
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContent_ProgramPerson
        }
    }

    mutation ManageContent_InsertItemProgramPerson(
        $conferenceId: uuid!
        $personId: uuid!
        $roleName: String!
        $priority: Int!
        $itemId: uuid!
    ) {
        insert_content_ItemProgramPerson_one(
            object: {
                conferenceId: $conferenceId
                personId: $personId
                itemId: $itemId
                priority: $priority
                roleName: $roleName
            }
        ) {
            ...ManageContent_ItemProgramPerson
        }
    }

    mutation ManageContent_UpdateItemProgramPerson($itemPersonId: uuid!, $priority: Int!, $roleName: String!) {
        update_content_ItemProgramPerson_by_pk(
            pk_columns: { id: $itemPersonId }
            _set: { priority: $priority, roleName: $roleName }
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

function AddItemPersonBody({
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
    const [selectedRole, setSelectedRole] = useState<string>("AUTHOR");
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
                <VStack spacing={2}>
                    {peopleResponse.loading && !sortedPeople ? <Spinner label="Loading program people" /> : undefined}
                    {sortedPeople ? (
                        <FormControl>
                            <FormLabel>Person</FormLabel>
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
                        </FormControl>
                    ) : undefined}
                    <FormControl>
                        <FormLabel>Role</FormLabel>
                        <Select value={selectedRole ?? ""} onChange={(ev) => setSelectedRole(ev.target.value)}>
                            <option value="AUTHOR">Author</option>
                            <option value="CHAIR">Chair</option>
                            <option value="PRESENTER">Presenter</option>
                        </Select>
                    </FormControl>
                </VStack>
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
                                    roleName: selectedRole,
                                    priority: existingPeopleIds.length,
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

    const bgColor = useColorModeValue("green.50", "green.900");
    return (
        <Popover placement="bottom-start" isLazy isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
            <PopoverTrigger>
                <Button size="sm" colorScheme="green">
                    <FAIcon iconStyle="s" icon="plus-square" mr={2} />
                    <chakra.span>Link person</chakra.span>
                    <ChevronDownIcon ml={1} />
                </Button>
            </PopoverTrigger>
            <PopoverContent bgColor={bgColor}>
                <AddItemPersonBody onClose={onClose} {...props} />
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
    const [
        updateItemProgramPerson,
        updateItemProgramPersonResponse,
    ] = useManageContent_UpdateItemProgramPersonMutation();
    const [deleteItemPerson, deleteItemPersonResponse] = useManageContent_DeleteItemProgramPersonMutation();

    return sortedReps.length > 0 ? (
        <>
            <Text>People:</Text>
            <VStack w="100%" overflow="auto">
                {sortedReps.map((itemProgramPerson, idx) => (
                    <Flex key={itemProgramPerson.id} w="100%">
                        <ButtonGroup mr={2}>
                            <Button
                                size="xs"
                                isDisabled={idx === 0}
                                onClick={() => {
                                    const previousItemProgramPerson = sortedReps[idx - 1];

                                    updateItemProgramPerson({
                                        variables: {
                                            itemPersonId: itemProgramPerson.id,
                                            priority: idx - 1,
                                            roleName: itemProgramPerson.roleName,
                                        },
                                        update: (cache, { data: _data }) => {
                                            if (_data?.update_content_ItemProgramPerson_by_pk) {
                                                const data = _data.update_content_ItemProgramPerson_by_pk;
                                                cache.modify({
                                                    fields: {
                                                        content_ItemProgramPerson(
                                                            existingRefs: Reference[] = [],
                                                            { readField }
                                                        ) {
                                                            const newRef = cache.writeFragment({
                                                                data,
                                                                fragment: ManageContent_ItemProgramPersonFragmentDoc,
                                                                fragmentName: "ManageContent_ItemProgramPerson",
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

                                    updateItemProgramPerson({
                                        variables: {
                                            itemPersonId: previousItemProgramPerson.id,
                                            priority: idx,
                                            roleName: itemProgramPerson.roleName,
                                        },
                                        update: (cache, { data: _data }) => {
                                            if (_data?.update_content_ItemProgramPerson_by_pk) {
                                                const data = _data.update_content_ItemProgramPerson_by_pk;
                                                cache.modify({
                                                    fields: {
                                                        content_ItemProgramPerson(
                                                            existingRefs: Reference[] = [],
                                                            { readField }
                                                        ) {
                                                            const newRef = cache.writeFragment({
                                                                data,
                                                                fragment: ManageContent_ItemProgramPersonFragmentDoc,
                                                                fragmentName: "ManageContent_ItemProgramPerson",
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
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                            </Button>
                            <Button
                                size="xs"
                                isDisabled={idx === sortedReps.length - 1}
                                onClick={() => {
                                    const previousItemProgramPerson = sortedReps[idx + 1];

                                    updateItemProgramPerson({
                                        variables: {
                                            itemPersonId: itemProgramPerson.id,
                                            priority: idx + 1,
                                            roleName: itemProgramPerson.roleName,
                                        },
                                        update: (cache, { data: _data }) => {
                                            if (_data?.update_content_ItemProgramPerson_by_pk) {
                                                const data = _data.update_content_ItemProgramPerson_by_pk;
                                                cache.modify({
                                                    fields: {
                                                        content_ItemProgramPerson(
                                                            existingRefs: Reference[] = [],
                                                            { readField }
                                                        ) {
                                                            const newRef = cache.writeFragment({
                                                                data,
                                                                fragment: ManageContent_ItemProgramPersonFragmentDoc,
                                                                fragmentName: "ManageContent_ItemProgramPerson",
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

                                    updateItemProgramPerson({
                                        variables: {
                                            itemPersonId: previousItemProgramPerson.id,
                                            priority: idx,
                                            roleName: itemProgramPerson.roleName,
                                        },
                                        update: (cache, { data: _data }) => {
                                            if (_data?.update_content_ItemProgramPerson_by_pk) {
                                                const data = _data.update_content_ItemProgramPerson_by_pk;
                                                cache.modify({
                                                    fields: {
                                                        content_ItemProgramPerson(
                                                            existingRefs: Reference[] = [],
                                                            { readField }
                                                        ) {
                                                            const newRef = cache.writeFragment({
                                                                data,
                                                                fragment: ManageContent_ItemProgramPersonFragmentDoc,
                                                                fragmentName: "ManageContent_ItemProgramPerson",
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
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                            </Button>
                        </ButtonGroup>
                        <Tooltip
                            label={
                                itemProgramPerson.person.registrantId
                                    ? "Person is linked to registrant."
                                    : "Person is not linked to registrant."
                            }
                        >
                            <FAIcon
                                iconStyle="s"
                                icon={itemProgramPerson.person.registrantId ? "check-circle" : "exclamation-triangle"}
                                color={itemProgramPerson.person.registrantId ? "green.400" : "orange.400"}
                            />
                        </Tooltip>
                        <Flex flexDir={["column", "column", "row"]}>
                            <chakra.span ml={2}>{itemProgramPerson.person.name}</chakra.span>
                            <chakra.span ml={2}>
                                &lt;
                                {itemProgramPerson.person.email?.length ? itemProgramPerson.person.email : "No email"}
                                &gt;
                            </chakra.span>
                        </Flex>
                        <Select
                            ml="auto"
                            size="xs"
                            value={itemProgramPerson.roleName}
                            w="auto"
                            isDisabled={updateItemProgramPersonResponse.loading}
                            onChange={(ev) => {
                                updateItemProgramPerson({
                                    variables: {
                                        itemPersonId: itemProgramPerson.id,
                                        priority: itemProgramPerson.priority ?? idx,
                                        roleName: ev.target.value,
                                    },
                                    update: (cache, { data: _data }) => {
                                        if (_data?.update_content_ItemProgramPerson_by_pk) {
                                            const data = _data.update_content_ItemProgramPerson_by_pk;
                                            cache.modify({
                                                fields: {
                                                    content_ItemProgramPerson(
                                                        existingRefs: Reference[] = [],
                                                        { readField }
                                                    ) {
                                                        const newRef = cache.writeFragment({
                                                            data,
                                                            fragment: ManageContent_ItemProgramPersonFragmentDoc,
                                                            fragmentName: "ManageContent_ItemProgramPerson",
                                                        });
                                                        if (
                                                            existingRefs.some((ref) => readField("id", ref) === data.id)
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
                            minW={"5em"}
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
                                            itemPersonId: itemProgramPerson.id,
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

export function Element({
    element,
    idx,
    numElements,
}: {
    element: ManageContent_ElementFragment;
    idx: number;
    numElements: number;
    previousElementId?: string;
    nextElementId?: string;
}): JSX.Element {
    const [deleteElement] = useManageContent_DeleteElementMutation();
    const toast = useToast();

    return (
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
                                // TODO
                                ev.stopPropagation();
                            }}
                            aria-label="Move item up"
                        >
                            <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                        </Button>
                    </Tooltip>
                    <Tooltip label="Move element down">
                        <Button
                            size="xs"
                            isDisabled={idx === numElements - 1}
                            onClick={(ev) => {
                                // TODO
                                ev.stopPropagation();
                            }}
                            aria-label="Move item down"
                        >
                            <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                        </Button>
                    </Tooltip>
                </ButtonGroup>
                <Box textAlign="left">{element.name}</Box>
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
                    />
                </Tooltip>
                <Tooltip label="Delete element">
                    <IconButton
                        colorScheme="red"
                        size="xs"
                        aria-label="Delete element"
                        icon={<FAIcon iconStyle="s" icon="trash-alt" />}
                        onClick={async (ev) => {
                            ev.stopPropagation();
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
