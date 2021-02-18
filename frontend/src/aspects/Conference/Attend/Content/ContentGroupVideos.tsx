import { Box, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { assertIsContentItemDataBlob, VideoContentBlob } from "@clowdr-app/shared-types/build/content";
import { WebVTTConverter } from "@clowdr-app/srt-webvtt";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import ReactPlayer, { Config } from "react-player";
import type { TrackProps } from "react-player/file";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";

export function ContentGroupVideos({ contentGroupData }: { contentGroupData: ContentGroupDataFragment }): JSX.Element {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [slowSelectedVideoId, setSlowSelectedVideoId] = useState<string | null>(null);

    const updateSlowSelectedVideoId = useCallback(() => {
        setSlowSelectedVideoId(selectedVideoId);
    }, [selectedVideoId]);

    usePolling(updateSlowSelectedVideoId, 1500, true);

    const videoContentItems = useMemo(() => {
        return contentGroupData.contentItems
            .filter(
                (contentItem) =>
                    contentItem.contentTypeName === ContentType_Enum.VideoBroadcast ||
                    contentItem.contentTypeName === ContentType_Enum.VideoPrepublish ||
                    contentItem.contentTypeName === ContentType_Enum.VideoFile
            )
            .sort((x, y) => x.contentTypeName.localeCompare(y.contentTypeName))
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
                                transition="max-width 1s, width 1s, height 1s, margin 1s"
                                maxWidth={[
                                    "100%",
                                    "100%",
                                    slowSelectedVideoId === contentItem.id ? "70%" : slowSelectedVideoId ? "0%" : "50%",
                                ]}
                                flexBasis={0}
                                mx={5}
                                my={3}
                                visibility={[
                                    "visible",
                                    "visible",
                                    !slowSelectedVideoId || slowSelectedVideoId === contentItem.id
                                        ? "visible"
                                        : "hidden",
                                ]}
                                overflow={["visible", "visible", "hidden"]}
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
    }, [contentGroupData.contentItems, slowSelectedVideoId]);
    return videoContentItems.length === 0 ? (
        <></>
    ) : (
        <Flex
            justifyContent={["flex-start", "flex-start", "center"]}
            alignItems="center"
            background="gray.900"
            borderRadius={5}
            py={5}
            minH={["0", "0", "80vh"]}
            flexDir={["column", "column", "row"]}
        >
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
        let s3Url;

        // Special case to handle recordings for now
        if (videoContentItemData.s3Url.endsWith(".m3u8")) {
            s3Url = videoContentItemData.s3Url;
        } else {
            s3Url = videoContentItemData.transcode?.s3Url;
        }

        if (!s3Url) {
            return undefined;
        }
        const { bucket, key } = new AmazonS3URI(s3Url);

        return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
    }, [videoContentItemData.s3Url, videoContentItemData.transcode?.s3Url]);

    const { result: subtitlesUrl, loading, error } = useAsync(async () => {
        if (!videoContentItemData.subtitles["en_US"] || !videoContentItemData.subtitles["en_US"].s3Url) {
            return undefined;
        } else {
            try {
                const { bucket, key } = new AmazonS3URI(videoContentItemData.subtitles["en_US"].s3Url);
                const s3Url = `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;

                const response = await fetch(s3Url);

                if (!response.ok) {
                    throw new Error(`Could not retrieve subtitles file: ${response.status}`);
                }

                const blob = await response.blob();

                return await new WebVTTConverter(blob).getURL();
            } catch (e) {
                console.error("Failure while parsing subtitle location", e);
            }
        }
    }, [videoContentItemData.subtitles["en_US"]]);

    const subtitlesConfig = useMemo<Config | null>(() => {
        if (loading) {
            return null;
        }
        if (error || !subtitlesUrl) {
            return {};
        }
        const track: TrackProps = {
            kind: "subtitles",
            src: subtitlesUrl,
            srcLang: "en",
            default: true,
            label: "English",
        };
        return {
            file: {
                tracks: [track],
            },
        };
    }, [error, loading, subtitlesUrl]);

    const player = useMemo(() => {
        // Only render the player once both the video URL and the subtitles config are available
        // react-player memoizes internally and only re-renders if the url or key props change.
        return !previewTranscodeUrl || !subtitlesConfig ? undefined : (
            <ReactPlayer
                url={previewTranscodeUrl}
                controls={true}
                width="100%"
                height="auto"
                maxHeight="100%"
                onPlay={onPlay}
                onPause={onPause}
                config={subtitlesConfig}
                style={{ borderRadius: "10px", overflow: "hidden" }}
            />
        );
    }, [onPause, onPlay, previewTranscodeUrl, subtitlesConfig]);

    return (
        <>
            <Heading as="h3" fontSize={24} mb={4} color="gray.50">
                {title === "Livestream broadcast video"
                    ? "Lightning talk"
                    : title === "Pre-published video"
                    ? "Presentation"
                    : title}
            </Heading>
            {videoContentItemData.s3Url && (!previewTranscodeUrl || !subtitlesConfig) ? (
                <>
                    <Spinner />
                    <Text mb={2}>Video is still being processed.</Text>
                </>
            ) : undefined}
            {player}
        </>
    );
}
