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
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import {
    SponsorSecondaryEditor_ContentItemFragment,
    SponsorSecondaryEditor_ContentItemFragmentDoc,
    useSponsorContentItemInner_UpdateContentItemMutation,
    useSponsorContentItem_DeleteContentItemMutation,
    useSponsorContentItem_SetContentItemIsHiddenMutation,
    useSponsorSecondaryEditor_GetSponsorContentItemsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import FAIcon from "../../../Icons/FAIcon";
import { ItemBaseTemplates } from "../Content/Templates";
import type { ContentItemDescriptor } from "../Content/Types";
import { AddSponsorContentMenu } from "./AddSponsorContentMenu";
import { LayoutEditor } from "./LayoutEditor";
import type { SponsorInfoFragment } from "./Types";

gql`
    query SponsorSecondaryEditor_GetSponsorContentItems($contentGroupId: uuid!) {
        ContentItem(where: { contentGroupId: { _eq: $contentGroupId } }) {
            ...SponsorSecondaryEditor_ContentItem
        }
    }

    fragment SponsorSecondaryEditor_ContentItem on ContentItem {
        id
        name
        contentTypeName
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
    const contentItemsResult = useSponsorSecondaryEditor_GetSponsorContentItemsQuery({
        variables: {
            contentGroupId: index !== null && index < sponsors.length ? sponsors[index].id : "",
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
                                contentGroupId={sponsors[index].id}
                                roomId={sponsors[index].room?.id ?? null}
                                refetch={async () => {
                                    await contentItemsResult.refetch();
                                }}
                            />
                        ) : undefined}
                        <ApolloQueryWrapper getter={(result) => result.ContentItem} queryResult={contentItemsResult}>
                            {(contentItems: readonly SponsorSecondaryEditor_ContentItemFragment[]) => (
                                <SponsorContentItems contentItems={contentItems} />
                            )}
                        </ApolloQueryWrapper>
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}

export function SponsorContentItems({
    contentItems,
}: {
    contentItems: readonly SponsorSecondaryEditor_ContentItemFragment[];
}): JSX.Element {
    const sortedContentItems = useMemo(() => {
        const sortedContentItems = [...contentItems];

        sortedContentItems.sort((a, b) => {
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

        return sortedContentItems;
    }, [contentItems]);

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
            {sortedContentItems.map((item) => (
                <SponsorContentItem key={item.id} contentItem={item} />
            ))}
        </Accordion>
    );
}

gql`
    mutation SponsorContentItem_DeleteContentItem($contentItemId: uuid!) {
        delete_ContentItem_by_pk(id: $contentItemId) {
            id
        }
    }

    mutation SponsorContentItem_SetContentItemIsHidden($contentItemId: uuid!, $isHidden: Boolean!) {
        update_ContentItem_by_pk(pk_columns: { id: $contentItemId }, _set: { isHidden: $isHidden }) {
            id
        }
    }

    mutation SponsorContentItemInner_UpdateContentItem($contentItemId: uuid!, $contentItem: ContentItem_set_input!) {
        update_ContentItem_by_pk(pk_columns: { id: $contentItemId }, _set: $contentItem) {
            id
        }
    }
`;

export function SponsorContentItem({
    contentItem,
}: {
    contentItem: SponsorSecondaryEditor_ContentItemFragment;
}): JSX.Element {
    return (
        <AccordionItem>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    {contentItem.name}
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
                <SponsorContentItemInner contentItem={contentItem} />
            </AccordionPanel>
        </AccordionItem>
    );
}

function SponsorContentItemInner({
    contentItem,
}: {
    contentItem: SponsorSecondaryEditor_ContentItemFragment;
}): JSX.Element {
    const [deleteContentItem] = useSponsorContentItem_DeleteContentItemMutation();
    const [setIsHidden, setIsHiddenResponse] = useSponsorContentItem_SetContentItemIsHiddenMutation();
    const [updateContentItem, updateContentItemResponse] = useSponsorContentItemInner_UpdateContentItemMutation();
    const toast = useToast();

    const itemType = contentItem.contentTypeName;
    const baseType = ItemBaseTypes[itemType];
    const itemTemplate = useMemo(() => ItemBaseTemplates[baseType], [baseType]);
    const descriptor = useMemo<ContentItemDescriptor>(
        () => ({
            ...contentItem,
            typeName: contentItem.contentTypeName,
            layoutData: contentItem.layoutData ?? null,
        }),
        [contentItem]
    );

    const editor = useMemo(() => {
        return itemTemplate.supported ? (
            <itemTemplate.renderEditor
                data={{ type: "item-only", item: descriptor }}
                update={(updated) => {
                    if (updated.type === "item-only") {
                        const updatedItem = {
                            data: updated.item.data,
                            layoutData: updated.item.layoutData,
                        };
                        updateContentItem({
                            variables: {
                                contentItemId: updated.item.id,
                                contentItem: updatedItem,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_ContentItem_by_pk) {
                                    const data = _data.update_ContentItem_by_pk;
                                    cache.modify({
                                        fields: {
                                            ContentItem(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data: updated.item,
                                                    fragment: SponsorSecondaryEditor_ContentItemFragmentDoc,
                                                    fragmentName: "SponsorSecondaryEditor_ContentItem",
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
    }, [descriptor, itemTemplate, itemType, updateContentItem]);

    return (
        <>
            {updateContentItemResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateContentItemResponse.error.message}</AlertDescription>
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
                        isChecked={contentItem.isHidden}
                        onChange={async (event) => {
                            const isHidden = event.target.checked;
                            setIsHidden({
                                variables: {
                                    contentItemId: contentItem.id,
                                    isHidden,
                                },
                                update: (cache, { data: _data }) => {
                                    if (_data?.update_ContentItem_by_pk) {
                                        const data = _data.update_ContentItem_by_pk;
                                        cache.modify({
                                            fields: {
                                                ContentItem(existingRefs: Reference[] = [], { readField }) {
                                                    const newRef = cache.writeFragment({
                                                        data: {
                                                            __typename: "ContentItem",
                                                            id: data.id,
                                                            isHidden,
                                                        },
                                                        fragment: SponsorSecondaryEditor_ContentItemFragmentDoc,
                                                        fragmentName: "SponsorSecondaryEditor_ContentItem",
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
                        Enable to hide this content from attendees.
                    </FormHelperText>
                </FormControl>
                {updateContentItemResponse.loading ? <Spinner label="Saving changes" /> : undefined}
                {setIsHiddenResponse.loading ? <Spinner label="Saving changes" /> : undefined}
                <Box>
                    <IconButton
                        colorScheme="red"
                        size="sm"
                        aria-label="Delete content"
                        icon={<FAIcon iconStyle="s" icon="trash-alt" />}
                        onClick={async () => {
                            try {
                                await deleteContentItem({
                                    variables: {
                                        contentItemId: contentItem.id,
                                    },
                                    update: (cache, { data: _data }) => {
                                        if (_data?.delete_ContentItem_by_pk) {
                                            const data = _data.delete_ContentItem_by_pk;
                                            cache.modify({
                                                fields: {
                                                    ContentItem(existingRefs: Reference[] = [], { readField }) {
                                                        cache.evict({
                                                            id: data.id,
                                                            fieldName: "SponsorSecondaryEditor_ContentItemFragment",
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
                contentItemType={contentItem.contentTypeName}
                update={(layoutData) => {
                    const newState: ContentItemDescriptor = {
                        ...descriptor,
                        layoutData,
                    };
                    updateContentItem({
                        variables: {
                            contentItemId: contentItem.id,
                            contentItem: {
                                data: newState.data,
                                layoutData: newState.layoutData,
                            },
                        },
                        update: (cache, { data: _data }) => {
                            if (_data?.update_ContentItem_by_pk) {
                                const data = _data.update_ContentItem_by_pk;
                                cache.modify({
                                    fields: {
                                        ContentItem(existingRefs: Reference[] = [], { readField }) {
                                            const newRef = cache.writeFragment({
                                                data: newState,
                                                fragment: SponsorSecondaryEditor_ContentItemFragmentDoc,
                                                fragmentName: "SponsorSecondaryEditor_ContentItem",
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
