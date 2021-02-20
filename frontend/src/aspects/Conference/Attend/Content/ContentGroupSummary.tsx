import { gql } from "@apollo/client";
import { Box, Container, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import {
    assertIsContentItemDataBlob,
    ContentBaseType,
    ContentItemDataBlob,
    isContentItemDataBlob,
    PaperFileBlob,
    PaperLinkBlob,
    PaperUrlBlob,
    VideoUrlBlob,
    ZoomBlob,
} from "@clowdr-app/shared-types/build/content";
import { notEmpty } from "@clowdr-app/shared-types/build/utils";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import ReactPlayer from "react-player";
import {
    ContentGroupSummary_ContentGroupDataFragment,
    ContentType_Enum,
    Permission_Enum,
    useContentGroupSummary_GetContentGroupQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton, LinkButton } from "../../../Chakra/LinkButton";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { Markdown } from "../../../Text/Markdown";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { AuthorList } from "./AuthorList";

gql`
    query ContentGroupSummary_GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
            ...ContentGroupSummary_ContentGroupData
        }
    }

    fragment ContentGroupSummary_ContentGroupData on ContentGroup {
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

export function ContentGroupSummaryWrapper({
    contentGroupId,
    linkToItem,
}: {
    contentGroupId: string;
    linkToItem?: boolean;
}): JSX.Element {
    const result = useContentGroupSummary_GetContentGroupQuery({
        variables: {
            contentGroupId,
        },
    });

    return (
        <ApolloQueryWrapper getter={(data) => data.ContentGroup_by_pk} queryResult={result}>
            {(contentGroup: ContentGroupSummary_ContentGroupDataFragment) => (
                <ContentGroupSummary contentGroupData={contentGroup} linkToItem={linkToItem} />
            )}
        </ApolloQueryWrapper>
    );
}

export function ContentGroupSummary({
    contentGroupData,
    linkToItem,
    children,
}: {
    contentGroupData: ContentGroupSummary_ContentGroupDataFragment;
    linkToItem?: boolean;
    children?: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const abstractContentItem = useMemo(() => {
        const abstractItem = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Abstract
        );
        try {
            assertIsContentItemDataBlob(abstractItem?.data);
            const latestVersion = R.last(abstractItem.data);

            return (
                <Box mt={5}>
                    <Markdown>
                        {latestVersion?.data.baseType === ContentBaseType.Text ? latestVersion.data.text : ""}
                    </Markdown>
                </Box>
            );
        } catch (e) {
            return <></>;
        }
    }, [contentGroupData.contentItems]);

    const conference = useConference();

    const maybeZoomDetails = useMemo(() => {
        const zoomItem = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Zoom
        );
        if (!zoomItem) {
            return undefined;
        }
        const versions = zoomItem.data as ContentItemDataBlob;
        return (R.last(versions)?.data as ZoomBlob).url;
    }, [contentGroupData.contentItems]);

    const maybePaperURL = useMemo(() => {
        const item = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.PaperUrl
        );
        if (!item) {
            return undefined;
        }
        const versions = item.data as ContentItemDataBlob;
        return (R.last(versions)?.data as PaperUrlBlob).url;
    }, [contentGroupData.contentItems]);

    const maybePaperLink = useMemo(() => {
        const item = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.PaperLink
        );
        if (!item) {
            return undefined;
        }
        const versions = item.data as ContentItemDataBlob;
        return R.last(versions)?.data as PaperLinkBlob;
    }, [contentGroupData.contentItems]);

    const paperFiles = useMemo<{ id: string; url: string; name: string }[]>(() => {
        return contentGroupData.contentItems
            .filter((contentItem) => contentItem.contentTypeName === ContentType_Enum.PaperFile)
            .map((item) => {
                if (isContentItemDataBlob(item.data)) {
                    const blob = item.data as ContentItemDataBlob;
                    const currentVersion = R.last(blob)?.data;
                    if (!currentVersion || currentVersion.type !== ContentType_Enum.PaperFile) {
                        return null;
                    }
                    const paperFile = currentVersion as PaperFileBlob;
                    try {
                        const { bucket, key } = new AmazonS3URI(paperFile.s3Url);
                        return {
                            id: item.id,
                            name: "Slides",
                            url: `https://s3.${
                                import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                            }.amazonaws.com/${bucket}/${key}`,
                        };
                    } catch (e) {
                        return null;
                    }
                }
                return null;
            })
            .filter(notEmpty);
    }, [contentGroupData.contentItems]);

    const maybeVideoURL = useMemo(() => {
        const item = contentGroupData.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.VideoUrl
        );
        if (!item) {
            return undefined;
        }
        const versions = item.data as ContentItemDataBlob;
        return R.last(versions)?.data as VideoUrlBlob;
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
                        <Text colorScheme="green">{contentGroupData.contentGroupTypeName}</Text>
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
                    <Text colorScheme="green">{contentGroupData.contentGroupTypeName}</Text>
                    <Heading as="h2" size="md" mb={5} textAlign="left">
                        <Twemoji className="twemoji" text={contentGroupData.title} />
                    </Heading>
                </>
            )}
            {children}
            <AuthorList contentPeopleData={contentGroupData.people ?? []} />
            <HStack alignItems="flex-start" flexWrap="wrap" mt={5}>
                <RequireAtLeastOnePermissionWrapper permissions={[Permission_Enum.ConferenceViewAttendees]}>
                    {maybeZoomDetails ? (
                        <ExternalLinkButton to={maybeZoomDetails} isExternal={true} colorScheme="green">
                            Go to Zoom
                        </ExternalLinkButton>
                    ) : (
                        <></>
                    )}
                </RequireAtLeastOnePermissionWrapper>
                {maybePaperURL ? (
                    <ExternalLinkButton to={maybePaperURL} isExternal={true} colorScheme="red">
                        Read the PDF
                    </ExternalLinkButton>
                ) : (
                    <></>
                )}
                {maybePaperLink ? (
                    <ExternalLinkButton to={maybePaperLink.url} isExternal={true} colorScheme="blue">
                        {maybePaperLink.text}
                    </ExternalLinkButton>
                ) : (
                    <></>
                )}
                {paperFiles.map((paperFile) => (
                    <ExternalLinkButton key={paperFile.id} to={paperFile.url} isExternal={true} colorScheme="blue">
                        {paperFile.name}
                    </ExternalLinkButton>
                ))}
                {maybeVideoURL ? (
                    <Box maxW="100%">
                        <ReactPlayer style={{ maxWidth: "100%" }} url={maybeVideoURL.url} controls={true} />
                    </Box>
                ) : undefined}
            </HStack>
            <Container width="100%" mt={5} ml={0} pl={0} maxW="100%">
                {abstractContentItem}
            </Container>
        </Box>
    );
}
