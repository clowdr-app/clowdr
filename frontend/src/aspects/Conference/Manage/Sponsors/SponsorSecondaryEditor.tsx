import { gql, Reference } from "@apollo/client";
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
    Spinner,
    Switch,
    Text,
    useToast,
} from "@chakra-ui/react";
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
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
    return (
        <Accordion allowToggle allowMultiple>
            {R.sortBy((x) => x.name, contentItems).map((item) => (
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
            {updateContentItemResponse.loading ? <Spinner label="Saving changes" /> : undefined}
            {updateContentItemResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateContentItemResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            {setIsHiddenResponse.loading ? <Spinner label="Saving changes" /> : undefined}
            {setIsHiddenResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{setIsHiddenResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            <HStack pb={4} justifyContent="flex-end">
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
            {editor}
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
