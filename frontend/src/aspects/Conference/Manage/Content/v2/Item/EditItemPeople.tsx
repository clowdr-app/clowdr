import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    ButtonGroup,
    chakra,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
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
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import type { ManageContent_ItemProgramPersonFragment } from "../../../../../../generated/graphql";
import {
    useManageContent_DeleteItemProgramPersonMutation,
    useManageContent_InsertItemProgramPersonMutation,
    useManageContent_SelectItemPeopleQuery,
    useManageContent_SelectProgramPeopleQuery,
    useManageContent_UpdateItemProgramPersonMutation,
} from "../../../../../../generated/graphql";
import { LinkButton } from "../../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../../GQL/AuthParameters";
import { useShieldedHeaders } from "../../../../../GQL/useShieldedHeaders";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { maybeCompare } from "../../../../../Utils/maybeSort";
import { useConference } from "../../../../useConference";

export function EditItemPeoplePanel({ itemId }: { itemId: string }): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const context = useShieldedHeaders(
        useMemo(
            () => ({
                "X-Auth-Role": "organizer",
            }),
            []
        )
    );
    const [itemPeopleResponse] = useManageContent_SelectItemPeopleQuery({
        variables: {
            itemId,
        },
        context,
        requestPolicy: "cache-and-network",
    });
    const itemPeople = itemPeopleResponse.data?.content_ItemProgramPerson;
    const itemPeopleIds = useMemo(() => itemPeople?.map((x) => x.id), [itemPeople]);

    return (
        <VStack spacing={2} alignItems="flex-start" w="100%">
            <Text>Add or remove Program People associated with this item.</Text>
            <Text fontSize="sm">
                Please add people to the Program People table (optionally link them to their Registrant), then link them
                to this item.
            </Text>
            <Text fontSize="sm" pb={2}>
                People are also treated as uploaders of all elements within the item. All roles have access to upload
                content.
            </Text>
            <ButtonGroup>
                {itemPeopleIds ? <AddItemPerson itemId={itemId} existingPeopleIds={itemPeopleIds} /> : undefined}
                <LinkButton size="sm" to={`${conferencePath}/manage/people`}>
                    <Tooltip label="Link opens in the same tab">
                        <>
                            <FAIcon iconStyle="s" icon="link" mr={2} />
                            <chakra.span>Manage Program People</chakra.span>
                        </>
                    </Tooltip>
                </LinkButton>
            </ButtonGroup>
            {itemPeopleResponse.fetching && !itemPeople ? <Spinner label="Loading people" /> : undefined}
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
        $personId: uuid!
        $roleName: String!
        $priority: Int!
        $itemId: uuid!
    ) {
        insert_content_ItemProgramPerson_one(
            object: { personId: $personId, itemId: $itemId, priority: $priority, roleName: $roleName }
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
    const context = useShieldedHeaders(
        useMemo(
            () => ({
                "X-Auth-Role": "organizer",
            }),
            []
        )
    );
    const [peopleResponse] = useManageContent_SelectProgramPeopleQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>("AUTHOR");
    const [insertItemPersonResponse, insertItemPerson] = useManageContent_InsertItemProgramPersonMutation();

    const sortedPeople = useMemo(
        () =>
            peopleResponse.data?.collection_ProgramPerson
                .filter((person) => !existingPeopleIds.includes(person.id))
                .sort((x, y) => maybeCompare(x.name, y.name, (a, b) => a.localeCompare(b))),
        [existingPeopleIds, peopleResponse.data?.collection_ProgramPerson]
    );

    const toast = useToast();
    return (
        <>
            <PopoverHeader>Link program person</PopoverHeader>
            <PopoverBody>
                <VStack spacing={2}>
                    {peopleResponse.fetching && !sortedPeople ? <Spinner label="Loading program people" /> : undefined}
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
                            <option value="SESSION ORGANIZER">Session Organizer</option>
                            <option value="DISCUSSANT">Discussant</option>
                            <option value="REVIEWER">Reviewer</option>
                        </Select>
                    </FormControl>
                </VStack>
            </PopoverBody>
            <PopoverFooter textAlign="right">
                <ButtonGroup>
                    <Button size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="purple"
                        isDisabled={!selectedPersonId}
                        isLoading={insertItemPersonResponse.fetching}
                        onClick={async () => {
                            try {
                                await insertItemPerson(
                                    {
                                        itemId,
                                        personId: selectedPersonId,
                                        roleName: selectedRole,
                                        priority: existingPeopleIds.length,
                                    },
                                    {
                                        fetchOptions: {
                                            headers: {
                                                "X-Auth-Role": "organizer",
                                            },
                                        },
                                    }
                                );

                                onClose();
                            } catch (e: any) {
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
                </ButtonGroup>
            </PopoverFooter>
        </>
    );
}

function AddItemPerson(props: { itemId: string; existingPeopleIds: string[] }): JSX.Element {
    const { onOpen, onClose, isOpen } = useDisclosure();

    const bgColor = useColorModeValue("purple.50", "purple.900");
    return (
        <Popover placement="bottom-start" isLazy isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
            <PopoverTrigger>
                <Button size="sm" colorScheme="purple">
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
                    (x, y) =>
                        x.roleName.toUpperCase() === "PRESENTER"
                            ? y.roleName.toUpperCase() === "PRESENTER"
                                ? 0
                                : -1
                            : x.roleName.toUpperCase() === "AUTHOR"
                            ? y.roleName.toUpperCase() === "PRESENTER"
                                ? 1
                                : y.roleName.toUpperCase() === "AUTHOR"
                                ? 0
                                : -1
                            : x.roleName.toUpperCase() === "CHAIR"
                            ? y.roleName.toUpperCase() === "PRESENTER" || y.roleName.toUpperCase() === "AUTHOR"
                                ? 1
                                : y.roleName.toUpperCase() === "CHAIR"
                                ? 0
                                : -1
                            : y.roleName.toUpperCase() === "AUTHOR" ||
                              y.roleName.toUpperCase() === "PRESENTER" ||
                              y.roleName.toUpperCase() === "CHAIR"
                            ? 1
                            : x.roleName.toUpperCase().localeCompare(y.roleName.toUpperCase()),
                    (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
                    (x, y) => maybeCompare(x.person?.name, y.person?.name, (a, b) => a.localeCompare(b)),
                ],
                itemPeople
            ),
        [itemPeople]
    );
    const toast = useToast();
    const [updateItemProgramPersonResponse, updateItemProgramPerson] =
        useManageContent_UpdateItemProgramPersonMutation();
    const [deleteItemPersonResponse, deleteItemPerson] = useManageContent_DeleteItemProgramPersonMutation();

    return sortedReps.length > 0 ? (
        <>
            <Heading as="h4" fontSize="sm" textAlign="left" py={2}>
                People
            </Heading>
            <Box w="100%" overflow="auto">
                <VStack minW="max-content" alignItems="flex-start">
                    {sortedReps.map((itemProgramPerson, idx) => (
                        <>
                            <Flex key={itemProgramPerson.id} w="100%">
                                <ButtonGroup mr={2}>
                                    {idx !== 0 && sortedReps[idx - 1].roleName === sortedReps[idx].roleName ? (
                                        <Button
                                            size="xs"
                                            onClick={() => {
                                                const previousItemProgramPerson = sortedReps[idx - 1];

                                                updateItemProgramPerson(
                                                    {
                                                        itemPersonId: itemProgramPerson.id,
                                                        priority: idx - 1,
                                                        roleName: itemProgramPerson.roleName,
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                "X-Auth-Role": "organizer",
                                                            },
                                                        },
                                                    }
                                                );

                                                updateItemProgramPerson(
                                                    {
                                                        itemPersonId: previousItemProgramPerson.id,
                                                        priority: idx,
                                                        roleName: previousItemProgramPerson.roleName,
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                "X-Auth-Role": "organizer",
                                                            },
                                                        },
                                                    }
                                                );
                                            }}
                                        >
                                            <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                                        </Button>
                                    ) : (
                                        <Box w="1.7em"></Box>
                                    )}
                                    {idx !== sortedReps.length - 1 &&
                                    sortedReps[idx + 1].roleName === sortedReps[idx].roleName ? (
                                        <Button
                                            size="xs"
                                            onClick={() => {
                                                const previousItemProgramPerson = sortedReps[idx + 1];

                                                updateItemProgramPerson(
                                                    {
                                                        itemPersonId: itemProgramPerson.id,
                                                        priority: idx + 1,
                                                        roleName: itemProgramPerson.roleName,
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                "X-Auth-Role": "organizer",
                                                            },
                                                        },
                                                    }
                                                );

                                                updateItemProgramPerson(
                                                    {
                                                        itemPersonId: previousItemProgramPerson.id,
                                                        priority: idx,
                                                        roleName: previousItemProgramPerson.roleName,
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                "X-Auth-Role": "organizer",
                                                            },
                                                        },
                                                    }
                                                );
                                            }}
                                        >
                                            <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                                        </Button>
                                    ) : (
                                        <Box w="1.7em"></Box>
                                    )}
                                </ButtonGroup>
                                <Tooltip
                                    label={
                                        itemProgramPerson.person?.registrantId
                                            ? "Person is linked to registrant."
                                            : "Person is not linked to registrant."
                                    }
                                >
                                    <FAIcon
                                        iconStyle="s"
                                        icon={itemProgramPerson.person?.registrantId ? "link" : "unlink"}
                                        color={itemProgramPerson.person?.registrantId ? "purple.400" : "yellow.400"}
                                    />
                                </Tooltip>
                                <Flex
                                    flexDir={["column", "column", "row"]}
                                    flexWrap="wrap"
                                    justifyContent="flex-start"
                                    alignItems="flex-start"
                                >
                                    <chakra.span mx={2}>{itemProgramPerson.person?.name}</chakra.span>
                                    <chakra.span ml={["0", "0", "auto"]} mr={2}>
                                        &lt;
                                        {itemProgramPerson.person?.email?.length
                                            ? itemProgramPerson.person.email
                                            : "No email"}
                                        &gt;
                                    </chakra.span>
                                </Flex>
                                <Select
                                    ml="auto"
                                    size="xs"
                                    value={itemProgramPerson.roleName}
                                    w="auto"
                                    isDisabled={updateItemProgramPersonResponse.fetching}
                                    onChange={(ev) => {
                                        updateItemProgramPerson(
                                            {
                                                itemPersonId: itemProgramPerson.id,
                                                priority: itemProgramPerson.priority ?? idx,
                                                roleName: ev.target.value,
                                            },
                                            {
                                                fetchOptions: {
                                                    headers: {
                                                        "X-Auth-Role": "organizer",
                                                    },
                                                },
                                            }
                                        );
                                    }}
                                    minW={"5em"}
                                >
                                    <option value="AUTHOR">Author</option>
                                    <option value="CHAIR">Chair</option>
                                    <option value="PRESENTER">Presenter</option>
                                    <option value="SESSION ORGANIZER">Session Organizer</option>
                                    <option value="DISCUSSANT">Discussant</option>
                                    <option value="REVIEWER">Reviewer</option>
                                </Select>
                                <Button
                                    ml={2}
                                    aria-label="Delete"
                                    colorScheme="red"
                                    size="xs"
                                    isDisabled={deleteItemPersonResponse.fetching}
                                    onClick={async () => {
                                        try {
                                            deleteItemPerson(
                                                {
                                                    itemPersonId: itemProgramPerson.id,
                                                },
                                                {
                                                    fetchOptions: {
                                                        headers: {
                                                            "X-Auth-Role": "organizer",
                                                        },
                                                    },
                                                }
                                            );
                                        } catch (e: any) {
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

                            {idx !== sortedReps.length - 1 &&
                            sortedReps[idx + 1].roleName !== sortedReps[idx].roleName ? (
                                <Divider />
                            ) : undefined}
                        </>
                    ))}
                </VStack>
            </Box>
        </>
    ) : (
        <Text>No people linked to this item.</Text>
    );
}
