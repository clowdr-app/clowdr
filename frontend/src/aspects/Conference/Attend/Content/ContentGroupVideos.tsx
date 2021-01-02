import { Box, Flex, Heading } from "@chakra-ui/react";
import { assertIsContentItemDataBlob, VideoContentBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import ReactPlayer from "react-player";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";

export function ContentGroupVideos({ contentGroupData }: { contentGroupData: ContentGroupDataFragment }): JSX.Element {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

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
                            <Box
                                key={contentItem.id}
                                flexGrow={1}
                                flexShrink={1}
                                transition="max-width 1s, width 1s, margin 1s"
                                width={selectedVideoId === contentItem.id ? "100%" : "0"}
                                maxWidth={selectedVideoId && selectedVideoId === contentItem.id ? "100%" : "30%"}
                                mx={!selectedVideoId || selectedVideoId === contentItem.id ? 5 : 0}
                                visibility={
                                    !selectedVideoId || selectedVideoId === contentItem.id ? "visible" : "hidden"
                                }
                                overflow="hidden"
                            >
                                <ContentGroupVideo
                                    title={contentItem.name}
                                    videoContentItemData={latestVersion.data}
                                    onPlay={() => setSelectedVideoId(contentItem.id)}
                                    onPause={() => setSelectedVideoId(null)}
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
    }, [contentGroupData.contentItems, selectedVideoId]);
    return (
        <Flex justifyContent="center" background="gray.900" borderRadius={5} py={5}>
            {videoContentItems}
        </Flex>
    );
}

export function ContentGroupVideo({
    videoContentItemData,
    title,
    onPlay,
    onPause,
}: {
    videoContentItemData: VideoContentBlob;
    title: string;
    onPlay?: () => void;
    onPause?: () => void;
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
            <Heading as="h3" fontSize={24} mb={4} color="gray.50">
                {title}
            </Heading>
            <ReactPlayer
                url={previewTranscodeUrl}
                controls={true}
                width="100%"
                height="auto"
                onPlay={onPlay}
                onPause={onPause}
            />
        </>
    );
}
