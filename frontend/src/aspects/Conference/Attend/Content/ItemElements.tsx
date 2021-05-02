import { gql } from "@apollo/client";
import { Box, Container, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import {
    ElementType_Enum,
    ItemElements_ItemDataFragment,
    ItemType_Enum,
    Permission_Enum,
    useItemElements_GetItemQuery,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import useTrackView from "../../../Realtime/Analytics/useTrackView";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { AuthorList } from "./AuthorList";
import { Element } from "./Element/Element";

gql`
    query ItemElements_GetItem($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            ...ItemElements_ItemData
        }
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
        elements(where: { isHidden: { _eq: false } }) {
            ...ElementData
        }
        itemPeople(order_by: { priority: asc }) {
            ...ProgramPersonData
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
        <ApolloQueryWrapper getter={(data) => data.Item_by_pk} queryResult={result}>
            {(item: ItemElements_ItemDataFragment) => <ItemElements itemData={item} linkToItem={linkToItem} />}
        </ApolloQueryWrapper>
    );
}

function formatItemTypeNameForDisplay(typeName: ItemType_Enum): string {
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

    const abstractElement = useMemo(() => {
        const abstractItem = itemData.elements.find((element) => element.typeName === ElementType_Enum.Abstract);
        return abstractItem && <Element item={abstractItem} />;
    }, [itemData.elements]);

    const conference = useConference();

    const zoomDetailsEls = useMemo(() => {
        return itemData.elements
            .filter((element) => element.typeName === ElementType_Enum.Zoom)
            .map((item) => {
                return <Element key={item.id} item={item} />;
            });
    }, [itemData.elements]);

    const stackableEls = useMemo(() => {
        return itemData.elements
            .filter((element) =>
                [ElementType_Enum.PaperUrl, ElementType_Enum.PaperLink, ElementType_Enum.PaperFile].includes(
                    element.typeName
                )
            )
            .map((item) => {
                return <Element key={item.id} item={item} />;
            });
    }, [itemData.elements]);

    const videoURLEls = useMemo(() => {
        return itemData.elements
            .filter((element) => element.typeName === ElementType_Enum.VideoUrl)
            .map((item) => {
                return <Element key={item.id} item={item} />;
            });
    }, [itemData.elements]);

    const otherEls = useMemo(() => {
        const contentSortOrder = [
            ElementType_Enum.Abstract,
            ElementType_Enum.VideoUrl,
            ElementType_Enum.Text,
            ElementType_Enum.PaperFile,
            ElementType_Enum.PaperLink,
            ElementType_Enum.PaperUrl,
            ElementType_Enum.PosterFile,
            ElementType_Enum.PosterUrl,
            ElementType_Enum.ImageFile,
            ElementType_Enum.ImageUrl,
            ElementType_Enum.Link,
            ElementType_Enum.LinkButton,
            ElementType_Enum.VideoBroadcast,
            ElementType_Enum.VideoCountdown,
            ElementType_Enum.VideoFile,
            ElementType_Enum.VideoFiller,
            ElementType_Enum.VideoLink,
            ElementType_Enum.VideoPrepublish,
            ElementType_Enum.VideoSponsorsFiller,
            ElementType_Enum.VideoTitles,
            ElementType_Enum.Zoom,
            ElementType_Enum.ItemList,
            ElementType_Enum.WholeSchedule,
        ];

        return itemData.elements
            .filter(
                (element) =>
                    ![
                        ElementType_Enum.PaperUrl,
                        ElementType_Enum.PaperLink,
                        ElementType_Enum.PaperFile,
                        ElementType_Enum.VideoUrl,
                        ElementType_Enum.Zoom,
                        ElementType_Enum.Abstract,
                        ElementType_Enum.VideoBroadcast,
                        ElementType_Enum.VideoPrepublish,
                        ElementType_Enum.VideoFile,
                    ].includes(element.typeName)
            )
            .map((item) => {
                return <Element key={item.id} item={item} />;
            })
            .sort((x, y) => contentSortOrder.indexOf(x.type) - contentSortOrder.indexOf(y.type));
    }, [itemData.elements]);

    return (
        <Box textAlign="left" my={5} maxW="100%" overflow="hidden">
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
                        <Text colorScheme="green">{formatItemTypeNameForDisplay(itemData.typeName)}</Text>
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
                    <Text colorScheme="green">{formatItemTypeNameForDisplay(itemData.typeName)}</Text>
                    <Heading as="h2" size="md" mb={5} textAlign="left">
                        <Twemoji className="twemoji" text={itemData.title} />
                    </Heading>
                </>
            )}
            {children}
            <AuthorList programPeopleData={itemData.people ?? []} />
            <HStack alignItems="flex-start" flexWrap="wrap" mt={5}>
                <RequireAtLeastOnePermissionWrapper permissions={[Permission_Enum.ConferenceViewAttendees]}>
                    {zoomDetailsEls}
                </RequireAtLeastOnePermissionWrapper>
                {stackableEls}
            </HStack>
            <Container width="100%" mt={5} ml={0} pl={0} maxW="100%">
                {abstractElement}
            </Container>
            {videoURLEls}
            {otherEls}
        </Box>
    );
}
