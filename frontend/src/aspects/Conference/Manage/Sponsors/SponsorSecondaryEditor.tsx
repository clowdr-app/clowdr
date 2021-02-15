import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
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
    Switch,
    Text,
    useToast,
} from "@chakra-ui/react";
import { ItemBaseTypes } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import {
    SponsorContentItem_ContentItemFragment,
    SponsorSecondaryEditor_ContentItemFragment,
    useSponsorContentItemInner_UpdateContentItemMutation,
    useSponsorContentItem_DeleteContentItemMutation,
    useSponsorContentItem_GetSponsorContentItemQuery,
    useSponsorContentItem_SetContentItemIsHiddenMutation,
    useSponsorSecondaryEditor_GetSponsorContentItemsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import FAIcon from "../../../Icons/FAIcon";
import { ItemBaseTemplates } from "../Content/Templates";
import type { ContentItemDescriptor } from "../Content/Types";
import { AddSponsorContentMenu } from "./AddSponsorContentMenu";
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
            contentGroupId: index && sponsors.length > index ? sponsors[index].id : "",
        },
        skip: !index || sponsors.length <= index,
    });

    return (
        <Drawer isOpen={isSecondaryPanelOpen} onClose={onSecondaryPanelClose} size="lg">
            <DrawerOverlay>
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Edit</DrawerHeader>
                    <DrawerBody>
                        <AddSponsorContentMenu />
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
    query SponsorContentItem_GetSponsorContentItem($contentItemId: uuid!) {
        ContentItem_by_pk(id: $contentItemId) {
            ...SponsorContentItem_ContentItem
        }
    }

    fragment SponsorContentItem_ContentItem on ContentItem {
        id
        name
        contentTypeName
        data
        layoutData
        isHidden
        updatedAt
    }

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
    const contentItemResult = useSponsorContentItem_GetSponsorContentItemQuery({
        variables: {
            contentItemId: contentItem.id,
        },
    });

    return (
        <AccordionItem>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                    {contentItem.name}
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
                <ApolloQueryWrapper getter={(result) => result.ContentItem_by_pk} queryResult={contentItemResult}>
                    {(item: SponsorContentItem_ContentItemFragment) => (
                        <SponsorContentItemInner
                            contentItem={item}
                            refetch={async () => {
                                await contentItemResult.refetch();
                            }}
                        />
                    )}
                </ApolloQueryWrapper>
            </AccordionPanel>
        </AccordionItem>
    );
}

function SponsorContentItemInner({
    contentItem,
    refetch,
}: {
    contentItem: SponsorContentItem_ContentItemFragment;
    refetch: () => Promise<void>;
}): JSX.Element {
    const [deleteContentItem] = useSponsorContentItem_DeleteContentItemMutation();
    const [setIsHidden] = useSponsorContentItem_SetContentItemIsHiddenMutation();
    const [updateContentItem] = useSponsorContentItemInner_UpdateContentItemMutation();
    const toast = useToast();

    const [updatedState, setUpdatedState] = useState<ContentItemDescriptor | null>(null);

    const itemType = contentItem.contentTypeName;
    const baseType = ItemBaseTypes[itemType];
    const itemTemplate = useMemo(() => ItemBaseTemplates[baseType], [baseType]);
    const descriptor = useMemo<ContentItemDescriptor>(
        () =>
            updatedState ?? {
                ...contentItem,
                typeName: contentItem.contentTypeName,
                layoutData: contentItem.layoutData ?? null,
            },
        [contentItem, updatedState]
    );

    const editor = useMemo(() => {
        return itemTemplate.supported ? (
            itemTemplate.renderEditor({ type: "item-only", item: descriptor }, (updated) => {
                if (updated.type === "item-only") {
                    setUpdatedState(updated.item);
                }
            })
        ) : (
            <Text>Cannot edit {itemType} items.</Text>
        );
    }, [descriptor, itemTemplate, itemType]);

    return (
        <>
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
                            try {
                                await setIsHidden({
                                    variables: {
                                        contentItemId: contentItem.id,
                                        isHidden: event.target.checked,
                                    },
                                });
                                await refetch();
                            } catch (e) {
                                toast({
                                    status: "error",
                                    title: `Could not ${event.target.checked ? "hide" : "unhide"} item`,
                                });
                            }
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
            <Button
                colorScheme="green"
                size="sm"
                mt={2}
                aria-label="Save content"
                isDisabled={!updatedState}
                onClick={async () => {
                    try {
                        if (updatedState) {
                            await updateContentItem({
                                variables: {
                                    contentItemId: contentItem.id,
                                    contentItem: {
                                        data: updatedState.data,
                                    },
                                },
                            });
                            await refetch();
                            setUpdatedState(null);
                        }
                    } catch (e) {
                        toast({
                            status: "error",
                            title: "Could not save content",
                        });
                    }
                }}
            >
                Save
            </Button>
        </>
    );
}
