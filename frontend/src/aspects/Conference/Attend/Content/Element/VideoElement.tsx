import {
    AspectRatio,
    Box,
    Button,
    Flex,
    Heading,
    Menu,
    MenuButton,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    Text,
} from "@chakra-ui/react";
import type { AudioElementBlob, VideoElementBlob } from "@clowdr-app/shared-types/build/content";
import { WebVTTConverter } from "@clowdr-app/srt-webvtt";
import AmazonS3URI from "amazon-s3-uri";
import type Hls from "hls.js";
import type { HlsConfig } from "hls.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAsync } from "react-async-hook";
import type { Config } from "react-player";
import ReactPlayer from "react-player";
import type { TrackProps } from "react-player/file";
import { Content_ElementType_Enum } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import useTrackView from "../../../../Realtime/Analytics/useTrackView";

export function VideoElement({
    elementId,
    elementData,
    title,
    aspectRatio,
    onPlay,
    onPause,
    onFinish,
}: {
    elementId?: string;
    elementData: VideoElementBlob | AudioElementBlob;
    title?: string;
    aspectRatio?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onFinish?: () => void;
}): JSX.Element {
    const { url: videoURL, isHLS } = useMemo(() => {
        let s3Url = "transcode" in elementData ? elementData.transcode?.s3Url : undefined;

        if (!s3Url && elementData.s3Url) {
            s3Url = elementData.s3Url;
        }

        if (!s3Url) {
            return { url: undefined, isHLS: false };
        }
        const { bucket, key } = new AmazonS3URI(s3Url);

        return {
            url:
                key && bucket
                    ? `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`
                    : undefined,
            isHLS: !!key?.endsWith(".m3u8"),
        };
    }, [elementData]);

    const {
        result: subtitlesUrl,
        loading,
        error,
    } = useAsync(async () => {
        if (!elementData.subtitles["en_US"] || !elementData.subtitles["en_US"].s3Url?.length) {
            return undefined;
        } else {
            try {
                const { bucket, key } = new AmazonS3URI(elementData.subtitles["en_US"].s3Url);
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
    }, [elementData.subtitles["en_US"]]);

    const config = useMemo<Config | null>(() => {
        if (loading) {
            return null;
        }

        const tracks: TrackProps[] = [];
        if (!error && subtitlesUrl) {
            const track: TrackProps = {
                kind: "subtitles",
                src: subtitlesUrl,
                srcLang: "en",
                default: false,
                label: "English",
            };

            tracks.push(track);
        }

        const hlsOptions: Partial<HlsConfig> = {
            maxBufferLength: 0.05,
            maxBufferSize: 500,
        };
        return {
            file: {
                tracks,
                hlsVersion: "1.0.4",
                hlsOptions,
                attributes: {
                    preload: "metadata",
                },
            },
        };
    }, [error, loading, subtitlesUrl]);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const playerRef = useRef<ReactPlayer | null>(null);
    const [playbackRate, setPlaybackRate] = useState<number>(1);

    const innerPlayer = useMemo(
        () =>
            !videoURL || !config ? undefined : (
                <ReactPlayer
                    url={videoURL}
                    controls={true}
                    width="100%"
                    height="auto"
                    onEnded={() => {
                        setIsPlaying(false);
                    }}
                    onError={() => {
                        setIsPlaying(false);
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        onPause?.();
                    }}
                    onPlay={() => {
                        setIsPlaying(true);
                        onPlay?.();
                        const hlsPlayer = playerRef.current?.getInternalPlayer("hls") as Hls;
                        if (hlsPlayer) {
                            hlsPlayer.config.maxBufferLength = 30;
                            hlsPlayer.config.maxBufferSize = 60 * 1000 * 1000;
                        }
                    }}
                    onProgress={({ played }) => {
                        if (played >= 1) {
                            onFinish?.();
                        }
                    }}
                    config={{ ...config }}
                    ref={playerRef}
                    style={{ borderRadius: "10px", overflow: "hidden" }}
                    playbackRate={playbackRate}
                />
            ),
        [videoURL, config, playbackRate, onPause, onPlay, onFinish]
    );

    const player = useMemo(() => {
        // Only render the player once both the video URL and the subtitles config are available
        // react-player memoizes internally and only re-renders if the url or key props change.
        return !videoURL || !config ? undefined : (
            <Box flexDir="column" width="100%">
                {aspectRatio ? (
                    <AspectRatio ratio={16 / 9} w="min(100%, 90vh * (16 / 9))" maxW="800px" maxH="90vh" p={2}>
                        {innerPlayer}
                    </AspectRatio>
                ) : (
                    innerPlayer
                )}
                {!isHLS ? (
                    <Flex borderBottomRadius="2xl" p={1} justifyContent="flex-end" w="100%">
                        <Menu>
                            <MenuButton as={Button} size="xs">
                                Speed <FAIcon iconStyle="s" icon="chevron-down" />
                            </MenuButton>
                            <MenuList size="xs" spacing="compact">
                                <MenuOptionGroup
                                    onChange={(value) => {
                                        const v = parseFloat(value as string);
                                        if (Number.isFinite(v)) {
                                            setPlaybackRate(v);
                                        } else {
                                            setPlaybackRate(1);
                                        }
                                    }}
                                    type="radio"
                                    value={playbackRate.toFixed(2)}
                                >
                                    <MenuItemOption value="0.50">0.5x</MenuItemOption>
                                    <MenuItemOption value="0.75">0.75x</MenuItemOption>
                                    <MenuItemOption value="1.00">1x</MenuItemOption>
                                    <MenuItemOption value="1.20">1.2x</MenuItemOption>
                                    <MenuItemOption value="1.50">1.5x</MenuItemOption>
                                    <MenuItemOption value="2.00">2x</MenuItemOption>
                                </MenuOptionGroup>
                            </MenuList>
                        </Menu>
                    </Flex>
                ) : undefined}
            </Box>
        );
    }, [videoURL, config, isHLS, playbackRate, setPlaybackRate, innerPlayer]);

    useEffect(() => {
        if (playerRef.current) {
            const hls: Hls = playerRef.current.getInternalPlayer("hls") as Hls;
            if (hls) {
                hls.subtitleDisplay = false;
            }
        }
    }, []);

    return (
        <>
            {title ? (
                <Heading as="h3" fontSize="2xl" mb={2} color="gray.50">
                    {title}
                </Heading>
            ) : undefined}
            {!videoURL && !loading ? (
                <Text mb={2}>
                    {elementData.type === Content_ElementType_Enum.AudioFile ? "Audio" : "Video"} not yet uploaded.
                </Text>
            ) : undefined}
            {player}
            {elementId ? <TrackVideoView elementId={elementId} isPlaying={isPlaying} /> : undefined}
        </>
    );
}

function TrackVideoView({ elementId, isPlaying }: { elementId: string; isPlaying: boolean }): JSX.Element {
    useTrackView(isPlaying, elementId, "Element");
    return <></>;
}
