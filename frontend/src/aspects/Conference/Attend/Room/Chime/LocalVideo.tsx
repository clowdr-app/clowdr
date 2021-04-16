import { Box } from "@chakra-ui/react";
import {
    useApplyVideoObjectFit,
    useAudioVideo,
    useContentShareState,
    useLocalVideo,
    useToggleLocalMute,
} from "amazon-chime-sdk-component-library-react";
import React, { useEffect, useRef } from "react";
import useCurrentAttendee from "../../../useCurrentAttendee";
import PlaceholderImage from "../PlaceholderImage";
import { VonageOverlay } from "../Vonage/VonageOverlay";

export function LocalVideo({ participantWidth }: { participantWidth: number }): JSX.Element {
    const { tileId: contentTileId } = useContentShareState();

    const { tileId, isVideoEnabled } = useLocalVideo();
    const audioVideo = useAudioVideo();
    const videoEl = useRef<HTMLVideoElement>(null);
    useApplyVideoObjectFit(videoEl);
    const attendee = useCurrentAttendee();
    const { muted } = useToggleLocalMute();

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
        <Box
            data-testid="video-tile"
            position="relative"
            flex={`0 0 ${participantWidth}px`}
            w={participantWidth}
            h={participantWidth}
        >
            <video ref={videoEl} style={{ zIndex: 100, position: "relative", height: "100%" }} />
            <Box position="absolute" left="1" bottom="1" zIndex="200" w="100%">
                <VonageOverlay
                    connectionData={JSON.stringify({ attendeeId: attendee?.id })}
                    microphoneEnabled={!muted}
                />
            </Box>
            <PlaceholderImage />
        </Box>
    );
}
