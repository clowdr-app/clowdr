import React, { useCallback, useEffect } from "react";
import type { OpenTokActions } from "../../../Vonage/useOpenTok";
import type { OpenTokState } from "../../../Vonage/useOpenTokReducer";
import useSessionEventHandler, { EventMap } from "../../../Vonage/useSessionEventHandler";
import { useVonageRoom } from "../../../Vonage/useVonageRoom";

export function usePublisherControl(
    openTokProps: OpenTokState,
    openTokMethods: OpenTokActions,
    videoContainerRef: React.RefObject<HTMLDivElement>
): void {
    const { state, computedState } = useVonageRoom();

    useEffect(() => {
        if (!videoContainerRef.current) {
            throw new Error("No element to publish to");
        }

        if (computedState.videoTrack && openTokProps.publisher["camera"]) {
            openTokMethods.republish({
                name: "camera",
                element: videoContainerRef.current,
                options: {
                    videoSource: computedState.videoTrack?.getSettings().deviceId,
                    audioSource: computedState.audioTrack?.getSettings().deviceId,
                    publishAudio: state.microphoneIntendedEnabled,
                    publishVideo: state.cameraIntendedEnabled,
                    insertMode: "append",
                    style: {
                        nameDisplayMode: "on",
                    },
                    facingMode: "user",
                    height: 300,
                    width: 300,
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedState.videoTrack]);

    useEffect(() => {
        if (!videoContainerRef.current) {
            throw new Error("No element to publish to");
        }

        if (openTokProps.publisher["camera"] && !state.cameraIntendedEnabled) {
            openTokMethods.republish({
                name: "camera",
                element: videoContainerRef.current,
                options: {
                    videoSource: computedState.videoTrack?.getSettings().deviceId,
                    audioSource: computedState.audioTrack?.getSettings().deviceId,
                    publishAudio: state.microphoneIntendedEnabled,
                    publishVideo: state.cameraIntendedEnabled,
                    insertMode: "append",
                    style: {
                        nameDisplayMode: "on",
                    },
                    facingMode: "user",
                    height: 300,
                    width: 300,
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.cameraIntendedEnabled]);

    useEffect(() => {
        if (openTokProps.publisher["camera"]) {
            if (computedState.audioTrack) {
                openTokProps.publisher["camera"].publishAudio(true);
                openTokProps.publisher["camera"].setAudioSource(computedState.audioTrack);
            } else {
                openTokProps.publisher["camera"].publishAudio(false);
                openTokProps.publisher["camera"].setAudioSource(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedState.audioTrack]);

    const streamCreatedHandler = useCallback(
        (event: EventMap["streamCreated"]) => {
            console.log("Stream created", event.stream.streamId);
            openTokMethods.subscribe({
                stream: event.stream,
                element: videoContainerRef.current ?? undefined,
                options: {
                    insertMode: "append",
                    height: "300",
                    width: "300",
                    style: {
                        nameDisplayMode: "on",
                    },
                },
            });
        },
        [openTokMethods, videoContainerRef]
    );
    useSessionEventHandler("streamCreated", streamCreatedHandler, openTokProps.session);

    const streamDestroyedHandler = useCallback(
        (event: EventMap["streamDestroyed"]) => {
            console.log("Stream destroyed", event.stream.streamId);
            openTokMethods.unsubscribe({
                stream: event.stream,
            });
        },
        [openTokMethods]
    );
    useSessionEventHandler("streamDestroyed", streamDestroyedHandler, openTokProps.session);

    const sessionConnectedHandler = useCallback(
        async (event: EventMap["sessionConnected"]) => {
            console.log("Session connected", event.target.sessionId);

            if (!videoContainerRef.current) {
                throw new Error("No element to publish to");
            }

            if (!openTokProps.publisher["camera"]) {
                console.log("Publishing camera");
                await openTokMethods.publish({
                    name: "camera",
                    element: videoContainerRef.current,
                    options: {
                        videoSource: computedState.videoTrack?.getSettings().deviceId,
                        audioSource: computedState.audioTrack?.getSettings().deviceId,
                        publishAudio: state.microphoneIntendedEnabled,
                        publishVideo: state.cameraIntendedEnabled,
                        insertMode: "append",
                        style: {
                            nameDisplayMode: "on",
                        },
                        height: 300,
                        width: 300,
                    },
                });
            }
        },
        [
            videoContainerRef,
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
