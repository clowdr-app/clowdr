import { gql } from "@apollo/client";
import { Box, Container, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import {
    ContentGroupItems_ContentGroupDataFragment,
    ContentGroupType_Enum,
    ContentType_Enum,
    Permission_Enum,
    useContentGroupItems_GetContentGroupQuery,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import useTrackView from "../../../Realtime/Analytics/useTrackView";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { AuthorList } from "./AuthorList";
import { ContentItem } from "./Item/ContentItem";

gql`
    query ContentGroupItems_GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
            ...ContentGroupItems_ContentGroupData
        }
    }

    fragment ContentGroupItems_ContentGroupData on ContentGroup {
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
        contentItems(where: { isHidden: { _eq: false } }) {
            ...ContentItemData
        }
        people(order_by: { priority: asc }) {
            ...ContentPersonData
        }
    }
`;

export function ContentGroupItemsWrapper({
    contentGroupId,
    linkToItem,
}: {
    contentGroupId: string;
    linkToItem?: boolean;
}): JSX.Element {
    const result = useContentGroupItems_GetContentGroupQuery({
        variables: {
            contentGroupId,
        },
    });

    return (
        <ApolloQueryWrapper getter={(data) => data.ContentGroup_by_pk} queryResult={result}>
            {(contentGroup: ContentGroupItems_ContentGroupDataFragment) => (
                <ContentGroupItems contentGroupData={contentGroup} linkToItem={linkToItem} />
            )}
        </ApolloQueryWrapper>
    );
}

function formatContentGroupTypeNameForDisplay(typeName: ContentGroupType_Enum): string {
    return typeName.replace(/_/g, " ").replace(/Q AND A/, "Q&A");
}

export function ContentGroupItems({
    contentGroupData,
    linkToItem,
    children,
}: {
    contentGroupData: ContentGroupItems_ContentGroupDataFragment;
    linkToItem?: boolean;
    children?: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    useTrackView(true, contentGroupData.id, "ContentGroup", 3000);

    const abstractContentItem = useMemo(() => {
        const abstractItem = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Abstract
        );
        return abstractItem && <ContentItem item={abstractItem} />;
    }, [contentGroupData.contentItems]);

    const conference = useConference();

    const zoomDetailsEls = useMemo(() => {
        return contentGroupData.contentItems
            .filter((contentItem) => contentItem.contentTypeName === ContentType_Enum.Zoom)
            .map((item) => {
                return <ContentItem key={item.id} item={item} />;
            });
    }, [contentGroupData.contentItems]);

    const stackableEls = useMemo(() => {
        return contentGroupData.contentItems
            .filter((contentItem) =>
                [ContentType_Enum.PaperUrl, ContentType_Enum.PaperLink, ContentType_Enum.PaperFile].includes(
                    contentItem.contentTypeName
                )
            )
            .map((item) => {
                return <ContentItem key={item.id} item={item} />;
            });
    }, [contentGroupData.contentItems]);

    const videoURLEls = useMemo(() => {
        return contentGroupData.contentItems
            .filter((contentItem) => contentItem.contentTypeName === ContentType_Enum.VideoUrl)
            .map((item) => {
                return <ContentItem key={item.id} item={item} />;
            });
    }, [contentGroupData.contentItems]);

    const otherEls = useMemo(() => {
        const contentSortOrder = [
            ContentType_Enum.Abstract,
            ContentType_Enum.VideoUrl,
            ContentType_Enum.Text,
            ContentType_Enum.PaperFile,
            ContentType_Enum.PaperLink,
            ContentType_Enum.PaperUrl,
            ContentType_Enum.PosterFile,
            ContentType_Enum.PosterUrl,
            ContentType_Enum.ImageFile,
            ContentType_Enum.ImageUrl,
            ContentType_Enum.Link,
            ContentType_Enum.LinkButton,
            ContentType_Enum.VideoBroadcast,
            ContentType_Enum.VideoCountdown,
            ContentType_Enum.VideoFile,
            ContentType_Enum.VideoFiller,
            ContentType_Enum.VideoLink,
            ContentType_Enum.VideoPrepublish,
            ContentType_Enum.VideoSponsorsFiller,
            ContentType_Enum.VideoTitles,
            ContentType_Enum.Zoom,
            ContentType_Enum.ContentGroupList,
            ContentType_Enum.WholeSchedule,
        ];

        return contentGroupData.contentItems
            .filter(
                (contentItem) =>
                    ![
                        ContentType_Enum.PaperUrl,
                        ContentType_Enum.PaperLink,
                        ContentType_Enum.PaperFile,
                        ContentType_Enum.VideoUrl,
                        ContentType_Enum.Zoom,
                        ContentType_Enum.Abstract,
                        ContentType_Enum.VideoBroadcast,
                        ContentType_Enum.VideoPrepublish,
                        ContentType_Enum.VideoFile,
                    ].includes(contentItem.contentTypeName)
            )
            .map((item) => {
                return <ContentItem key={item.id} item={item} />;
            })
            .sort((x, y) => contentSortOrder.indexOf(x.type) - contentSortOrder.indexOf(y.type));
    }, [contentGroupData.contentItems]);

    return (
        <Box textAlign="left" my={5} maxW="100%" overflow="hidden">
            {linkToItem ? (
                <LinkButton
                    to={`/conference/${conference.slug}/item/${contentGroupData.id}`}
                    width="auto"
                    height="auto"
                    p={3}
                    linkProps={{ mb: 5, maxW: "100%" }}
                    maxW="100%"
                >
                    <VStack alignItems="flex-start" maxW="100%">
                        <Text colorScheme="green">
                            {formatContentGroupTypeNameForDisplay(contentGroupData.contentGroupTypeName)}
                        </Text>
                        <Heading
                            as="h2"
                            size="md"
                            textAlign="left"
                            maxW="100%"
                            overflowWrap="break-word"
                            whiteSpace="normal"
                        >
                            <Twemoji className="twemoji" text={contentGroupData.title} />
                        </Heading>
                    </VStack>
                </LinkButton>
            ) : (
                <>
                    <Text colorScheme="green">
                        {formatContentGroupTypeNameForDisplay(contentGroupData.contentGroupTypeName)}
                    </Text>
                    <Heading as="h2" size="md" mb={5} textAlign="left">
                        <Twemoji className="twemoji" text={contentGroupData.title} />
                    </Heading>
                </>
            )}
            {children}
            <AuthorList contentPeopleData={contentGroupData.people ?? []} />
            <HStack alignItems="flex-start" flexWrap="wrap" mt={5}>
                <RequireAtLeastOnePermissionWrapper permissions={[Permission_Enum.ConferenceViewAttendees]}>
                    {zoomDetailsEls}
                </RequireAtLeastOnePermissionWrapper>
                {stackableEls}
            </HStack>
            <Container width="100%" mt={5} ml={0} pl={0} maxW="100%">
                {abstractContentItem}
            </Container>
            {videoURLEls}
            {otherEls}
        </Box>
    );
}
