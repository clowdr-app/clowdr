import type { ToastId } from "@chakra-ui/react";
import { Box, useToast } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef } from "react";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../../Vonage/useVonageRoom";
import { VideoPlayer } from "../../Video/VideoPlayer";

export default function VideoChatVideoPlayer({ elementId }: { elementId: string }): JSX.Element {
    const isMicOnRef = useRef<boolean>(false);
    const vonageRoom = useVonageRoom();

    const toast = useToast();
    const playToastRef = useRef<ToastId | undefined>(undefined);
    const mutedToastIdRef = useRef<ToastId | undefined>(undefined);
    const unmutedToastIdRef = useRef<ToastId | undefined>(undefined);

    const onPlay = useCallback(() => {
        if (playToastRef.current !== undefined) {
            toast.close(playToastRef.current);
            playToastRef.current = undefined;
        }

        isMicOnRef.current = vonageRoom.state.microphoneIntendedEnabled;
        if (vonageRoom.state.microphoneIntendedEnabled) {
            vonageRoom.dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: false,
                explicitlyDisabled: false,
                onError: () => {
                    console.error("VideoChatVideoPlayer: Error auto-muting");
                },
            });
            if (unmutedToastIdRef.current !== undefined) {
                toast.close(unmutedToastIdRef.current);
                unmutedToastIdRef.current = undefined;
            }
            mutedToastIdRef.current = toast({
                title: "Auto muted",
                status: "info",
                position: "top",
                description:
                    "You have been automatically muted to avoid an audio feedback loop in the room. You will be automatically unmuted when the video is paused or ends.",
                isClosable: true,
                duration: 15000,
                variant: "subtle",
            });
        }
    }, [toast, vonageRoom]);

    const onPause = useCallback(() => {
        if (isMicOnRef.current && !vonageRoom.state.microphoneIntendedEnabled) {
            vonageRoom.dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: true,
                explicitlyDisabled: false,
                onError: () => {
                    console.error("VideoChatVideoPlayer: Error auto-un-muting");
                },
            });
            if (mutedToastIdRef.current !== undefined) {
                toast.close(mutedToastIdRef.current);
                mutedToastIdRef.current = undefined;
            }
            unmutedToastIdRef.current = toast({
                title: "Auto un-muted",
                status: "info",
                position: "top",
                isClosable: true,
                duration: 3000,
                variant: "subtle",
            });
        }
    }, [toast, vonageRoom]);

    useEffect(() => {
        // This condition is detecting when the user re-enables their mic after an auto-mute
        // i.e. overrides the auto-mute state for the first time since the auto-mute
        if (isMicOnRef.current && vonageRoom.state.microphoneIntendedEnabled) {
            // Suppress the auto-un-mute
            isMicOnRef.current = false;
        }
    }, [vonageRoom.state.microphoneIntendedEnabled]);

    useEffect(() => {
        playToastRef.current = toast({
            title: "Please click play",
            status: "success",
            position: "top",
            description:
                "The presenter would like to play a video. Please click play on the video player to join in. (Midspace cannot auto-play due to browser restrictions).",
            isClosable: true,
            duration: 15000,
            variant: "subtle",
        });
    }, [toast]);

    return (
        <Box>
            <VideoPlayer elementId={elementId} mode="CONTROLLED" onPlay={onPlay} onPause={onPause} />
        </Box>
    );
}
