import { gql, Reference } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    ButtonGroup,
    chakra,
    Flex,
    FormControl,
    FormLabel,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Select,
    Spinner,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import {
    ManageContent_ItemProgramPersonFragment,
    ManageContent_ItemProgramPersonFragmentDoc,
    useManageContent_DeleteItemProgramPersonMutation,
    useManageContent_InsertItemProgramPersonMutation,
    useManageContent_SelectItemPeopleQuery,
    useManageContent_SelectProgramPeopleQuery,
    useManageContent_UpdateItemProgramPersonMutation,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { FAIcon } from "../../../../Icons/FAIcon";
import { maybeCompare } from "../../../../Utils/maybeSort";
import { useConference } from "../../../useConference";

export function ItemPeoplePanel({ itemId }: { itemId: string }): JSX.Element {
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
