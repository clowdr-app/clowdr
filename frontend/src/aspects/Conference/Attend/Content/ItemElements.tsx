import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import { gql } from "@urql/core";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import type { Content_ItemType_Enum, ItemElements_ItemDataFragment } from "../../../../generated/graphql";
import { Content_ElementType_Enum, useItemElements_GetItemQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import QueryWrapper from "../../../GQL/QueryWrapper";
import useTrackView from "../../../Realtime/Analytics/useTrackView";
import { maybeCompare } from "../../../Utils/maybeCompare";
import RequireRole from "../../RequireRole";
import { AuthorList } from "./AuthorList";
import { Element } from "./Element/Element";
import ElementsGridLayout from "./Element/ElementsGridLayout";
import ExhibitionNameList from "./ExhibitionNameList";
import TagList from "./TagList";

gql`
    query ItemElements_GetItem($itemId: uuid!) @cached {
        content_Item_by_pk(id: $itemId) {
            ...ItemElements_ItemData
        }
    }

    fragment ElementData on content_Element {
        id
        itemId
        data
        layoutData
        name
        typeName
        isHidden
        hasBeenSubmitted
    }

    fragment ItemElements_JustElementData on content_Item {
        id
        conferenceId
        title
        typeName
        elements(
            where: {
                isHidden: { _eq: false }
                _or: [
                    # Component types which never get submitted
                    {
                        typeName: {
                            _in: [
                                ACTIVE_SOCIAL_ROOMS
                                CONTENT_GROUP_LIST
                                DIVIDER
                                EXPLORE_PROGRAM_BUTTON
                                EXPLORE_SCHEDULE_BUTTON
                                LIVE_PROGRAM_ROOMS
                                SPONSOR_BOOTHS
                                WHOLE_SCHEDULE
                            ]
                        }
                    }
                    # All other element types
                    { hasBeenSubmitted: { _eq: true } }
                ]
            }
        ) {
            ...ElementData
        }
    }

    fragment ItemElements_ItemData on content_Item {
        ...ItemElements_JustElementData
        itemPeople(where: { roleName: { _neq: "REVIEWER" } }, order_by: { priority: asc }) {
            ...ProgramPersonData
        }
        itemTags {
            ...ItemTagData
        }
        itemExhibitions {
            ...ItemExhibitionData
        }
    }

    fragment ItemTagData on content_ItemTag {
        id
        itemId
        tag {
            id
            name
            colour
            priority
            conferenceId
        }
    }

    fragment ItemExhibitionData on content_ItemExhibition {
        id
        itemId
        exhibition {
            id
            name
            priority
            colour
            conferenceId
        }
    }
`;

export function ItemElementsWrapper({
    itemId,
    linkToItem,
    noHeading,
}: {
    itemId: string;
    linkToItem?: boolean;
    noHeading?: boolean;
}): JSX.Element {
    const [result] = useItemElements_GetItemQuery({
        variables: {
            itemId,
        },
    });

    return (
        <QueryWrapper getter={(data) => data.content_Item_by_pk} queryResult={result}>
            {(item: ItemElements_ItemDataFragment) => (
                <ItemElements itemData={item} linkToItem={linkToItem} noHeading={noHeading} />
            )}
        </QueryWrapper>
    );
}

function formatItemTypeNameForDisplay(typeName: Content_ItemType_Enum): string {
    return typeName.replace(/_/g, " ").replace(/Q AND A/, "Q&A");
}

export function ItemElements({
    itemData,
    linkToItem,
    children,
    dontFilterOutVideos = false,
    noHeading = false,
}: {
    itemData: ItemElements_ItemDataFragment;
    linkToItem?: boolean;
    children?: React.ReactNode | React.ReactNodeArray;
    dontFilterOutVideos?: boolean;
    noHeading?: boolean;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    useTrackView(true, itemData.id, "Item", 3000);

    const zoomDetailsEls = useMemo(() => {
        return itemData.elements
            .filter((element) => element.typeName === Content_ElementType_Enum.ExternalEventLink)
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            )
            .map((item) => {
                return <Element key={item.id} element={item} />;
            });
    }, [itemData.elements]);

    const stackableEls = useMemo(() => {
        return itemData.elements
            .filter((element) =>
                [
                    Content_ElementType_Enum.PaperUrl,
                    Content_ElementType_Enum.PaperLink,
                    Content_ElementType_Enum.PaperFile,
                ].includes(element.typeName)
            )
            .sort((x, y) =>
                maybeCompare(
                    (x.layoutData as LayoutDataBlob | undefined)?.priority,
                    (y.layoutData as LayoutDataBlob | undefined)?.priority,
                    (a, b) => a - b
                )
            )
            .map((item) => {
                return <Element key={item.id} element={item} />;
            });
    }, [itemData.elements]);

    const filteredElements = useMemo(() => {
        return itemData.elements.filter((element) => {
            if (
                element.typeName !== Content_ElementType_Enum.PaperUrl &&
                element.typeName !== Content_ElementType_Enum.PaperLink &&
                element.typeName !== Content_ElementType_Enum.PaperFile &&
                element.typeName !== Content_ElementType_Enum.ExternalEventLink
            ) {
                if (
                    dontFilterOutVideos ||
                    (element.typeName !== Content_ElementType_Enum.VideoBroadcast &&
                        element.typeName !== Content_ElementType_Enum.VideoPrepublish &&
                        element.typeName !== Content_ElementType_Enum.VideoFile)
                ) {
                    return true;
                }
            }
            return false;
        });
    }, [dontFilterOutVideos, itemData.elements]);

    return (
        <Box textAlign="left" mt={5} mb={2} w="100%" overflow="hidden">
            {noHeading ? (
                <TagList my={3} tags={itemData.itemTags} />
            ) : linkToItem ? (
                <LinkButton
                    to={`${conferencePath}/item/${itemData.id}`}
                    width="auto"
                    height="auto"
                    p={3}
                    linkProps={{ mb: 5, maxW: "100%" }}
                    maxW="100%"
                >
                    <VStack alignItems="flex-start" maxW="100%">
                        <Text mb={2}>{formatItemTypeNameForDisplay(itemData.typeName)}</Text>
                        <Heading
                            as="h2"
                            size="md"
                            textAlign="left"
                            maxW="100%"
                            overflowWrap="break-word"
                            whiteSpace="normal"
                        >
                            <Twemoji className="twemoji" text={itemData.title} />
                        </Heading>
                    </VStack>
                </LinkButton>
            ) : (
                <>
                    <Text mb={2}>{formatItemTypeNameForDisplay(itemData.typeName)}</Text>
                    <Heading as="h2" size="md" textAlign="left">
                        <Twemoji className="twemoji" text={itemData.title} />
                    </Heading>
                    <TagList my={3} tags={itemData.itemTags} />
                    {itemData.itemExhibitions.length > 0 ? (
                        <VStack alignItems="flex-start" mb={3}>
                            <Text fontStyle="italic">Featured in:</Text>
                            <ExhibitionNameList mt={3} mb={5} exhibitions={itemData.itemExhibitions} />
                        </VStack>
                    ) : undefined}
                </>
            )}
            {children}
            <AuthorList programPeopleData={itemData.itemPeople ?? []} />
            <VStack
                alignItems="flex-start"
                flexWrap="wrap"
                mt={zoomDetailsEls.length || stackableEls.length ? 5 : 0}
                spacing={2}
            >
                <RequireRole attendeeRole>{zoomDetailsEls}</RequireRole>
                {stackableEls}
            </VStack>
            <ElementsGridLayout elements={filteredElements} />
        </Box>
    );
}
