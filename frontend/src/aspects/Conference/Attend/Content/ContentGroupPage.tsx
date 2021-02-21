import { gql } from "@apollo/client";
import { Box, Flex, Heading, HStack, useBreakpointValue, VStack } from "@chakra-ui/react";
import React from "react";
import {
    ContentGroupDataFragment,
    ContentGroupEventsFragment,
    ContentGroupPage_ContentGroupRoomsFragment,
    Permission_Enum,
    useGetContentGroupQuery,
} from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { ContentGroupEvents } from "./ContentGroupEvents";
import { ContentGroupLive } from "./ContentGroupLive";
import { ContentGroupSummary } from "./ContentGroupSummary";
import { ContentGroupVideos } from "./ContentGroupVideos";

gql`
    query GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
            ...ContentGroupData
            ...ContentGroupEvents
            ...ContentGroupPage_ContentGroupRooms
        }
    }

    fragment ContentGroupData on ContentGroup {
        id
        title
        contentGroupTypeName
        contentItems(where: { isHidden: { _eq: false } }) {
            ...ContentItemData
        }
        people(order_by: { priority: asc }) {
            ...ContentPersonData
        }
    }

    fragment ContentGroupPage_ContentGroupRooms on ContentGroup {
        rooms(where: { originatingEventId: { _is_null: true } }, limit: 1, order_by: { created_at: asc }) {
            id
        }
    }

    fragment ContentGroupEvents on ContentGroup {
        events {
            ...ContentGroupEvent
        }
    }

    fragment ContentGroupEvent on Event {
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

export default function ContentGroupPage({ contentGroupId }: { contentGroupId: string }): JSX.Element {
    const result = useGetContentGroupQuery({
        variables: {
            contentGroupId,
        },
    });
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const title = useTitle(result.data?.ContentGroup_by_pk?.title ?? "Unknown content item");

    useNoPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceView]}
        >
            <ApolloQueryWrapper queryResult={result} getter={(data) => data.ContentGroup_by_pk}>
                {(
                    contentGroupData: ContentGroupDataFragment &
                        ContentGroupEventsFragment &
                        ContentGroupPage_ContentGroupRoomsFragment
                ) => {
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
                                            <ContentGroupVideos contentGroupData={contentGroupData} />
                                        </Box>
                                        <Box ml={5} maxW="100%">
                                            <ContentGroupSummary contentGroupData={contentGroupData}>
                                                <RequireAtLeastOnePermissionWrapper
                                                    permissions={[Permission_Enum.ConferenceViewAttendees]}
                                                >
                                                    <ContentGroupLive contentGroupData={contentGroupData} />
                                                </RequireAtLeastOnePermissionWrapper>
                                            </ContentGroupSummary>
                                            <Heading as="h3" size="lg" textAlign="left">
                                                Events
                                            </Heading>
                                            <ContentGroupEvents
                                                contentGroupEvents={contentGroupData}
                                                itemId={contentGroupId}
                                            />
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
