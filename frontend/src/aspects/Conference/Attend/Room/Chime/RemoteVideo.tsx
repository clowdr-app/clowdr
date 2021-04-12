import { Box } from "@chakra-ui/react";
import {
    useApplyVideoObjectFit,
    useAttendeeStatus,
    useAudioVideo,
    useRemoteVideoTileState,
    useRosterState,
} from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useEffect, useMemo, useRef } from "react";
import PlaceholderImage from "../PlaceholderImage";
import { VonageOverlay } from "../Vonage/VonageOverlay";

export function RemoteVideo({ participantWidth, tileId }: { tileId: number; participantWidth: number }): JSX.Element {
    const audioVideo = useAudioVideo();
    const videoEl = useRef<HTMLVideoElement>(null);
    useApplyVideoObjectFit(videoEl);
    const { tileIdToAttendeeId } = useRemoteVideoTileState();
    const { roster } = useRosterState();

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

    const attendeeId = useMemo(() => tileIdToAttendeeId[tileId], [tileIdToAttendeeId, tileId]);
    const { muted } = useAttendeeStatus(attendeeId);

    return (
        <Box
            data-testid="video-tile"
            position="relative"
            flex={`0 0 ${participantWidth}px`}
            w={participantWidth}
            h={participantWidth}
        >
            <video ref={videoEl} style={{ zIndex: 200, position: "relative", height: "100%" }} />
            <Box position="absolute" left="1" bottom="1" zIndex="200" w="100%">
                <VonageOverlay
                    connectionData={JSON.stringify({ attendeeId: roster[attendeeId]?.externalUserId })}
                    microphoneEnabled={!muted}
                />
            </Box>
            <PlaceholderImage />
        </Box>
    );
}
