import { useToast } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import type { VonageRoomState } from "../../../../../Vonage/useVonageRoom";
import CameraContainer from "../Components/CameraContainer";
import { CameraViewport } from "../Components/CameraViewport";
import type { VonageGlobalState } from "../VonageGlobalState";

export default function SelfCameraComponent({
    connected,
    state,
    vonage,
    registrantId,
    isBackstageRoom,
}: {
    connected: boolean;
    state: VonageRoomState;
    vonage: VonageGlobalState;
    registrantId: string;
    isBackstageRoom: boolean;
}): JSX.Element {
    const toast = useToast();

    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        async function fn() {
            if (connected) {
                try {
                    await vonage.publishCamera(
                        cameraPublishContainerRef.current as HTMLElement,
                        state.cameraIntendedEnabled ? state.preferredCameraId : null,
                        state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null,
                        // TODO: OR IN VIDEO-CHAT: PRESENTERS AND CHAIRS
                        isBackstageRoom ? "1280x720" : "640x480"
                    );
                } catch (err) {
                    console.error("Failed to publish camera or microphone", {
                        err,
                        cameraIntendedEnabled: state.cameraIntendedEnabled,
                        microphoneIntendedEnabled: state.microphoneIntendedEnabled,
                    });
                }
            }
        }
        fn();
    }, [
        connected,
        state.cameraIntendedEnabled,
        state.microphoneIntendedEnabled,
        state.preferredCameraId,
        state.preferredMicrophoneId,
        toast,
        vonage,
        isBackstageRoom,
    ]);

    return (
        <CameraViewport registrantId={registrantId} enableVideo={true} stream={vonage.camera?.stream}>
            <CameraContainer ref={cameraPublishContainerRef} />
        </CameraViewport>
    );
}
