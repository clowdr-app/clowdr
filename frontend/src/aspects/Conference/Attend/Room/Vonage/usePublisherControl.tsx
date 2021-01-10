import { useToast } from "@chakra-ui/react";
import React, { useCallback, useEffect } from "react";
import { useOpenTok } from "../../../../Vonage/useOpenTok";
import useSessionEventHandler, { EventMap } from "../../../../Vonage/useSessionEventHandler";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";

export function usePublisherControl(
    cameraPublishContainerRef: React.RefObject<HTMLDivElement>,
    screenPublishContainerRef: React.RefObject<HTMLDivElement>
): void {
    const { state, computedState, dispatch } = useVonageRoom();
    const [openTokProps, openTokMethods] = useOpenTok();
    const toast = useToast();

    useEffect(() => {
        async function fn() {
            if (!screenPublishContainerRef.current) {
                console.error("No element to publish to");
                return;
            }

            if (
                state.screenShareIntendedEnabled &&
                !openTokProps.publisher["screen"] &&
                openTokProps.isSessionConnected
            ) {
                try {
                    await openTokMethods.publish({
                        name: "screen",
                        element: screenPublishContainerRef.current,
                        options: {
                            videoSource: "screen",
                            insertMode: "replace",
                            resolution: "1280x720",
                        },
                    });
                } catch (e) {
                    toast({
                        status: "error",
                        title: "Could not share screen",
                        description: "Check that you have not denied permission to share the screen in your browser.",
                    });
                    dispatch({
                        type: VonageRoomStateActionType.SetScreenShareIntendedState,
                        screenEnabled: false,
                    });
                }
            } else if (!state.screenShareIntendedEnabled && openTokProps.publisher["screen"]) {
                openTokMethods.unpublish({
                    name: "screen",
                });
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.screenShareIntendedEnabled]);

    const republish = useCallback(() => {
        if (!cameraPublishContainerRef.current) {
            throw new Error("No element to publish to");
        }

        openTokMethods.republish({
            name: "camera",
            element: cameraPublishContainerRef.current,
            options: {
                videoSource: computedState.videoTrack?.getSettings().deviceId,
                audioSource: computedState.audioTrack?.getSettings().deviceId ?? false,
                publishAudio: state.microphoneIntendedEnabled,
                publishVideo: state.cameraIntendedEnabled,
                insertMode: "append",
                style: {
                    nameDisplayMode: "on",
                },
                facingMode: "user",
                height: 300,
                width: 300,
                resolution: "1280x720",
            },
        });
    }, [
        computedState.audioTrack,
        computedState.videoTrack,
        openTokMethods,
        state.cameraIntendedEnabled,
        state.microphoneIntendedEnabled,
        cameraPublishContainerRef,
    ]);

    useEffect(() => {
        if (computedState.videoTrack) {
            if (openTokProps.isSessionConnected) {
                republish();
            }
        } else {
            if (openTokProps.publisher["camera"]) {
                if (computedState.audioTrack) {
                    openTokProps.publisher["camera"].publishVideo(false);
                } else {
                    openTokMethods.unpublish({ name: "camera" });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedState.videoTrack]);

    useEffect(() => {
        async function fn() {
            // If we have already published, just update the audio source
            if (openTokProps.publisher["camera"]) {
                if (computedState.audioTrack) {
                    try {
                        await openTokProps.publisher["camera"].setAudioSource(computedState.audioTrack);
                        openTokProps.publisher["camera"].publishAudio(true);
                    } catch (e) {
                        // The above can fail if an audio source wasn't published initially (cheers Vonage)
                        republish();
                    }
                } else if (!computedState.videoTrack) {
                    openTokMethods.unpublish({
                        name: "camera",
                    });
                } else {
                    openTokProps.publisher["camera"].publishAudio(false);
                }
                // Otherwise, publish from scratch with the audio source
            } else if (openTokProps.isSessionConnected && computedState.audioTrack) {
                if (!cameraPublishContainerRef.current) {
                    throw new Error("No element to publish to");
                }

                const videoTrack = computedState.videoTrack?.getSettings().deviceId;
                const audioTrack = computedState.audioTrack?.getSettings().deviceId;

                if (videoTrack || audioTrack) {
                    console.log("Publishing with audio track");
                    await openTokMethods.publish({
                        name: "camera",
                        element: cameraPublishContainerRef.current,
                        options: {
                            videoSource: videoTrack ?? false,
                            audioSource: audioTrack ?? false,
                            publishAudio: state.microphoneIntendedEnabled,
                            publishVideo: state.cameraIntendedEnabled,
                            insertMode: "append",
                            style: {
                                nameDisplayMode: "on",
                            },
                            height: 300,
                            width: 300,
                            resolution: "1280x720",
                        },
                    });
                }
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedState.audioTrack]);

    const sessionConnectedHandler = useCallback(
        async (event: EventMap["sessionConnected"]) => {
            console.log("Session connected", event.target.sessionId);

            if (!cameraPublishContainerRef.current) {
                throw new Error("No element to publish to");
            }

            const videoTrack = computedState.videoTrack?.getSettings().deviceId;
            const audioTrack = computedState.audioTrack?.getSettings().deviceId;

            if (!openTokProps.publisher["camera"] && (videoTrack || audioTrack)) {
                console.log("Publishing camera");
                await openTokMethods.publish({
                    name: "camera",
                    element: cameraPublishContainerRef.current,
                    options: {
                        videoSource: videoTrack ?? false,
                        audioSource: audioTrack ?? false,
                        publishAudio: state.microphoneIntendedEnabled,
                        publishVideo: state.cameraIntendedEnabled,
                        insertMode: "append",
                        style: {
                            nameDisplayMode: "on",
                        },
                        height: 300,
                        width: 300,
                        resolution: "1280x720",
                    },
                });
            }
        },
        [
            cameraPublishContainerRef,
            openTokProps.publisher,
            openTokMethods,
            computedState.videoTrack,
            computedState.audioTrack,
            state.microphoneIntendedEnabled,
            state.cameraIntendedEnabled,
        ]
    );
    useSessionEventHandler("sessionConnected", sessionConnectedHandler, openTokProps.session);

    const sessionDisconnectedHandler = useCallback(
        (event: EventMap["sessionDisconnected"]) => {
            console.log("Session disconnected", event.target.sessionId);
            if (openTokProps.publisher["camera"]) {
                console.log("Unpublishing camera");
                openTokMethods.unpublish({ name: "camera" });
            }
        },
        [openTokMethods, openTokProps.publisher]
    );
    useSessionEventHandler("sessionDisconnected", sessionDisconnectedHandler, openTokProps.session);
}
