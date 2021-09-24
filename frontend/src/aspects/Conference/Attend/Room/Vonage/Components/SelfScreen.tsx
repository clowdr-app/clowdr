import { useToast } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import type { VonageRoomState } from "../../../../../Vonage/useVonageRoom";
import CameraContainer from "../Components/CameraContainer";
import { CameraViewport } from "../Components/CameraViewport";
import type { VonageGlobalState } from "../VonageGlobalState";

export default function SelfScreenComponent({
    connected,
    state,
    vonage,
    registrantId,
    screen,
}: {
    connected: boolean;
    state: VonageRoomState;
    vonage: VonageGlobalState;
    registrantId: string;
    screen: OT.Publisher | null;
}): JSX.Element {
    const toast = useToast();

    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        async function fn() {
            if (connected) {
                if (state.screenShareIntendedEnabled && !screen) {
                    try {
                        await vonage.publishScreen(screenPublishContainerRef.current as HTMLElement);
                    } catch (e) {
                        console.error("Failed to publish screen", e);
                        toast({
                            status: "error",
                            title: "Failed to share screen",
                        });
                    }
                } else if (!state.screenShareIntendedEnabled && screen) {
                    try {
                        await vonage.unpublishScreen();
                    } catch (e) {
                        console.error("Failed to unpublish screen", e);
                        toast({
                            status: "error",
                            title: "Failed to unshare screen",
                        });
                    }
                }
            }
        }
        fn();
    }, [connected, state.screenShareIntendedEnabled, screen, toast, vonage]);

    return (
        <CameraViewport registrantId={registrantId} enableVideo={true}>
            <CameraContainer ref={screenPublishContainerRef} />
        </CameraViewport>
    );
}
