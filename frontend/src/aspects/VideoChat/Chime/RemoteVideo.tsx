import { Box } from "@chakra-ui/react";
import {
    useApplyVideoObjectFit,
    useAttendeeStatus,
    useAudioVideo,
    useRemoteVideoTileState,
    useRosterState,
} from "amazon-chime-sdk-component-library-react";
import React, { useEffect, useMemo, useRef } from "react";
import PlaceholderImage from "../../Conference/Attend/Room/PlaceholderImage";
import { VonageOverlay } from "../Vonage/VonageOverlay";

export function RemoteVideo({ participantWidth, tileId }: { tileId: number; participantWidth: number }): JSX.Element {
    const audioVideo = useAudioVideo();
    const videoEl = useRef<HTMLVideoElement>(null);
    useApplyVideoObjectFit(videoEl);
    const { tileIdToAttendeeId } = useRemoteVideoTileState();
    const { roster } = useRosterState();
    const borderEl = useRef<HTMLDivElement>(null);

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

    const registrantId = useMemo(() => tileIdToAttendeeId[tileId], [tileIdToAttendeeId, tileId]);
    const { muted } = useAttendeeStatus(registrantId);

    useEffect(() => {
        if (!audioVideo || !registrantId || !borderEl.current) {
            return;
        }

        let smoothedVolume = 0;

        const callback = (_: string, volume: number | null, __: boolean | null, ___: number | null) => {
            if (borderEl.current) {
                smoothedVolume -= smoothedVolume / 3;
                smoothedVolume += (volume ?? 0) / 3;
            }
        };

        const decay = setInterval(() => {
            if (borderEl.current) {
                borderEl.current.style.border = `${smoothedVolume > 0.2 ? 3 : 0}px solid green`;
            }
            smoothedVolume *= 0.5;
            if (smoothedVolume < 0.1) {
                smoothedVolume = 0;
            }
        }, 1000);

        audioVideo.realtimeSubscribeToVolumeIndicator(registrantId, callback);

        return () => {
            audioVideo.realtimeUnsubscribeFromVolumeIndicator(registrantId, callback);
            clearTimeout(decay);
        };
    }, [registrantId, audioVideo]);

    const connectionData = useMemo(
        () => JSON.stringify({ registrantId: roster[registrantId]?.externalUserId }),
        [registrantId, roster]
    );
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
                <VonageOverlay connectionData={connectionData} microphoneEnabled={!muted} />
            </Box>
            <Box
                position="absolute"
                zIndex="200"
                left="0"
                top="0"
                height="100%"
                width="100%"
                pointerEvents="none"
                ref={borderEl}
            />
            <PlaceholderImage connectionData={connectionData} />
        </Box>
    );
}
