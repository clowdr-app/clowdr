import { gql } from "@apollo/client";
import { Box, Flex, Heading, HStack, useBreakpointValue, VStack } from "@chakra-ui/react";
import React from "react";
import {
    ItemDataFragment,
    ItemEventsFragment,
    ItemPage_ItemRoomsFragment,
    Permissions_Permission_Enum,
    useGetItemQuery,
} from "../../../../generated/graphql";
import ConferencePageNotFound from "../../../Errors/ConferencePageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { ItemElements } from "./ItemElements";
import { ItemEvents } from "./ItemEvents";
import { ItemLive } from "./ItemLive";
import { ItemVideos } from "./ItemVideos";

gql`
    query GetItem($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            ...ItemData
            ...ItemEvents
            ...ItemPage_ItemRooms
        }
    }

    fragment ItemData on content_Item {
        id
        title
        typeName
        elements(where: { isHidden: { _eq: false } }) {
            ...ElementData
        }
        itemPeople(order_by: { priority: asc }) {
            ...ProgramPersonData
        }
    }

    fragment ItemPage_ItemRooms on content_Item {
        rooms(where: { originatingEventId: { _is_null: true } }, limit: 1, order_by: { created_at: asc }) {
            id
        }
    }

    fragment ItemEvents on content_Item {
        events {
            ...ItemEvent
        }
    }

    fragment ItemEvent on schedule_Event {
        startTime
        room {
            name
            id
        }
        id
        durationSeconds
        endTime
        name
        intendedRoomModeName
    }
`;

export default function ItemPage({ itemId }: { itemId: string }): JSX.Element {
    const result = useGetItemQuery({
        variables: {
            itemId,
        },
    });
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const title = useTitle(result.data?.content_Item_by_pk?.title ?? "Unknown content item");

    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<ConferencePageNotFound />}
            permissions={[Permissions_Permission_Enum.ConferenceView]}
        >
            <ApolloQueryWrapper queryResult={result} getter={(data) => data.content_Item_by_pk}>
                {(itemData: ItemDataFragment & ItemEventsFragment & ItemPage_ItemRoomsFragment) => {
                    return (
                        <HStack w="100%" flexWrap="wrap" alignItems="stretch">
                            <VStack
                                textAlign="left"
                                p={2}
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
                                    <Box maxW="100%" textAlign="center" flexGrow={1} style={{ scrollbarWidth: "thin" }}>
                                        <Box>
                                            <ItemVideos itemData={itemData} />
                                        </Box>
                                        <Box ml={5} maxW="100%">
                                            <ItemElements itemData={itemData}>
                                                <RequireAtLeastOnePermissionWrapper
                                                    permissions={[Permissions_Permission_Enum.ConferenceViewAttendees]}
                                                >
                                                    <ItemLive itemData={itemData} />
                                                </RequireAtLeastOnePermissionWrapper>
                                            </ItemElements>
                                            <Heading as="h3" size="lg" textAlign="left">
                                                Events
                                            </Heading>
                                            <ItemEvents itemEvents={itemData} itemId={itemId} />
                                        </Box>
                                    </Box>
                                </Flex>
                            </VStack>
                        </HStack>
                    );
                }}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
