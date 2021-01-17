import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, HStack, useBreakpointValue, useToast, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
    ContentGroupDataFragment,
    ContentGroupEventsFragment,
    Permission_Enum,
    useContentGroup_CreateRoomMutation,
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
        chat {
            room {
                id
                name
            }
        }
        rooms(where: { name: { _like: "Breakout:%" } }, order_by: { created_at: asc }) {
            id
        }
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

    mutation ContentGroup_CreateRoom($conferenceId: uuid!, $contentGroupId: uuid!) {
        createContentGroupRoom(conferenceId: $conferenceId, contentGroupId: $contentGroupId) {
            roomId
            message
        }
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
    const toast = useToast();
    const history = useHistory();

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

    const [createBreakoutMutation] = useContentGroup_CreateRoomMutation();
    const [creatingBreakout, setCreatingBreakout] = useState<boolean>(false);

    const createBreakout = useCallback(async () => {
        if (!result.data?.ContentGroup_by_pk) {
            return;
        }

        const contentGroup = result.data.ContentGroup_by_pk;

        try {
            setCreatingBreakout(true);
            const { data } = await createBreakoutMutation({
                variables: {
                    conferenceId: conference.id,
                    contentGroupId: contentGroup.id,
                },
            });

            if (!data?.createContentGroupRoom || !data.createContentGroupRoom.roomId) {
                throw new Error(`No data returned: ${data?.createContentGroupRoom?.message}`);
            }

            const roomId = data.createContentGroupRoom.roomId;

            // Wait so that breakout session has a chance to be created
            setTimeout(() => history.push(`/conference/${conference.slug}/room/${roomId}`), 2000);
        } catch (e) {
            toast({
                status: "error",
                title: "Failed to create room.",
                description: e?.message,
            });
        } finally {
            setCreatingBreakout(false);
        }
    }, [conference.id, conference.slug, createBreakoutMutation, history, result.data?.ContentGroup_by_pk, toast]);

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
                                            <RequireAtLeastOnePermissionWrapper
                                                permissions={[Permission_Enum.ConferenceViewAttendees]}
                                            >
                                                <Box
                                                    position={["static", "static", "absolute"]}
                                                    mt={[2, 2, 0]}
                                                    top="1rem"
                                                    right="1rem"
                                                >
                                                    <ContentGroupLive contentGroupData={contentGroupData} />
                                                    {contentGroupData.rooms.length === 0 ? (
                                                        <Button
                                                            colorScheme="green"
                                                            isLoading={creatingBreakout}
                                                            onClick={createBreakout}
                                                            width="100%"
                                                        >
                                                            Create breakout room
                                                        </Button>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Box>
                                            </RequireAtLeastOnePermissionWrapper>
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
