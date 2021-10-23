import { Box, Flex, HStack, useBreakpointValue, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React from "react";
import { Redirect } from "react-router-dom";
import type {
    ItemElements_ItemDataFragment,
    ItemEventFragment,
    ItemPage_ItemRoomsFragment,
} from "../../../../generated/graphql";
import { Content_ItemType_Enum, useGetItemQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { ItemElements } from "./ItemElements";
import { ItemEvents } from "./ItemEvents";
import { ItemLive } from "./ItemLive";
import { ItemVideos } from "./ItemVideos";

gql`
    query GetItem($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            ...ItemElements_ItemData
            ...ItemPage_ItemRooms
            descriptionOfExhibitions {
                id
            }
        }
        schedule_Event(
            where: { _or: [{ itemId: { _eq: $itemId } }, { exhibition: { items: { itemId: { _eq: $itemId } } } }] }
        ) {
            ...ItemEvent
        }
    }

    fragment ItemPage_ItemRooms on content_Item {
        rooms(where: { originatingEventId: { _is_null: true } }, limit: 1, order_by: { created_at: asc }) {
            id
        }
    }

    fragment ItemEvent on schedule_Event {
        startTime
        roomId
        room {
            name
            id
        }
        exhibitionId
        id
        durationSeconds
        endTime
        name
        intendedRoomModeName
    }
`;

export default function ItemPage({ itemId }: { itemId: string }): JSX.Element {
    const [result] = useGetItemQuery({
        variables: {
            itemId,
        },
    });
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const title = useTitle(result.data?.content_Item_by_pk?.title ?? "Unknown content item");
    const { conferencePath } = useAuthParameters();

    return (
        <RequireRole componentIfDenied={<PageNotFound />} attendeeRole>
            <QueryWrapper
                queryResult={result}
                getter={(data) =>
                    ({
                        ...data.content_Item_by_pk,
                        events: data.schedule_Event,
                    } as any)
                }
            >
                {(
                    itemData: ItemElements_ItemDataFragment & {
                        events: readonly ItemEventFragment[];
                        descriptionOfExhibitions: readonly { id: string }[];
                    } & ItemPage_ItemRoomsFragment
                ) => {
                    if (!itemData.title) {
                        return <PageNotFound />;
                    }

                    if (itemData.descriptionOfExhibitions.length === 1) {
                        return (
                            <Redirect to={`${conferencePath}/exhibition/${itemData.descriptionOfExhibitions[0].id}`} />
                        );
                    }

                    if (itemData.typeName === Content_ItemType_Enum.Sponsor && itemData.rooms.length > 0) {
                        return <Redirect to={`${conferencePath}/room/${itemData.rooms[0].id}`} />;
                    }

                    if (itemData.typeName === Content_ItemType_Enum.LandingPage && conferencePath) {
                        return <Redirect to={conferencePath} />;
                    }

                    return (
                        <HStack w="100%" flexWrap="wrap" alignItems="stretch">
                            <VStack
                                textAlign="left"
                                flexGrow={2.5}
                                alignItems="stretch"
                                flexBasis={0}
                                minW="100%"
                                maxW="100%"
                            >
                                {title}
                                <Flex
                                    width="100%"
                                    height="100%"
                                    gridColumnGap={5}
                                    flexWrap={stackColumns ? "wrap" : "nowrap"}
                                    maxW="100%"
                                >
                                    <Box maxW="100%" textAlign="center" flexGrow={1}>
                                        <Box>
                                            <ItemVideos itemData={itemData} />
                                        </Box>
                                        <Box maxW="100%">
                                            <ItemElements itemData={itemData}>
                                                <RequireRole attendeeRole>
                                                    <ItemLive itemData={itemData} />
                                                </RequireRole>
                                            </ItemElements>
                                            <ItemEvents events={itemData.events} itemId={itemId} />
                                        </Box>
                                    </Box>
                                </Flex>
                            </VStack>
                        </HStack>
                    );
                }}
            </QueryWrapper>
        </RequireRole>
    );
}
