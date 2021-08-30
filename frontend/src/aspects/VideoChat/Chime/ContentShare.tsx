import { Box } from "@chakra-ui/react";
import { useAudioVideo, useContentShareState } from "amazon-chime-sdk-component-library-react";
import React, { useEffect, useRef } from "react";

export function ContentShare(): JSX.Element {
    const audioVideo = useAudioVideo();
    const { tileId } = useContentShareState();
    const videoEl = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!audioVideo || !videoEl.current || !tileId) {
            return;
        }

        audioVideo.bindVideoElement(tileId, videoEl.current);

        return () => {
            const tile = audioVideo.getVideoTile(tileId);
            if (tile) {
                audioVideo.unbindVideoElement(tileId);
            }
        };
    }, [audioVideo, tileId]);

    return tileId ? (
        <Box data-testid="video-tile" objectFit="contain">
            <video ref={videoEl} />
        </Box>
    ) : (
        <></>
    );
}
