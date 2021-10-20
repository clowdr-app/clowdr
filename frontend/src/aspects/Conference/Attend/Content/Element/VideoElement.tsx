import { Heading, Text } from "@chakra-ui/react";
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
import useTrackView from "../../../../Realtime/Analytics/useTrackView";

export function VideoElement({
    elementId,
    elementData,
    title,
    onPlay,
    onPause,
    onFinish,
}: {
    elementId?: string;
    elementData: VideoElementBlob | AudioElementBlob;
    title?: string;
    onPlay?: () => void;
    onPause?: () => void;
    onFinish?: () => void;
}): JSX.Element {
    const videoURL = useMemo(() => {
        let s3Url = "transcode" in elementData ? elementData.transcode?.s3Url : undefined;

        if (!s3Url && elementData.s3Url) {
            s3Url = elementData.s3Url;
        }

        if (!s3Url) {
            return undefined;
        }
        const { bucket, key } = new AmazonS3URI(s3Url);

        return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
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
        if (error || !subtitlesUrl) {
            return {};
        }
        const track: TrackProps = {
            kind: "subtitles",
            src: subtitlesUrl,
            srcLang: "en",
            default: false,
            label: "English",
        };
        const hlsOptions: Partial<HlsConfig> = {
            maxBufferLength: 0.05,
            maxBufferSize: 500,
        };
        return {
            file: {
                tracks: [track],
                hlsVersion: "1.0.4",
                hlsOptions,
            },
        };
    }, [error, loading, subtitlesUrl]);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const playerRef = useRef<ReactPlayer | null>(null);
    const player = useMemo(() => {
        // Only render the player once both the video URL and the subtitles config are available
        // react-player memoizes internally and only re-renders if the url or key props change.
        return !videoURL || !config ? undefined : (
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
            />
        );
    }, [videoURL, config, onPause, onPlay, onFinish]);

    useEffect(() => {
        if (playerRef.current) {
            const hls: Hls = playerRef.current.getInternalPlayer("hls") as Hls;
            hls.subtitleDisplay = false;
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
