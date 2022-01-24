import {
    AspectRatio,
    Button,
    Flex,
    Heading,
    Menu,
    MenuButton,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    Text,
    VStack,
} from "@chakra-ui/react";
import type { AudioElementBlob, VideoElementBlob } from "@midspace/shared-types/content";
import type Hls from "hls.js";
import type { HlsConfig } from "hls.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Config } from "react-player";
import ReactPlayer from "react-player";
import type { TrackProps } from "react-player/file";
import { Content_ElementType_Enum } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import useTrackView from "../../../../Realtime/Analytics/useTrackView";
import { useMediaElementUrls } from "./useMediaElement";

export interface VideoState {
    /** @summary Whether the video is currently playing. */
    playing: boolean;
    /** @summary The time offset into the video of the playhead. */
    currentTimeSeconds: number;
    /** @summary The volume of the video, from 0.0 (silent) to 1.0 (max volume). */
    volume: number;
    /** @summary The timestamp (epoch millis) of this command from which this state was derived. */
    commandTimestampMillis: number;
}

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
    onSeek?: () => void;
}): JSX.Element {
    const { video, subtitles } = useMediaElementUrls(elementData);

    const config = useMemo<Config | null>(() => {
        if (subtitles.loading) {
            return null;
        }

        const tracks: TrackProps[] = [];
        if (!subtitles.error && subtitles.url) {
            const track: TrackProps = {
                kind: "subtitles",
                src: subtitles.url,
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
                hlsVersion: "1.1.3",
                hlsOptions,
                attributes: {
                    preload: "metadata",
                },
            },
        };
    }, [subtitles.error, subtitles.loading, subtitles.url]);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const playerRef = useRef<ReactPlayer | null>(null);
    const [playbackRate, setPlaybackRate] = useState<number>(1);

    // const applyVideoState = useCallback(() => {
    //     if (playerRef.current && state) {
    //         const offset = Math.max(Date.now() - state.commandTimestampMillis, 0);
    //         playerRef.current.seekTo(state.currentTimeSeconds + offset / 1000, "seconds");
    //         setShouldPlay(state.playing);
    //         setVolume(state.volume);
    //     }
    // }, [state]);

    // useEffect(() => {
    //     if (playerRef.current && state) {
    //         const offset = Math.max(Date.now() - state.commandTimestampMillis, 0);
    //         playerRef.current.seekTo(state.currentTimeSeconds + offset / 1000, "seconds");
    //         setShouldPlay(state.playing);
    //         setVolume(state.volume);
    //     }
    // }, [state]);

    const innerPlayer = useMemo(
        () =>
            !video.url || !config ? undefined : (
                <ReactPlayer
                    url={video.url}
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
        [video.url, config, playbackRate, onPause, onPlay, onFinish]
    );

    const player = useMemo(() => {
        // Only render the player once both the video URL and the subtitles config are available
        // react-player memoizes internally and only re-renders if the url or key props change.
        return !video.url || !config ? undefined : (
            <VStack w="min(100%, 90vh * (16 / 9))" maxW="800px" alignItems="center" spacing={0}>
                {aspectRatio ? (
                    <AspectRatio ratio={16 / 9} w="min(100%, 90vh * (16 / 9))" maxW="800px" maxH="90vh" p={2}>
                        {innerPlayer}
                    </AspectRatio>
                ) : (
                    innerPlayer
                )}
                {!video.isHls ? (
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
            </VStack>
        );
    }, [video.url, video.isHls, config, aspectRatio, innerPlayer, playbackRate]);

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
            {!video.url && !subtitles.loading ? (
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
