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
        rooms(where: { name: { _like: "Breakout:%" } }, order_by: { created_at: asc }) {
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
    const title = useTitle(result.data?.ContentGroup_by_pk?.title ?? "Unknown content item");

    useNoPrimaryMenuButtons();

    // TODO: Move into admin interface
    // const conference = useConference();
    // const toast = useToast();
    // const history = useHistory();
    // const [createBreakoutMutation] = useContentGroup_CreateRoomMutation();
    // const [creatingBreakout, setCreatingBreakout] = useState<boolean>(false);
    // const createBreakout = useCallback(async () => {
    //     if (!result.data?.ContentGroup_by_pk) {
    //         return;
    //     }

    //     const contentGroup = result.data.ContentGroup_by_pk;

    //     try {
    //         setCreatingBreakout(true);
    //         const { data } = await createBreakoutMutation({
    //             variables: {
    //                 conferenceId: conference.id,
    //                 contentGroupId: contentGroup.id,
    //             },
    //         });

    //         if (!data?.createContentGroupRoom || !data.createContentGroupRoom.roomId) {
    //             throw new Error(`No data returned: ${data?.createContentGroupRoom?.message}`);
    //         }

    //         const roomId = data.createContentGroupRoom.roomId;

    //         // Wait so that breakout session has a chance to be created
    //         setTimeout(() => history.push(`/conference/${conference.slug}/room/${roomId}`), 2000);
    //     } catch (e) {
    //         toast({
    //             status: "error",
    //             title: "Failed to create room.",
    //             description: e?.message,
    //         });
    //     } finally {
    //         setCreatingBreakout(false);
    //     }
    // }, [conference.id, conference.slug, createBreakoutMutation, history, result.data?.ContentGroup_by_pk, toast]);{contentGroupData.rooms.length === 0 ? (
    // <Button
    //     colorScheme="green"
    //     isLoading={creatingBreakout}
    //     onClick={createBreakout}
    //     width="100%"
    //     mt={2}
    // >
    //     Create breakout room
    // </Button>

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
                                minW={["100%", "100%", "100%", "700px"]}
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
                                                </Box>
                                            </RequireAtLeastOnePermissionWrapper>
                                        </Box>
                                        <Box ml={5} maxW="100%">
                                            <ContentGroupSummary contentGroupData={contentGroupData} />
                                            <Heading as="h3" size="lg" textAlign="left">
                                                Events
                                            </Heading>
                                            <ContentGroupEvents contentGroupEvents={contentGroupData} />
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
