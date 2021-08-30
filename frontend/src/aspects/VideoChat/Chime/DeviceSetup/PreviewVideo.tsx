import { useAudioVideo, useVideoInputs, VideoTile } from "amazon-chime-sdk-component-library-react";
import React, { useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

const StyledPreview = styled(VideoTile)`
    height: auto;
    background: unset;

    video {
        position: static;
    }
`;

export function PreviewVideo(): JSX.Element {
    const audioVideo = useAudioVideo();
    const videoEl = useRef<HTMLVideoElement>(null);
    const { selectedDevice } = useVideoInputs();
    const key = useMemo(() => uuidv4(), []);

    useEffect(() => {
        if (!audioVideo || !selectedDevice || !videoEl.current) {
            return;
        }

        const currentVideoEl = videoEl.current;

        let mounted = true;

        async function startPreview() {
            if (!audioVideo) {
                return;
            }

            await audioVideo.chooseVideoInputDevice(selectedDevice);
            if (currentVideoEl && mounted) {
                audioVideo.startVideoPreviewForVideoInput(currentVideoEl);
            }
        }

        startPreview();

        return () => {
            mounted = false;

            if (currentVideoEl) {
                audioVideo.stopVideoPreviewForVideoInput(currentVideoEl);
            }
        };
    }, [audioVideo, selectedDevice]);

    return <StyledPreview key={key} ref={videoEl} />;
}

export default PreviewVideo;
