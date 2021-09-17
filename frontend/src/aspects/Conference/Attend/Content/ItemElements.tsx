import { gql } from "@apollo/client";
import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import {
    Content_ElementType_Enum,
    Content_ItemType_Enum,
    ItemElements_ItemDataFragment,
    Permissions_Permission_Enum,
    useItemElements_GetItemQuery,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import useTrackView from "../../../Realtime/Analytics/useTrackView";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { AuthorList } from "./AuthorList";
import { Element } from "./Element/Element";
import ElementsGridLayout from "./Element/ElementsGridLayout";
import ExhibitionNameList from "./ExhibitionNameList";
import TagList from "./TagList";

gql`
    query ItemElements_GetItem($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            ...ItemElements_ItemData
        }
    }

    fragment ElementData on content_Element {
        id
        data
        layoutData
        name
        typeName
    }

    fragment ItemElements_ItemData on content_Item {
        id
        title
        typeName
        chatId
        chat {
            rooms {
                id
                name
            }
        }
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
        itemPeople(order_by: { priority: asc }) {
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
        }
    }

    fragment ItemExhibitionData on content_ItemExhibition {
        id
        itemId
        exhibition {
            ...ExhibitionSummary
        }
    }
`;

export function ItemElementsWrapper({ itemId, linkToItem }: { itemId: string; linkToItem?: boolean }): JSX.Element {
    const result = useItemElements_GetItemQuery({
        variables: {
            itemId,
        },
    });

    return (
        <ApolloQueryWrapper getter={(data) => data.content_Item_by_pk} queryResult={result}>
            {(item: ItemElements_ItemDataFragment) => <ItemElements itemData={item} linkToItem={linkToItem} />}
        </ApolloQueryWrapper>
    );
}

function formatItemTypeNameForDisplay(typeName: Content_ItemType_Enum): string {
    return typeName.replace(/_/g, " ").replace(/Q AND A/, "Q&A");
}

export function ItemElements({
    itemData,
    linkToItem,
    children,
}: {
    itemData: ItemElements_ItemDataFragment;
    linkToItem?: boolean;
    children?: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    useTrackView(true, itemData.id, "Item", 3000);

    const conference = useConference();

    const zoomDetailsEls = useMemo(() => {
        return itemData.elements
            .filter((element) => element.typeName === Content_ElementType_Enum.Zoom)
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
            .map((item) => {
                return <Element key={item.id} element={item} />;
            });
    }, [itemData.elements]);

    const filteredElements = useMemo(() => {
        return itemData.elements.filter(
            (element) =>
                ![
                    Content_ElementType_Enum.PaperUrl,
                    Content_ElementType_Enum.PaperLink,
                    Content_ElementType_Enum.PaperFile,
                    Content_ElementType_Enum.Zoom,
                    Content_ElementType_Enum.VideoBroadcast,
                    Content_ElementType_Enum.VideoPrepublish,
                    Content_ElementType_Enum.VideoFile,
                ].includes(element.typeName)
        );
    }, [itemData.elements]);

    return (
        <Box textAlign="left" mt={5} mb={2} maxW="100%" overflow="hidden">
            {linkToItem ? (
                <LinkButton
                    to={`/conference/${conference.slug}/item/${itemData.id}`}
                    width="auto"
                    height="auto"
                    p={3}
                    linkProps={{ mb: 5, maxW: "100%" }}
                    maxW="100%"
                >
                    <VStack alignItems="flex-start" maxW="100%">
                        <Text colorScheme="purple" mb={2}>
                            {formatItemTypeNameForDisplay(itemData.typeName)}
                        </Text>
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
                    <Text colorScheme="purple" mb={2}>
                        {formatItemTypeNameForDisplay(itemData.typeName)}
                    </Text>
                    <Heading as="h2" size="md" textAlign="left">
                        <Twemoji className="twemoji" text={itemData.title} />
                    </Heading>
                    <TagList my={3} tags={itemData.itemTags} />
                    {itemData.itemExhibitions.length > 0 ? (
                        <VStack alignItems="flex-start" mb={3}>
                            <Text fontStyle="italic">
                                Featured in exhibition{itemData.itemExhibitions.length > 1 ? "s" : ""}:
                            </Text>
                            <ExhibitionNameList mt={3} mb={5} exhibitions={itemData.itemExhibitions} />
                        </VStack>
                    ) : undefined}
                </>
            )}
            {children}
            <AuthorList programPeopleData={itemData.itemPeople ?? []} />
            <HStack alignItems="flex-start" flexWrap="wrap" mt={zoomDetailsEls.length || stackableEls.length ? 5 : 0}>
                <RequireAtLeastOnePermissionWrapper permissions={[Permissions_Permission_Enum.ConferenceViewAttendees]}>
                    {zoomDetailsEls}
                </RequireAtLeastOnePermissionWrapper>
                {stackableEls}
            </HStack>
            <ElementsGridLayout elements={filteredElements} />
        </Box>
    );
}
