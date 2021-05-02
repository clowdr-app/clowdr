import { Heading, Spinner, Text } from "@chakra-ui/react";
import type { VideoContentBlob } from "@clowdr-app/shared-types/build/content";
import { WebVTTConverter } from "@clowdr-app/srt-webvtt";
import AmazonS3URI from "amazon-s3-uri";
import type Hls from "hls.js";
import type { HlsConfig } from "hls.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAsync } from "react-async-hook";
import ReactPlayer, { Config } from "react-player";
import type { TrackProps } from "react-player/file";
import useTrackView from "../../../../Realtime/Analytics/useTrackView";

export function VideoElement({
    elementId,
    videoElementData,
    title,
    onPlay,
    onPause,
}: {
    elementId: string;
    videoElementData: VideoContentBlob;
    title?: string;
    onPlay?: () => void;
    onPause?: () => void;
}): JSX.Element {
    const previewTranscodeUrl = useMemo(() => {
        let s3Url;

        // Special case to handle recordings for now
        if (videoElementData.s3Url.endsWith(".m3u8")) {
            s3Url = videoElementData.s3Url;
        } else {
            s3Url = videoElementData.transcode?.s3Url;
        }

        if (!s3Url) {
            return undefined;
        }
        const { bucket, key } = new AmazonS3URI(s3Url);

        return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
    }, [videoElementData.s3Url, videoElementData.transcode?.s3Url]);

    const { result: subtitlesUrl, loading, error } = useAsync(async () => {
        if (!videoElementData.subtitles["en_US"] || !videoElementData.subtitles["en_US"].s3Url?.length) {
            return undefined;
        } else {
            try {
                const { bucket, key } = new AmazonS3URI(videoElementData.subtitles["en_US"].s3Url);
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
    }, [videoElementData.subtitles["en_US"]]);

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
                hlsVersion: "1.0.1",
                hlsOptions,
            },
        };
    }, [error, loading, subtitlesUrl]);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    useTrackView(isPlaying, elementId, "Element");

    const playerRef = useRef<ReactPlayer | null>(null);
    const player = useMemo(() => {
        // Only render the player once both the video URL and the subtitles config are available
        // react-player memoizes internally and only re-renders if the url or key props change.
        return !previewTranscodeUrl || !config ? undefined : (
            <ReactPlayer
                url={previewTranscodeUrl}
                controls={true}
                width="100%"
                height="auto"
                maxHeight="100%"
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
                config={{ ...config }}
                ref={playerRef}
                style={{ borderRadius: "10px", overflow: "hidden" }}
            />
        );
    }, [onPause, onPlay, previewTranscodeUrl, config]);

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
                    {title === "Livestream broadcast video"
                        ? "Lightning talk"
                        : title === "Pre-published video"
                        ? "Presentation"
                        : title}
                </Heading>
            ) : undefined}
            {videoElementData.s3Url && (!previewTranscodeUrl || !config) ? (
                <>
                    <Spinner />
                    <Text mb={2}>Video is still being processed.</Text>
                </>
            ) : undefined}
            {player}
        </>
    );
}
