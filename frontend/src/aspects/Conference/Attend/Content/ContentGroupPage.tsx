import { gql } from "@apollo/client";
import { Box, Flex, Heading, HStack, useBreakpointValue, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import {
    ContentGroupDataFragment,
    ContentGroupEventsFragment,
    Permission_Enum,
    useGetContentGroupQuery,
} from "../../../../generated/graphql";
import { Chat } from "../../../Chat/Chat";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { ContentGroupEvents } from "./ContentGroupEvents";
import { ContentGroupLive } from "./ContentGroupLive";
import { ContentGroupSummary } from "./ContentGroupSummary";
import { ContentGroupVideos } from "./ContentGroupVideos";

gql`
    query GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
            ...ContentGroupData
            ...ContentGroupEvents
        }
    }

    fragment ContentGroupData on ContentGroup {
        id
        title
        contentGroupTypeName
        chatId
        contentItems(where: { isHidden: { _eq: false } }) {
            ...ContentItemData
        }
        people(order_by: { priority: asc }) {
            ...ContentPersonData
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
    const conference = useConference();
    const title = useTitle(result.data?.ContentGroup_by_pk?.title ?? "Unknown content item");

    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons([
            {
                key: "conference-home",
                action: `/conference/${conference.slug}`,
                text: conference.shortName,
                label: conference.shortName,
            },
        ]);
    }, [conference.shortName, conference.slug, setPrimaryMenuButtons]);

    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceView]}
        >
            <ApolloQueryWrapper queryResult={result} getter={(data) => data.ContentGroup_by_pk}>
                {(contentGroupData: ContentGroupDataFragment & ContentGroupEventsFragment) => {
                    return (
                        <HStack w="100%" flexWrap="wrap" alignItems="stretch">
                            <VStack
                                textAlign="left"
                                p={2}
                                flexGrow={2.5}
                                alignItems="stretch"
                                flexBasis={0}
                                minW={["100%", "100%", "100%", "700px"]}
                                maxW="100%"
                            >
                                {title}
                                <Flex
                                    width="100%"
                                    height="100%"
                                    gridColumnGap={5}
                                    flexWrap={stackColumns ? "wrap" : "nowrap"}
                                >
                                    <Box textAlign="center" flexGrow={1} style={{ scrollbarWidth: "thin" }}>
                                        <Box position="relative">
                                            <ContentGroupVideos contentGroupData={contentGroupData} />
                                            <Box
                                                position={["static", "static", "absolute"]}
                                                mt={[2, 2, 0]}
                                                top="1rem"
                                                right="1rem"
                                            >
                                                <ContentGroupLive contentGroupEvents={contentGroupData} />
                                            </Box>
                                        </Box>
                                        <Box ml={5}>
                                            <ContentGroupSummary contentGroupData={contentGroupData} />
                                            <Heading as="h3" size="lg" textAlign="left">
                                                Events
                                            </Heading>
                                            <ContentGroupEvents contentGroupEvents={contentGroupData} />
                                        </Box>
                                    </Box>
                                </Flex>
                            </VStack>
                            {contentGroupData.chatId ? (
                                <VStack
                                    flexGrow={1}
                                    flexBasis={0}
                                    minW={["90%", "90%", "90%", "300px"]}
                                    maxHeight={["80vh", "80vh", "80vh", "850px"]}
                                >
                                    <Chat
                                        sources={{
                                            chatId: contentGroupData.chatId,
                                            chatLabel: "Discussion",
                                        }}
                                        height="100%"
                                    />
                                </VStack>
                            ) : (
                                <></>
                            )}
                        </HStack>
                    );
                }}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
