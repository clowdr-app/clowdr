import { Box } from "@chakra-ui/react";
import type Hls from "hls.js";
import type { HlsConfig } from "hls.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import useTrackView from "../../../../Realtime/Analytics/useTrackView";

export function HlsPlayer({
    roomId,
    hlsUri,
    canPlay,
    isMuted,
}: {
    roomId: string;
    hlsUri: string;
    canPlay: boolean;
    isMuted?: boolean;
}): JSX.Element {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    useTrackView(isPlaying, roomId, "Room.HLSStream");

    const playerRef = useRef<ReactPlayer | null>(null);
    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);
    const playerEl = useMemo(() => {
        const hlsOptions: Partial<HlsConfig> = {
            liveSyncDurationCount: 5,
            enableCEA708Captions: false,
            enableWebVTT: true,
        };
        return (
            <Box>
                <ReactPlayer
                    width="100%"
                    height="auto"
                    url={hlsUri}
                    config={{
                        file: {
                            hlsVersion: "1.0.2",
                            hlsOptions,
                        },
                    }}
                    ref={playerRef}
                    playing={canPlay && intendPlayStream}
                    controls={true}
                    muted={isMuted}
                    onEnded={() => {
                        setIsPlaying(false);
                    }}
                    onError={() => {
                        setIsPlaying(false);
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        setIntendPlayStream(false);
                    }}
                    onPlay={() => {
                        setIsPlaying(true);
                        setIntendPlayStream(true);
                    }}
                />
            </Box>
        );
    }, [canPlay, hlsUri, intendPlayStream, isMuted]);

    useEffect(() => {
        if (playerRef.current) {
            const hls: Hls = playerRef.current.getInternalPlayer("hls") as Hls;
            if (hls) {
                hls.subtitleDisplay = false;
            }
        }
    }, []);

    return playerEl;
}
