import { Box } from "@chakra-ui/react";
import {
    useApplyVideoObjectFit,
    useAudioVideo,
    useLocalVideo,
} from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useEffect, useRef } from "react";

export function LocalVideo({ nameplate }: { nameplate: string }): JSX.Element {
    const { tileId, isVideoEnabled } = useLocalVideo();
    const audioVideo = useAudioVideo();
    const videoEl = useRef<HTMLVideoElement>(null);
    useApplyVideoObjectFit(videoEl);

    useEffect(() => {
        if (!audioVideo || !tileId || !videoEl.current || !isVideoEnabled) {
            return;
        }

        audioVideo.bindVideoElement(tileId, videoEl.current);

        return () => {
            const tile = audioVideo.getVideoTile(tileId);
            if (tile) {
                audioVideo.unbindVideoElement(tileId);
            }
        };
    }, [audioVideo, tileId, isVideoEnabled]);

    return (
        <Box data-testid="video-tile">
            <video ref={videoEl} />
            {nameplate && (
                <header>
                    <p>{nameplate}</p>
                </header>
            )}
        </Box>
    );
}
