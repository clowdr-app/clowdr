import { gql } from "@apollo/client";
import { Box, Flex, Heading, useBreakpointValue } from "@chakra-ui/react";
import React, { useEffect } from "react";
import {
    ContentGroupDataFragment,
    ContentGroupEventsFragment,
    Permission_Enum,
    useGetContentGroupQuery,
} from "../../../../generated/graphql";
import { Chat } from "../../../Chat/Chat";
import { ChatDuplicationFlags } from "../../../Chat/Configuration";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { ContentGroupEvents } from "./ContentGroupEvents";
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
                text: "Home",
                label: "Home",
            },
        ]);
    }, [conference.slug, setPrimaryMenuButtons]);

    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceView]}
        >
            <ApolloQueryWrapper queryResult={result} getter={(data) => data.ContentGroup_by_pk}>
                {(contentGroupData: ContentGroupDataFragment & ContentGroupEventsFragment) => {
                    return (
                        <>
                            {title}
                            <Flex
                                width="100%"
                                height="100%"
                                gridColumnGap={5}
                                flexWrap={stackColumns ? "wrap" : "nowrap"}
                            >
                                <Box textAlign="center" flexGrow={1} style={{ scrollbarWidth: "thin" }}>
                                    <ContentGroupVideos contentGroupData={contentGroupData} />
                                    <Box ml={5}>
                                        <ContentGroupSummary contentGroupData={contentGroupData} />
                                        <Heading as="h3" size="lg" textAlign="left">
                                            Events
                                        </Heading>
                                        <ContentGroupEvents contentGroupEvents={contentGroupData} />
                                    </Box>
                                </Box>
                                {contentGroupData.chatId ? (
                                    <Chat
                                        sources={{
                                            chatId: contentGroupData.chatId,
                                            chatLabel: "Discussion",
                                            duplication: ChatDuplicationFlags.NONE,
                                        }}
                                        width={stackColumns ? "100%" : "30%"}
                                        height="100%"
                                    />
                                ) : (
                                    <></>
                                )}
                            </Flex>
                        </>
                    );
                }}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
