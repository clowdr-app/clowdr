import { Box } from "@chakra-ui/react";
import { useApplyVideoObjectFit, useAudioVideo } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useEffect, useRef } from "react";

export function RemoteVideo({ name, tileId }: { tileId: number; name?: string }): JSX.Element {
    const audioVideo = useAudioVideo();
    const videoEl = useRef<HTMLVideoElement>(null);
    useApplyVideoObjectFit(videoEl);

    useEffect(() => {
        if (!audioVideo || !videoEl.current) {
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

    return (
        <Box data-testid="video-tile">
            <video ref={videoEl} />
            {name && (
                <header>
                    <p>{name}</p>
                </header>
            )}
        </Box>
    );
}
