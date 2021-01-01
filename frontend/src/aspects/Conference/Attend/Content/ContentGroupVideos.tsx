import { Box, Flex, Heading } from "@chakra-ui/react";
import { assertIsContentItemDataBlob, VideoContentBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";

export function ContentGroupVideos({ contentGroupData }: { contentGroupData: ContentGroupDataFragment }): JSX.Element {
    const videoContentItems = useMemo(() => {
        return contentGroupData.contentItems
            .filter(
                (contentItem) =>
                    contentItem.contentTypeName === ContentType_Enum.VideoBroadcast ||
                    contentItem.contentTypeName === ContentType_Enum.VideoPrepublish
            )
            .map((contentItem) => {
                try {
                    assertIsContentItemDataBlob(contentItem?.data);
                    const latestVersion = R.last(contentItem.data);

                    if (latestVersion?.data.baseType === "video") {
                        return (
                            <Box flexGrow={1}>
                                <ContentGroupVideo
                                    key={contentItem.id}
                                    title={contentItem.name}
                                    videoContentItemData={latestVersion.data}
                                />
                            </Box>
                        );
                    } else {
                        return <></>;
                    }
                } catch (e) {
                    return <></>;
                }
            });
    }, [contentGroupData.contentItems]);
    return <Flex>{videoContentItems}</Flex>;
}

export function ContentGroupVideo({
    videoContentItemData,
    title,
}: {
    videoContentItemData: VideoContentBlob;
    title: string;
}): JSX.Element {
    const previewTranscodeUrl = useMemo(() => {
        if (!videoContentItemData.transcode?.s3Url) {
            return undefined;
        }
        const { bucket, key } = new AmazonS3URI(videoContentItemData.transcode.s3Url);

        return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
    }, [videoContentItemData.transcode?.s3Url]);

    return (
        <>
            <Heading as="h3" fontSize={24} mt={8} mb={4}>
                {title}
            </Heading>
            <ReactPlayer url={previewTranscodeUrl} controls={true} width="100%" height="auto" />
        </>
    );
}
