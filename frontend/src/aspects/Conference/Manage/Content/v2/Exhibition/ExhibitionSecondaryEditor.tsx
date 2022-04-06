import { ChevronDownIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Button,
    ButtonGroup,
    chakra,
    Code,
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
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Select,
    Spinner,
    Text,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import type {
    ManageContent_ItemExhibitionFragment,
    ManageContent_ItemFragment,
} from "../../../../../../generated/graphql";
import {
    useManageContent_DeleteItemExhibitionMutation,
    useManageContent_InsertItemExhibitionMutation,
    useManageContent_SelectAllItemsQuery,
    useManageContent_SelectItemExhibitionsQuery,
    useManageContent_UpdateItemExhibitionMutation,
} from "../../../../../../generated/graphql";
import FAIcon from "../../../../../Chakra/FAIcon";
import { LinkButton } from "../../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../../GQL/AuthParameters";
import { makeContext } from "../../../../../GQL/make-context";
import { maybeCompare } from "../../../../../Utils/maybeCompare";
import { useConference } from "../../../../useConference";

gql`
    query ManageContent_SelectItemExhibitions($exhibitionId: uuid!) {
        content_ItemExhibition(where: { exhibitionId: { _eq: $exhibitionId } }) {
            ...ManageContent_ItemExhibition
        }
    }

    mutation ManageContent_InsertItemExhibition($exhibitionId: uuid!, $itemId: uuid!, $priority: Int!) {
        insert_content_ItemExhibition_one(
            object: { exhibitionId: $exhibitionId, itemId: $itemId, priority: $priority }
        ) {
            ...ManageContent_ItemExhibition
        }
    }

    mutation ManageContent_UpdateItemExhibition($itemExhibitionId: uuid!, $priority: Int!) {
        update_content_ItemExhibition_by_pk(pk_columns: { id: $itemExhibitionId }, _set: { priority: $priority }) {
            ...ManageContent_ItemExhibition
        }
    }

    mutation ManageContent_DeleteItemExhibition($itemExhibitionId: uuid!) {
        delete_content_ItemExhibition_by_pk(id: $itemExhibitionId) {
            id
        }
    }
`;

export function SecondaryEditor({
    exhibitionId,
    exhibitionName,
    isOpen,
    onClose,
    descriptiveItemId,
    setDescriptiveItemId,
}: {
    exhibitionId: string | null;
    exhibitionName: string | null;
    isOpen: boolean;
    onClose: () => void;
    descriptiveItemId: string | null;
    setDescriptiveItemId: (id: string | null) => void;
}): JSX.Element {
    return (
        <>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader pb={0} pr="3em">
                        <Text fontSize="lg" overflow="wrap">
                            Edit exhibition: {exhibitionName}
                        </Text>
                        <Code fontSize="xs">{exhibitionId}</Code>
                    </DrawerHeader>

                    <DrawerBody>
                        {exhibitionId && (
                            <SecondaryEditorInner
                                exhibitionId={exhibitionId}
                                descriptiveItemId={descriptiveItemId}
                                setDescriptiveItemId={setDescriptiveItemId}
                            />
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}

function SecondaryEditorInner({
    exhibitionId,
    descriptiveItemId,
    setDescriptiveItemId,
}: {
    exhibitionId: string;
    descriptiveItemId: string | null;
    setDescriptiveItemId: (id: string | null) => void;
}): JSX.Element {
    const conference = useConference();
    const { conferencePath, subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext(
                {
                    [AuthHeader.Role]: subconferenceId
                        ? HasuraRoleName.SubconferenceOrganizer
                        : HasuraRoleName.ConferenceOrganizer,
                },
                ["content_ItemExhibition"]
            ),
        [subconferenceId]
    );
    const [itemExhibitionsResponse] = useManageContent_SelectItemExhibitionsQuery({
        variables: {
            exhibitionId,
        },
        context,
    });
    const itemExhibitions = itemExhibitionsResponse.data?.content_ItemExhibition;
    const itemExhibitionsIds = useMemo(() => itemExhibitions?.map((x) => x.item.id), [itemExhibitions]);

    const [itemsResponse] = useManageContent_SelectAllItemsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });
    const sortedItems = useMemo(
        () =>
            itemExhibitionsIds &&
            itemsResponse.data?.content_Item &&
            [...itemsResponse.data.content_Item].sort((x, y) => x.title.localeCompare(y.title)),
        [itemExhibitionsIds, itemsResponse.data?.content_Item]
    );
    const filteredItems = useMemo(
        () =>
            sortedItems && itemExhibitionsIds
                ? sortedItems.filter((item) => !itemExhibitionsIds.includes(item.id))
                : undefined,
        [itemExhibitionsIds, sortedItems]
    );

    return (
        <VStack w="100%" alignItems="flex-start">
            <HStack flexWrap="wrap" justifyContent="flex-start" w="100%" gridRowGap={2}>
                <LinkButton
                    size="sm"
                    to={`${conferencePath}/exhibition/${exhibitionId}`}
                    isExternal
                    aria-label="View item"
                    title="View item"
                >
                    View exhibition&nbsp;
                    <ExternalLinkIcon />
                </LinkButton>
            </HStack>
            {itemsResponse.fetching && !sortedItems ? <Spinner label="Loading items" /> : undefined}
            {sortedItems ? (
                <FormControl>
                    <FormLabel>Descriptive Item</FormLabel>
                    <Select
                        value={descriptiveItemId ?? ""}
                        onChange={(ev) => setDescriptiveItemId(ev.target.value === "" ? null : ev.target.value)}
                    >
                        <option value="">&lt;No item&gt;</option>
                        {sortedItems.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.title}
                            </option>
                        ))}
                    </Select>
                    <FormHelperText>
                        Select a content item whose abstract or text element describes this exhibition.
                    </FormHelperText>
                </FormControl>
            ) : undefined}
            <VStack spacing={2} alignItems="flex-start" w="100%">
                <Text>Add or remove items in this exhibition.</Text>
                {itemExhibitionsIds ? (
                    <AddItemExhibition
                        exhibitionId={exhibitionId}
                        existingItemIds={itemExhibitionsIds}
                        sortedItems={filteredItems}
                    />
                ) : undefined}
                {itemExhibitionsResponse.fetching && !itemExhibitions ? <Spinner label="Loading people" /> : undefined}
                {itemExhibitions ? <ItemExhibitionsList exhibitionItems={itemExhibitions} /> : undefined}
            </VStack>
        </VStack>
    );
}

function AddItemExhibitionBody({
    exhibitionId,
    existingItemIds,
    onClose,
    sortedItems,
}: {
    exhibitionId: string;
    existingItemIds: string[];
    onClose: () => void;
    sortedItems: undefined | readonly ManageContent_ItemFragment[];
}): JSX.Element {
    const { subconferenceId } = useAuthParameters();

    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [insertItemExhibitionResponse, insertItemExhibition] = useManageContent_InsertItemExhibitionMutation();

    const toast = useToast();
    return (
        <>
            <PopoverHeader>Link item</PopoverHeader>
            <PopoverBody>
                {sortedItems ? (
                    <FormControl>
                        <FormLabel>Item</FormLabel>
                        <Select
                            value={selectedItemId ?? ""}
                            onChange={(ev) => setSelectedItemId(ev.target.value === "" ? null : ev.target.value)}
                        >
                            <option value="">Select an item</option>
                            {sortedItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                ) : undefined}
            </PopoverBody>
            <PopoverFooter>
                <Button
                    colorScheme="purple"
                    isDisabled={!selectedItemId}
                    isLoading={insertItemExhibitionResponse.fetching}
                    onClick={async () => {
                        try {
                            await insertItemExhibition(
                                {
                                    exhibitionId,
                                    itemId: selectedItemId,
                                    priority: existingItemIds.length,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            [AuthHeader.Role]: subconferenceId
                                                ? HasuraRoleName.SubconferenceOrganizer
                                                : HasuraRoleName.ConferenceOrganizer,
                                        },
                                    },
                                }
                            );

                            onClose();
                        } catch (e: any) {
                            toast({
                                title: "Error linking exhibition",
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

function AddItemExhibition(props: {
    exhibitionId: string;
    existingItemIds: string[];
    sortedItems: undefined | readonly ManageContent_ItemFragment[];
}): JSX.Element {
    const { onOpen, onClose, isOpen } = useDisclosure();

    const bgColor = useColorModeValue("purple.50", "purple.900");

    return (
        <Popover placement="bottom-start" isLazy isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
            <PopoverTrigger>
                <Button size="sm" colorScheme="purple">
                    <FAIcon iconStyle="s" icon="plus-square" mr={2} />
                    <chakra.span>Link item</chakra.span>
                    <ChevronDownIcon ml={1} />
                </Button>
            </PopoverTrigger>
            <PopoverContent bgColor={bgColor}>
                <AddItemExhibitionBody onClose={onClose} {...props} />
            </PopoverContent>
        </Popover>
    );
}

function ItemExhibitionsList({
    exhibitionItems,
}: {
    exhibitionItems: readonly ManageContent_ItemExhibitionFragment[];
}): JSX.Element {
    const { subconferenceId } = useAuthParameters();

    const sortedItems = useMemo(
        () =>
            R.sortWith(
                [
                    (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
                    (x, y) => x.item.title.localeCompare(y.item.title),
                ],
                exhibitionItems
            ),
        [exhibitionItems]
    );
    const toast = useToast();
    const [updateItemExhibitionResponse, updateItemExhibition] = useManageContent_UpdateItemExhibitionMutation();
    const [deleteItemExhibitionResponse, deleteItemExhibition] = useManageContent_DeleteItemExhibitionMutation();

    return sortedItems.length > 0 ? (
        <>
            <Text>Items:</Text>
            <VStack w="100%" overflow="auto">
                {sortedItems.map((itemExhibition, idx) => (
                    <Flex key={itemExhibition.id} w="100%">
                        <ButtonGroup mr={2}>
                            <Button
                                size="xs"
                                isDisabled={idx === 0}
                                isLoading={updateItemExhibitionResponse.fetching}
                                onClick={() => {
                                    const previousItemExhibition = sortedItems[idx - 1];

                                    updateItemExhibition(
                                        {
                                            itemExhibitionId: itemExhibition.id,
                                            priority: idx - 1,
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );

                                    updateItemExhibition(
                                        {
                                            itemExhibitionId: previousItemExhibition.id,
                                            priority: idx,
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );
                                }}
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                            </Button>
                            <Button
                                size="xs"
                                isDisabled={idx === sortedItems.length - 1}
                                isLoading={updateItemExhibitionResponse.fetching}
                                onClick={() => {
                                    const nextItemExhibition = sortedItems[idx + 1];

                                    updateItemExhibition(
                                        {
                                            itemExhibitionId: itemExhibition.id,
                                            priority: idx + 1,
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );

                                    updateItemExhibition(
                                        {
                                            itemExhibitionId: nextItemExhibition.id,
                                            priority: idx,
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );
                                }}
                            >
                                <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                            </Button>
                        </ButtonGroup>
                        <chakra.span ml={2}>{itemExhibition.item.title}</chakra.span>
                        <Button
                            ml="auto"
                            aria-label="Delete"
                            colorScheme="red"
                            size="xs"
                            isDisabled={deleteItemExhibitionResponse.fetching}
                            onClick={async () => {
                                try {
                                    deleteItemExhibition(
                                        {
                                            itemExhibitionId: itemExhibition.id,
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );
                                } catch (e: any) {
                                    toast({
                                        title: "Error unlinking item",
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
        <Text>No items linked to this exhibition.</Text>
    );
}
